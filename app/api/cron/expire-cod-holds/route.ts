import { NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdminEnv } from '@/lib/supabase-admin'
import { reportError } from '@/lib/observability'
import { scheduleProductsRevalidation } from '@/lib/revalidate-products'
import { sendOrderCancelledEmail } from '@/lib/order-email'
import { ORDER_STATUS } from '@/lib/order-state'

export const maxDuration = 20

// COD orders flagged by the risk engine ('COD Verification Required') decrement
// stock at placement. Left unverified, they hold inventory indefinitely — with
// rotated phone/email identities that is a cheap way to make products look
// sold out. Staff verify within the hold window (→ 'COD Pending'); anything
// still unverified after it is cancelled, restocked, and the buyer notified.
const DEFAULT_HOLD_HOURS = 48
const MAX_ROWS_PER_RUN = 50

interface HeldOrder {
  id: string
  address: { email?: string; name?: string } | null
}

function holdHours(): number {
  const parsed = Number(process.env.COD_REVIEW_HOLD_HOURS)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_HOLD_HOURS
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  // Fail closed in production if the secret is missing (mirrors the other cron
  // routes); allow the bypass in dev so it can be hit from curl.
  if (!cronSecret) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Scheduled task is not available.' }, { status: 503 })
    }
  } else if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json(
      { ok: false, error: 'Supabase admin environment is not configured.' },
      { status: 503 }
    )
  }

  const hours = holdHours()
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
  const supabase = createSupabaseAdmin()

  const { data, error } = await supabase
    .from('orders')
    .select('id, address')
    .eq('status', ORDER_STATUS.codReview)
    .lt('created_at', cutoff)
    .order('created_at', { ascending: true })
    .limit(MAX_ROWS_PER_RUN)

  if (error) {
    return NextResponse.json(
      { ok: false, error: 'Could not query held COD orders.' },
      { status: 500 }
    )
  }

  let expired = 0
  let restockFailures = 0

  for (const order of (data ?? []) as HeldOrder[]) {
    // Compare-and-set: skip an order staff verified between the query and now.
    const { data: updated, error: updateError } = await supabase
      .from('orders')
      .update({
        status: ORDER_STATUS.cancelled,
        payment_status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)
      .eq('status', ORDER_STATUS.codReview)
      .select('id')

    if (updateError) {
      reportError('cod_hold_expiry_update_failed', {
        orderId: order.id,
        reason: updateError.message,
      })
      continue
    }
    if (!updated?.length) continue

    expired += 1

    const { error: restockError } = await supabase.rpc('restock_order_inventory', {
      p_order_id: order.id,
    })
    if (restockError) {
      restockFailures += 1
      reportError('cod_hold_expiry_restock_failed', {
        orderId: order.id,
        reason: restockError.message,
      })
    }

    await sendOrderCancelledEmail({
      orderId: order.id,
      email: String(order.address?.email ?? ''),
      name: String(order.address?.name ?? ''),
      reason: `We could not verify it within ${hours} hours of placing it, so the items have been released back to stock.`,
    })
  }

  if (expired > 0) scheduleProductsRevalidation()

  return NextResponse.json({
    ok: restockFailures === 0,
    holdHours: hours,
    expired,
    restockFailures,
  })
}
