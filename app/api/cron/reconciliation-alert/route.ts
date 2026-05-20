import { NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdminEnv } from '@/lib/supabase-admin'

export const maxDuration = 10

const ALERT_AFTER_MS = 60 * 60 * 1000
const MAX_ALERT_ROWS = 25

interface ReconciliationFailure {
  id: string
  event_type: string
  provider_order_id: string | null
  provider_payment_id: string | null
  failure_reason: string | null
  created_at: string
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json(
      { ok: false, error: 'Supabase admin environment is not configured.' },
      { status: 503 }
    )
  }

  const cutoff = new Date(Date.now() - ALERT_AFTER_MS).toISOString()
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('payment_reconciliation_failures')
    .select('id, event_type, provider_order_id, provider_payment_id, failure_reason, created_at')
    .eq('resolved', false)
    .lt('created_at', cutoff)
    .order('created_at', { ascending: true })
    .limit(MAX_ALERT_ROWS)

  if (error) {
    return NextResponse.json(
      { ok: false, error: 'Could not query reconciliation failures.' },
      { status: 500 }
    )
  }

  const failures = (data ?? []) as ReconciliationFailure[]
  const alert = failures.length > 0 ? await sendOpsAlert(failures) : { sent: false, reason: 'none' }

  if (failures.length > 0 && alert.reason === 'webhook_failed') {
    return NextResponse.json(
      { ok: false, pending: failures.length, alert },
      { status: 502 }
    )
  }

  return NextResponse.json({
    ok: true,
    pending: failures.length,
    alert,
  })
}

async function sendOpsAlert(failures: ReconciliationFailure[]) {
  const webhookUrl = process.env.OPS_ALERT_WEBHOOK_URL
  if (!webhookUrl) return { sent: false, reason: 'webhook_not_configured' }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        event: 'payment_reconciliation_failures_pending',
        pending: failures.length,
        oldestCreatedAt: failures[0]?.created_at ?? null,
        failures: failures.map((failure) => ({
          id: failure.id,
          eventType: failure.event_type,
          providerOrderId: failure.provider_order_id,
          providerPaymentId: failure.provider_payment_id,
          reason: failure.failure_reason,
          createdAt: failure.created_at,
        })),
      }),
    })

    if (!response.ok) return { sent: false, reason: 'webhook_failed' }
    return { sent: true, reason: 'sent' }
  } catch {
    return { sent: false, reason: 'webhook_failed' }
  }
}
