import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { isRateLimited } from '@/lib/rate-limit'
import {
  CheckoutValidationError,
  PRODUCT_CATALOGUE_UNAVAILABLE_MESSAGE,
  normalizeCart,
  persistOrder,
  validateAddress,
  type NormalizedCartItem,
} from '@/lib/commerce'
import { getUserFromAuthorizationHeader } from '@/lib/supabase-admin'
import { requireSameOriginRequest } from '@/lib/csrf'
import { assessCodRisk } from '@/lib/cod-risk'
import { turnstileFailureMessage, verifyTurnstileFromRequest } from '@/lib/turnstile'
import { scheduleProductsRevalidation } from '@/lib/revalidate-products'
import { sendOrderConfirmationEmail } from '@/lib/order-email'

// Collapse rapid double-submits of the same COD cart into a single order.
// A prepaid checkout is deduped by its stable Razorpay order id, but a COD
// order has no upstream payment id — so a previously-random ref let a double
// click create two orders (two stock decrements, two confirmation emails). A
// deterministic ref derived from the buyer + cart + a coarse time bucket makes a
// repeat submit resolve to the same payment_id, which the orders_payment_id
// unique index and the persistOrder idempotency guard then dedupe. The window is
// coarse enough to swallow a double-click yet still lets a genuine re-order of
// the same cart minutes later create a new order.
const COD_IDEMPOTENCY_WINDOW_MS = 5 * 60_000

function codIdempotencyRef(email: string, items: NormalizedCartItem[], total: number): string {
  const bucket = Math.floor(Date.now() / COD_IDEMPOTENCY_WINDOW_MS)
  const cart = items
    .map((item) => `${item.id}:${item.qty}`)
    .sort()
    .join(',')
  const digest = createHash('sha256')
    .update(`${email}|${cart}|${total}|${bucket}`)
    .digest('hex')
    .slice(0, 12)
    .toUpperCase()
  return `COD-${bucket.toString(36).toUpperCase()}-${digest}`
}

export async function POST(request: Request) {
  try {
    const csrfFailure = requireSameOriginRequest(request)
    if (csrfFailure) return csrfFailure

    if (await isRateLimited(request, 'checkout_cod', 6, 60)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const turnstile = await verifyTurnstileFromRequest(request, body)
    if (!turnstile.ok) {
      return NextResponse.json(
        { error: turnstileFailureMessage(turnstile.reason), code: turnstile.reason },
        { status: 400 }
      )
    }

    const user = await getUserFromAuthorizationHeader(request.headers.get('authorization'))
    const address = validateAddress(body?.address)
    const { items, totals } = await normalizeCart(body?.items)

    const codRisk = assessCodRisk(address, totals, items)
    if (!codRisk.allowed) {
      return NextResponse.json(
        { error: codRisk.reason ?? 'Cash on Delivery is not available for this order.' },
        { status: 400 }
      )
    }

    const manualReview = codRisk.decision === 'manual_review'
    const codRef = codIdempotencyRef(address.email, items, totals.total)
    const order = await persistOrder({
      userId: user?.id ?? null,
      status: manualReview ? 'COD Verification Required' : 'COD Pending',
      paymentStatus: manualReview ? 'cod_review' : 'cod_pending',
      paymentMethod: 'Cash on Delivery',
      paymentId: codRef,
      paymentOrderId: null,
      address,
      items,
      totals,
      awardPoints: false,
      rawPaymentPayload: {
        payment_method: 'Cash on Delivery',
        status: manualReview ? 'COD Verification Required' : 'COD Pending',
        risk_decision: codRisk.decision,
        risk_flags: codRisk.flags,
      },
    })

    // A deduped resubmit returns the existing order — don't re-revalidate or send
    // a second confirmation email for what is the same COD order.
    if (!order.idempotent) {
      const purchasedIds = items.map((i) => i.id)
      scheduleProductsRevalidation(purchasedIds)

      void sendOrderConfirmationEmail({
        orderId: order.id,
        paymentId: codRef,
        paymentMethod: 'Cash on Delivery',
        status: manualReview ? 'COD Verification Required' : 'COD Pending',
        address,
        items,
        totals,
      })
    }

    return NextResponse.json({
      orderId: order.id,
      paymentId: codRef,
      paymentMethod: 'Cash on Delivery',
      pointsPending: totals.pointsToEarn,
      totals,
      verificationRequired: manualReview,
    })
  } catch (error) {
    console.error('[checkout/cod]', error)
    const message = error instanceof Error ? error.message : 'Unable to place COD order'
    const isPersistenceConfig = message.toLowerCase().includes('commerce persistence')
    const isCatalogueUnavailable = message === PRODUCT_CATALOGUE_UNAVAILABLE_MESSAGE

    // Fail safe: generic by default; echo the raw message only for customer-safe
    // validation errors so internal details never reach customer-facing output.
    let responseError = 'Unable to place your order right now. Please try again.'
    let code = 'CHECKOUT_COD_FAILED'
    let status = 400

    if (error instanceof CheckoutValidationError) {
      responseError = message
    } else if (isCatalogueUnavailable) {
      responseError = PRODUCT_CATALOGUE_UNAVAILABLE_MESSAGE
      code = 'PRODUCT_CATALOGUE_UNAVAILABLE'
      status = 503
    } else if (isPersistenceConfig) {
      responseError = 'Cash on Delivery is temporarily unavailable. Please try again later.'
      code = 'COMMERCE_PERSISTENCE_MISSING'
      status = 503
    }

    return NextResponse.json(
      {
        error: responseError,
        code,
      },
      { status }
    )
  }
}
