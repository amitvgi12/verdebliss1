import { NextResponse } from 'next/server'
import { requireSameOriginRequest } from '@/lib/csrf'
import { isRateLimited } from '@/lib/rate-limit'
import { CheckoutValidationError } from '@/lib/commerce'
import { reportError } from '@/lib/observability'
import { scheduleProductsRevalidation } from '@/lib/revalidate-products'
import {
  createSupabaseAdmin,
  getUserFromAuthorizationHeader,
  hasSupabaseAdminEnv,
} from '@/lib/supabase-admin'
import { OPEN_REFUND_STATUSES } from '@/lib/refunds'

interface OrderRow {
  id: string
  user_id: string
  status?: string | null
  payment_status?: string | null
  total?: number | null
}

export async function POST(request: Request) {
  try {
    const csrfFailure = requireSameOriginRequest(request)
    if (csrfFailure) return csrfFailure

    const user = await getUserFromAuthorizationHeader(request.headers.get('authorization'))
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
    if (!hasSupabaseAdminEnv()) {
      return NextResponse.json({ error: 'Order cancellation is not configured' }, { status: 503 })
    }

    if (await isRateLimited(request, 'order_cancel', 5, 300, user.id)) {
      return NextResponse.json(
        { error: 'Too many cancellation attempts. Please try again shortly.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const orderId = String(body?.orderId ?? '').trim()
    if (!orderId) throw new CheckoutValidationError('Please select an order to cancel')

    const supabase = createSupabaseAdmin()
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, status, payment_status, total')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .maybeSingle()

    // Raw DB errors stay internal; the customer-facing message is generic.
    if (orderError) throw new Error(orderError.message)
    if (!order) throw new CheckoutValidationError('Order not found for your account')

    const status = normaliseStatus((order as OrderRow).status)
    if (status.includes('delivered')) {
      throw new CheckoutValidationError(
        'Delivered orders cannot be cancelled. Please use the refund request flow.'
      )
    }
    if (status.includes('cancel')) {
      throw new CheckoutValidationError(
        'This order is already cancelled or cancellation is in progress.'
      )
    }
    if (status.includes('refunded')) {
      throw new CheckoutValidationError('This order has already been refunded.')
    }

    const typedOrder = order as OrderRow
    const isPrepaid = normaliseStatus(typedOrder.payment_status) === 'paid'
    const nextStatus = isPrepaid ? 'Cancellation Requested' : 'Cancelled'
    const now = new Date().toISOString()

    const updatePayload: Record<string, string> = {
      status: nextStatus,
      updated_at: now,
    }

    if (!isPrepaid) {
      updatePayload.payment_status = 'cancelled'
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', typedOrder.id)
      .eq('user_id', user.id)

    if (updateError) throw new Error(updateError.message)

    // Immediately-cancelled (unpaid/COD) orders return their stock now.
    // Prepaid orders restock when staff confirm the 'Cancellation Requested'
    // state (dispatch may already be in progress) — see the
    // restock_order_inventory migration notes. Best-effort: a restock failure
    // must not undo the customer's cancellation, so it is reported, not thrown.
    if (!isPrepaid) {
      const { error: restockError } = await supabase.rpc('restock_order_inventory', {
        p_order_id: typedOrder.id,
      })
      if (restockError) {
        reportError('order_cancellation_restock_failed', {
          orderId: typedOrder.id,
          reason: restockError.message,
        })
      } else {
        scheduleProductsRevalidation()
      }
    }

    let refundQueued = false
    if (isPrepaid) {
      const { data: existingRefund, error: existingRefundError } = await supabase
        .from('refunds')
        .select('id, status')
        .eq('order_id', typedOrder.id)
        .in('status', [...OPEN_REFUND_STATUSES])
        .maybeSingle()

      if (existingRefundError) throw new Error(existingRefundError.message)

      if (!existingRefund) {
        const { error: refundError } = await supabase.from('refunds').insert({
          user_id: user.id,
          order_id: typedOrder.id,
          reason: 'Customer requested cancellation before delivery.',
          status: 'requested',
          details: {
            source: 'website_order_cancellation',
            order_total: typedOrder.total,
            order_status: typedOrder.status,
            payment_status: typedOrder.payment_status,
          },
        })

        if (refundError) throw new Error(refundError.message)
        refundQueued = true
      }
    }

    return NextResponse.json({
      ok: true,
      status: nextStatus,
      refundQueued,
      message: isPrepaid
        ? 'Cancellation request received. We will stop dispatch where possible and process the eligible refund.'
        : 'Order cancelled. No payment will be collected for this order.',
    })
  } catch (error) {
    console.error('[orders/cancel]', error)
    // Echo only customer-safe validation messages; anything else (raw
    // Supabase/Postgres errors, config issues) maps to a generic message so
    // internal details never reach customer-facing output.
    const responseError =
      error instanceof CheckoutValidationError
        ? error.message
        : 'Unable to cancel this order right now. Please try again or contact support.'
    return NextResponse.json({ error: responseError }, { status: 400 })
  }
}

function normaliseStatus(status: string | null | undefined) {
  return String(status ?? '')
    .trim()
    .toLowerCase()
}
