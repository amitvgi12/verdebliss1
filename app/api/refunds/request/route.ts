import { NextResponse } from 'next/server'
import { isRateLimited } from '@/lib/rate-limit'
import { requireSameOriginRequest } from '@/lib/csrf'
import { CheckoutValidationError } from '@/lib/commerce'
import {
  createSupabaseAdmin,
  getUserFromAuthorizationHeader,
  hasSupabaseAdminEnv,
} from '@/lib/supabase-admin'
import { getRefundIneligibilityReason, OPEN_REFUND_STATUSES } from '@/lib/refunds'

export async function POST(request: Request) {
  try {
    const csrfFailure = requireSameOriginRequest(request)
    if (csrfFailure) return csrfFailure

    const user = await getUserFromAuthorizationHeader(request.headers.get('authorization'))
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
    if (!hasSupabaseAdminEnv()) {
      return NextResponse.json({ error: 'Refund service not configured' }, { status: 503 })
    }

    if (await isRateLimited(request, 'refunds', 4, 300, user.id)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const reason = String(body?.reason ?? '').trim()
    const orderId = String(body?.orderId ?? '').trim()
    if (!orderId) throw new CheckoutValidationError('Please select an order for the refund request')
    if (reason.length < 10 || reason.length > 2000) {
      throw new CheckoutValidationError(
        'Please provide a refund reason between 10 and 2000 characters'
      )
    }

    const supabase = createSupabaseAdmin()

    // Ownership, payment state, and duplicate checks are performed on the server
    // with the service role so customers cannot request refunds for arbitrary IDs.
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, status, payment_status, created_at, total')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .maybeSingle()

    // Raw DB errors stay internal; eligibility messages are customer-safe.
    if (orderError) throw new Error(orderError.message)
    if (!order) throw new CheckoutValidationError('Order not found for your account')
    const ineligibilityReason = getRefundIneligibilityReason(order)
    if (ineligibilityReason) throw new CheckoutValidationError(ineligibilityReason)

    const { data: existing, error: existingError } = await supabase
      .from('refunds')
      .select('id, status')
      .eq('order_id', orderId)
      .in('status', OPEN_REFUND_STATUSES)
      .maybeSingle()

    if (existingError) throw new Error(existingError.message)
    if (existing)
      throw new CheckoutValidationError('A refund request is already open for this order')

    const { error } = await supabase.from('refunds').insert({
      user_id: user.id,
      order_id: orderId,
      reason,
      status: 'requested',
      details: {
        source: 'website_refund_form',
        order_total: order.total,
        order_status: order.status,
        payment_status: order.payment_status,
      },
    })

    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[refunds/request]', error)
    // Echo only customer-safe validation messages; raw Supabase/Postgres
    // errors map to a generic message so internals never reach the client.
    const responseError =
      error instanceof CheckoutValidationError
        ? error.message
        : 'Unable to request a refund right now. Please try again or contact support.'
    return NextResponse.json({ error: responseError }, { status: 400 })
  }
}
