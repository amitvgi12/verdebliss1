import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { isRateLimited } from '@/lib/rate-limit'
import {
  createCheckoutSession,
  createRazorpayOrder,
  normalizeCart,
  validateAddress,
} from '@/lib/commerce'
import { getUserFromAuthorizationHeader } from '@/lib/supabase-admin'
import { requireSameOriginRequest } from '@/lib/csrf'
import { verifyTurnstileFromRequest } from '@/lib/turnstile'

export async function POST(request: Request) {
  try {
    const csrfFailure = requireSameOriginRequest(request)
    if (csrfFailure) return csrfFailure

    if (await isRateLimited(request, 'checkout_create', 10, 60)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const turnstile = await verifyTurnstileFromRequest(request, body)
    if (!turnstile.ok) {
      return NextResponse.json(
        { error: 'Verification failed', code: turnstile.reason },
        { status: 400 }
      )
    }

    const user = await getUserFromAuthorizationHeader(request.headers.get('authorization'))
    const address = validateAddress(body?.address)
    const { items, totals } = await normalizeCart(body?.items)
    // Cryptographically random receipt suffix prevents adjacent-receipt enumeration.
    const receipt = `vb_${Date.now()}_${randomBytes(4).toString('hex')}`.slice(0, 40)

    const razorpayOrder = await createRazorpayOrder(totals.total, receipt, {
      customer_email: address.email,
      customer_phone: address.phone,
      user_id: user?.id ?? 'guest',
      item_count: String(items.reduce((count, item) => count + item.qty, 0)),
    })

    const session = await createCheckoutSession({
      userId: user?.id ?? null,
      address,
      items,
      totals,
      razorpayOrder,
      receipt,
    })

    return NextResponse.json({
      checkoutSessionId: session.id,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID,
      totals,
      items,
    })
  } catch (error) {
    console.error('[checkout/create-razorpay-order]', error)
    const message = error instanceof Error ? error.message : 'Unable to create payment order'
    const lower = message.toLowerCase()
    const isRazorpayConfig = lower.includes('razorpay server credentials')
    const isPersistenceConfig = lower.includes('commerce persistence')
    return NextResponse.json(
      {
        error: isRazorpayConfig
          ? 'Online payment is not enabled yet. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the server environment.'
          : isPersistenceConfig
            ? 'Online payment is not enabled yet. Set SUPABASE_SERVICE_ROLE_KEY in the server environment.'
            : message,
        code: isRazorpayConfig
          ? 'RAZORPAY_SERVER_CREDENTIALS_MISSING'
          : isPersistenceConfig
            ? 'COMMERCE_PERSISTENCE_MISSING'
            : 'CHECKOUT_CREATE_FAILED',
      },
      { status: isRazorpayConfig || isPersistenceConfig ? 503 : 400 }
    )
  }
}
