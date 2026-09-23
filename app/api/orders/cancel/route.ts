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
import { decideCustomerCancellation } from '@/lib/order-state'

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

    const typedOrder = order as OrderRow
    // Transition rules live in lib/order-state.ts (shared with the account UI).
    const decision = decideCustomerCancellation(typedOrder)
    if (!decision.allowed) throw new CheckoutValidationError(decision.reason)

    const nextStatus = decision.nextStatus
    const now = new Date().toISOString()

    const updatePayload: Record<string, string> = {
      status: nextStatus,
      updated_at: now,
    }

    if (decision.cancelPayment) {
      updatePayload.payment_status = 'cancelled'
    }

    // Compare-and-set on the status we just read: if staff dispatched the order
    // in between, this matches no row and the customer is asked to refresh
    // instead of cancelling (and restocking) a parcel that has already left.
    const { data: updatedRows, error: updateError } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', typedOrder.id)
      .eq('user_id', user.id)
      .eq('status', typedOrder.status ?? '')
      .select('id')

    if (updateError) throw new Error(updateError.message)
    if (!updatedRows?.length) {
      throw new CheckoutValidationError(
        'This order was just updated. Please refresh your orders and try again.'
      )
    }

    // Only pre-dispatch COD orders return their stock now. Prepaid and
    // already-dispatched orders restock when staff confirm the 'Cancellation
    // Requested' state — see the restock_order_inventory migration notes.
    // Best-effort: a restock failure must not undo the customer's
    // cancellation, so it is reported, not thrown.
    if (decision.restock) {
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
    if (decision.queueRefund) {
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
      message: cancellationMessage(decision),
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

function cancellationMessage(decision: { queueRefund: boolean; nextStatus: string }) {
  if (decision.queueRefund) {
    return 'Cancellation request received. We will stop dispatch where possible and process the eligible refund.'
  }
  if (decision.nextStatus === 'Cancelled') {
    return 'Order cancelled. No payment will be collected for this order.'
  }
  return 'Your order has already been dispatched, so we have logged a cancellation request. You can also decline the parcel at delivery — no payment is collected for a declined Cash on Delivery order.'
}
