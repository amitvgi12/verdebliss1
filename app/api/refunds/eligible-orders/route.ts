import { NextResponse } from 'next/server'
import {
  createSupabaseAdmin,
  getUserFromAuthorizationHeader,
  hasSupabaseAdminEnv,
} from '@/lib/supabase-admin'
import { getRefundIneligibilityReason, OPEN_REFUND_STATUSES } from '@/lib/refunds'

interface RefundOrderRow {
  id: string
  status?: string | null
  payment_status?: string | null
  created_at?: string | null
  total?: number | null
  items?: unknown
}

export async function GET(request: Request) {
  try {
    const user = await getUserFromAuthorizationHeader(request.headers.get('authorization'))
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
    if (!hasSupabaseAdminEnv()) {
      return NextResponse.json({ error: 'Refund service not configured' }, { status: 503 })
    }

    const supabase = createSupabaseAdmin()
    const [{ data: orders, error: ordersError }, { data: openRefunds, error: refundsError }] =
      await Promise.all([
        supabase
          .from('orders')
          .select('id, status, payment_status, created_at, total, items')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('refunds')
          .select('order_id')
          .eq('user_id', user.id)
          .in('status', [...OPEN_REFUND_STATUSES]),
      ])

    if (ordersError) throw new Error(ordersError.message)
    if (refundsError) throw new Error(refundsError.message)

    const openRefundOrderIds = new Set(
      (openRefunds ?? [])
        .map((refund) => refund.order_id)
        .filter((orderId): orderId is string => typeof orderId === 'string')
    )

    const eligibleOrders = ((orders ?? []) as RefundOrderRow[]).filter(
      (order) => !openRefundOrderIds.has(order.id) && getRefundIneligibilityReason(order) === null
    )

    return NextResponse.json({ orders: eligibleOrders })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load eligible orders' },
      { status: 400 }
    )
  }
}
