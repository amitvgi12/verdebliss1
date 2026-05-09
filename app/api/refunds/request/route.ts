import { NextResponse } from 'next/server'
import { isRateLimited } from '@/lib/rate-limit'
import {
  createSupabaseAdmin,
  getUserFromAuthorizationHeader,
  hasSupabaseAdminEnv,
} from '@/lib/supabase-admin'

const REFUND_WINDOW_DAYS = 14
const OPEN_REFUND_STATUSES = ['requested', 'reviewing', 'approved']

export async function POST(request: Request) {
  try {
    if (await isRateLimited(request, 'refunds', 4, 300)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429 }
      )
    }
    const user = await getUserFromAuthorizationHeader(request.headers.get('authorization'))
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
    if (!hasSupabaseAdminEnv()) {
      return NextResponse.json({ error: 'Refund service not configured' }, { status: 503 })
    }

    const body = await request.json()
    const reason = String(body?.reason ?? '').trim()
    const orderId = String(body?.orderId ?? '').trim()
    if (!orderId) throw new Error('Please select an order for the refund request')
    if (reason.length < 10 || reason.length > 2000) {
      throw new Error('Please provide a refund reason between 10 and 2000 characters')
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

    if (orderError) throw new Error(orderError.message)
    if (!order) throw new Error('Order not found for your account')
    if (!['paid', 'cod_pending'].includes(String(order.payment_status))) {
      throw new Error('Refunds can be requested only for paid or confirmed COD orders')
    }
    if (['Cancelled', 'Refunded'].includes(String(order.status))) {
      throw new Error('This order is not eligible for a new refund request')
    }

    const createdAt = new Date(String(order.created_at)).getTime()
    const ageDays = (Date.now() - createdAt) / (24 * 60 * 60 * 1000)
    if (Number.isFinite(ageDays) && ageDays > REFUND_WINDOW_DAYS) {
      throw new Error(
        `Refund window expired. Requests are accepted within ${REFUND_WINDOW_DAYS} days.`
      )
    }

    const { data: existing, error: existingError } = await supabase
      .from('refunds')
      .select('id, status')
      .eq('order_id', orderId)
      .in('status', OPEN_REFUND_STATUSES)
      .maybeSingle()

    if (existingError) throw new Error(existingError.message)
    if (existing) throw new Error('A refund request is already open for this order')

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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to request refund' },
      { status: 400 }
    )
  }
}
