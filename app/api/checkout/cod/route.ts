import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { isRateLimited } from '@/lib/rate-limit'
import { COD_MAX_TOTAL, normalizeCart, persistOrder, validateAddress } from '@/lib/commerce'
import { getUserFromAuthorizationHeader } from '@/lib/supabase-admin'
import { requireSameOriginRequest } from '@/lib/csrf'

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
    const user = await getUserFromAuthorizationHeader(request.headers.get('authorization'))
    const address = validateAddress(body?.address)
    const { items, totals } = await normalizeCart(body?.items)

    if (totals.total > COD_MAX_TOTAL) {
      return NextResponse.json(
        { error: `Cash on Delivery is available only up to ₹${COD_MAX_TOTAL}.` },
        { status: 400 }
      )
    }

    const codRef = `COD-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`
    const order = await persistOrder({
      userId: user?.id ?? null,
      status: 'COD Pending',
      paymentStatus: 'cod_pending',
      paymentMethod: 'Cash on Delivery',
      paymentId: codRef,
      paymentOrderId: null,
      address,
      items,
      totals,
      awardPoints: false,
    })

    return NextResponse.json({
      orderId: order.id,
      paymentId: codRef,
      paymentMethod: 'Cash on Delivery',
      pointsPending: totals.pointsToEarn,
      totals,
    })
  } catch (error) {
    console.error('[checkout/cod]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to place COD order' },
      { status: 400 }
    )
  }
}
