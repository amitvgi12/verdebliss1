import { NextResponse } from 'next/server'
import { createRazorpayOrder, normalizeCart, validateAddress } from '@/lib/commerce'
import { getUserFromAuthorizationHeader } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const user = await getUserFromAuthorizationHeader(request.headers.get('authorization'))
    const address = validateAddress(body?.address)
    const { items, totals } = await normalizeCart(body?.items)
    const receipt = `vb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`.slice(0, 40)

    const razorpayOrder = await createRazorpayOrder(totals.total, receipt, {
      customer_email: address.email,
      customer_phone: address.phone,
      user_id: user?.id ?? 'guest',
      item_count: String(items.reduce((count, item) => count + item.qty, 0)),
    })

    return NextResponse.json({
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
    const isConfigError = message.toLowerCase().includes('razorpay server credentials')
    return NextResponse.json(
      {
        error: isConfigError
          ? 'Online payment is not enabled yet. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the server environment.'
          : message,
        code: isConfigError ? 'RAZORPAY_SERVER_CREDENTIALS_MISSING' : 'CHECKOUT_CREATE_FAILED',
      },
      { status: isConfigError ? 503 : 400 }
    )
  }
}
