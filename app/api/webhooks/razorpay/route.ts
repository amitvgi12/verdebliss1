import { NextResponse } from 'next/server'
import {
  completeRazorpayCheckout,
  recordPaymentEvent,
  recordReconciliationFailure,
  retryPendingReconciliations,
  verifyRazorpayWebhookSignature,
} from '@/lib/commerce'
import { reportError } from '@/lib/observability'
import { scheduleProductsRevalidation } from '@/lib/revalidate-products'

interface RazorpayWebhookEntity {
  id?: string
  order_id?: string
  amount?: number
  currency?: string
  status?: string
  method?: string | null
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

  // Best-effort DLQ retry: attempt to resolve any pending reconciliation rows
  // before processing the new event. This reduces worst-case recovery time from
  // the hourly cron interval to the typical Razorpay webhook retry interval
  // (minutes). Safe to fire-and-forget — never blocks the 200 response.
  void retryPendingReconciliations()

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

  // Razorpay retries webhooks. Once the signature is valid and the event is
  // recorded, downstream business reconciliation should not create a 400 retry
  // loop for duplicate/already-completed checkout sessions.
  //
  // Finalise only on `payment.captured`: with payment_capture:true the capture
  // is automatic and near-immediate, so an `authorized` webhook (funds held but
  // not settled, and reversible) must not create a paid order or award loyalty
  // points that a later auth reversal would strand. The event is still recorded
  // above for reconciliation; the synchronous browser verify path keeps its own
  // `authorized` tolerance where the buyer is actively completing checkout.
  if (providerOrderId && providerPaymentId && eventType === 'payment.captured') {
    try {
      const webhookOrder = await completeRazorpayCheckout({
        razorpayOrderId: providerOrderId,
        razorpayPaymentId: providerPaymentId,
        payment: {
          id: providerPaymentId,
          order_id: providerOrderId,
          amount: payment?.amount ?? 0,
          currency: payment?.currency ?? 'INR',
          status: payment?.status ?? 'captured',
          captured: payment?.status === 'captured',
          method: payment?.method ?? null,
        },
        rawPaymentPayload: event,
      })
      if (!webhookOrder.idempotent) scheduleProductsRevalidation()
      reconciliation = 'completed'
    } catch (error) {
      reconciliation = 'pending'
      const reconciliationError =
        error instanceof Error ? error.message : 'Webhook reconciliation failed'

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

  // The raw failure reason stays in the DLQ/logs — it can contain internal
  // DB/Razorpay detail and does not belong in the HTTP response.
  return NextResponse.json({ ok: true, eventType, reconciliation })
}
