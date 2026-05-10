import { NextResponse } from 'next/server'
import {
  completeRazorpayCheckout,
  recordPaymentEvent,
  recordReconciliationFailure,
  verifyRazorpayWebhookSignature,
} from '@/lib/commerce'
import { reportError } from '@/lib/observability'

interface RazorpayWebhookEntity {
  id?: string
  order_id?: string
  amount?: number
  currency?: string
  status?: string
}

function pickPaymentEntity(payload: Record<string, unknown>): RazorpayWebhookEntity | null {
  const payment = payload.payload as Record<string, unknown> | undefined
  const paymentEntity = payment?.payment as Record<string, unknown> | undefined
  const entity = paymentEntity?.entity as RazorpayWebhookEntity | undefined
  return entity ?? null
}

function pickOrderEntity(payload: Record<string, unknown>): RazorpayWebhookEntity | null {
  const wrapper = payload.payload as Record<string, unknown> | undefined
  const order = wrapper?.order as Record<string, unknown> | undefined
  const entity = order?.entity as RazorpayWebhookEntity | undefined
  return entity ?? null
}

export async function POST(request: Request) {
  // IMPORTANT: read the raw body. JSON.parse-then-re-stringify breaks the
  // signature because Razorpay signs the bytes-on-the-wire, not a normalised
  // form. The signature header is the only thing that authenticates this call.
  const rawBody = await request.text()
  const signature = request.headers.get('x-razorpay-signature') ?? ''

  if (!signature || !verifyRazorpayWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  let event: Record<string, unknown>
  try {
    event = JSON.parse(rawBody) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
  }

  const eventType = String(event.event ?? 'unknown')
  const payment = pickPaymentEntity(event)
  const order = pickOrderEntity(event)
  const providerOrderId = payment?.order_id ?? order?.id ?? null
  const providerPaymentId = payment?.id ?? null

  await recordPaymentEvent({
    providerOrderId,
    providerPaymentId,
    eventType,
    amount: typeof payment?.amount === 'number' ? payment.amount / 100 : null,
    currency: payment?.currency ?? order?.currency ?? 'INR',
    verified: true,
    payload: event,
  })

  let reconciliation: 'not_applicable' | 'completed' | 'pending' = 'not_applicable'
  let reconciliationError: string | undefined

  // Razorpay retries webhooks. Once the signature is valid and the event is
  // recorded, downstream business reconciliation should not create a 400 retry
  // loop for duplicate/already-completed checkout sessions.
  if (
    providerOrderId &&
    providerPaymentId &&
    ['payment.captured', 'payment.authorized'].includes(eventType)
  ) {
    try {
      await completeRazorpayCheckout({
        razorpayOrderId: providerOrderId,
        razorpayPaymentId: providerPaymentId,
        payment: {
          id: providerPaymentId,
          order_id: providerOrderId,
          amount: payment?.amount ?? 0,
          currency: payment?.currency ?? 'INR',
          status: payment?.status ?? 'captured',
          captured: payment?.status === 'captured',
        },
        rawPaymentPayload: event,
      })
      reconciliation = 'completed'
    } catch (error) {
      reconciliation = 'pending'
      reconciliationError = error instanceof Error ? error.message : 'Webhook reconciliation failed'

      // Persist to DLQ so an admin / cron can retry without racing Razorpay.
      await recordReconciliationFailure({
        eventType,
        providerOrderId,
        providerPaymentId,
        payload: event,
        failureReason: reconciliationError,
      })

      // Structured signal for log-based alerting (and Sentry if wired).
      reportError('payment_reconciliation_failed', {
        providerOrderId,
        providerPaymentId,
        eventType,
        reason: reconciliationError,
      })
    }
  }

  return NextResponse.json({ ok: true, eventType, reconciliation, reconciliationError })
}
