import { NextResponse } from 'next/server'
import { COD_MAX_TOTAL, normalizeCart, persistOrder, validateAddress } from '@/lib/commerce'
import { getUserFromAuthorizationHeader } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  try {
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

    const codRef = `COD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
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
