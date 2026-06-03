import { NextResponse } from 'next/server'
import { isRateLimited } from '@/lib/rate-limit'
import { requireSameOriginRequest } from '@/lib/csrf'
import { completeRazorpayCheckout, verifyRazorpaySignature } from '@/lib/commerce'
import { scheduleProductsRevalidation } from '@/lib/revalidate-products'
import { sendOrderConfirmationEmail } from '@/lib/order-email'

export async function POST(request: Request) {
  try {
    const csrfFailure = requireSameOriginRequest(request)
    if (csrfFailure) return csrfFailure

    if (await isRateLimited(request, 'checkout_verify', 20, 60)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429 }
      )
    }
    const body = await request.json()
    const razorpayOrderId = String(body?.razorpay_order_id ?? '')
    const razorpayPaymentId = String(body?.razorpay_payment_id ?? '')
    const razorpaySignature = String(body?.razorpay_signature ?? '')

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: 'Missing Razorpay verification fields' }, { status: 400 })
    }

    if (!verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    // Browser-submitted cart/address data is intentionally ignored here. The
    // order is created from the trusted checkout_sessions row created by the
    // server before opening the Razorpay modal.
    const completed = await completeRazorpayCheckout({
      razorpayOrderId,
      razorpayPaymentId,
      rawPaymentPayload: body as Record<string, unknown>,
    })

    if (!completed.idempotent) {
      scheduleProductsRevalidation()
      if (completed.address && completed.items) {
        void sendOrderConfirmationEmail({
          orderId: completed.orderId,
          paymentId: razorpayPaymentId,
          paymentMethod: completed.paymentMethod ?? 'Razorpay',
          status: 'Processing',
          address: completed.address,
          items: completed.items,
          totals: completed.totals,
        })
      }
    }

    return NextResponse.json({
      orderId: completed.orderId,
      paymentId: razorpayPaymentId,
      paymentMethod: completed.paymentMethod,
      pointsAwarded: completed.pointsAwarded,
      totals: completed.totals,
      idempotent: completed.idempotent,
    })
  } catch (error) {
    console.error('[checkout/verify-razorpay]', error)
    const message = error instanceof Error ? error.message : 'Payment verification failed'
    const lower = message.toLowerCase()
    const isSecretConfig = lower.includes('razorpay secret')
    const isPersistenceConfig = lower.includes('commerce persistence')
    return NextResponse.json(
      {
        error:
          isSecretConfig || isPersistenceConfig
            ? 'Online payment is temporarily unavailable. Please try again later.'
            : message,
        code: isSecretConfig
          ? 'RAZORPAY_SECRET_MISSING'
          : isPersistenceConfig
            ? 'COMMERCE_PERSISTENCE_MISSING'
            : 'PAYMENT_VERIFY_FAILED',
      },
      { status: isSecretConfig || isPersistenceConfig ? 503 : 400 }
    )
  }
}
