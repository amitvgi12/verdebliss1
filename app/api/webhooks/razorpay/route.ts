import { NextResponse } from 'next/server'
import {
  completeRazorpayCheckout,
  recordPaymentEvent,
  verifyRazorpayWebhookSignature,
} from '@/lib/commerce'

interface RazorpayWebhookEntity {
  id?: string
  order_id?: string
  amount?: number
  currency?: string
  status?: string
}

function pickPaymentEntity(payload: Record<string, unknown>): RazorpayWebhookEntity | null {
  const payment = payload?.payload as Record<string, unknown> | undefined
  const paymentEntity = payment?.payment as Record<string, unknown> | undefined
  const entity = paymentEntity?.entity as RazorpayWebhookEntity | undefined
  return entity ?? null
}

function pickOrderEntity(payload: Record<string, unknown>): RazorpayWebhookEntity | null {
  const wrapper = payload?.payload as Record<string, unknown> | undefined
  const order = wrapper?.order as Record<string, unknown> | undefined
  const entity = order?.entity as RazorpayWebhookEntity | undefined
  return entity ?? null
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-razorpay-signature') ?? ''

  try {
    if (!signature || !verifyRazorpayWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
    }

    const event = JSON.parse(rawBody) as Record<string, unknown>
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

    // Webhooks are the reconciliation source of truth. If a payment succeeds but
    // the browser callback is lost, the checkout session can still be completed.
    if (
      providerOrderId &&
      providerPaymentId &&
      ['payment.captured', 'payment.authorized'].includes(eventType)
    ) {
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
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[webhooks/razorpay]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 400 }
    )
  }
}
