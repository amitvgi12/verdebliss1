import { NextResponse } from 'next/server'
import {
  normalizeCart,
  persistOrder,
  validateAddress,
  verifyRazorpaySignature,
} from '@/lib/commerce'
import { getUserFromAuthorizationHeader } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  try {
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

    const user = await getUserFromAuthorizationHeader(request.headers.get('authorization'))
    const address = validateAddress(body?.address)
    const { items, totals } = await normalizeCart(body?.items)

    const order = await persistOrder({
      userId: user?.id ?? null,
      status: 'Processing',
      paymentStatus: 'paid',
      paymentMethod: 'Razorpay',
      paymentId: razorpayPaymentId,
      paymentOrderId: razorpayOrderId,
      address,
      items,
      totals,
      awardPoints: Boolean(user?.id),
    })

    return NextResponse.json({
      orderId: order.id,
      paymentId: razorpayPaymentId,
      paymentMethod: 'Razorpay',
      pointsAwarded: order.pointsAwarded,
      totals,
    })
  } catch (error) {
    console.error('[checkout/verify-razorpay]', error)
    const message = error instanceof Error ? error.message : 'Payment verification failed'
    const isConfigError = message.toLowerCase().includes('razorpay secret')
    return NextResponse.json(
      {
        error: isConfigError
          ? 'Online payment verification is not enabled yet. Set RAZORPAY_KEY_SECRET in the server environment.'
          : message,
        code: isConfigError ? 'RAZORPAY_SECRET_MISSING' : 'PAYMENT_VERIFY_FAILED',
      },
      { status: isConfigError ? 503 : 400 }
    )
  }
}
