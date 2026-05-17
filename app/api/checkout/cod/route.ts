import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { isRateLimited } from '@/lib/rate-limit'
import { normalizeCart, persistOrder, validateAddress } from '@/lib/commerce'
import { getUserFromAuthorizationHeader } from '@/lib/supabase-admin'
import { requireSameOriginRequest } from '@/lib/csrf'
import { assessCodRisk } from '@/lib/cod-risk'

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

    const codRisk = assessCodRisk(address, totals, items)
    if (!codRisk.allowed) {
      return NextResponse.json(
        { error: codRisk.reason ?? 'Cash on Delivery is not available for this order.' },
        { status: 400 }
      )
    }

    const manualReview = codRisk.decision === 'manual_review'
    const codRef = `COD-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`
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
    return NextResponse.json(
      {
        error: isPersistenceConfig
          ? 'Cash on Delivery is not enabled yet. Set SUPABASE_SERVICE_ROLE_KEY in the server environment.'
          : message,
        code: isPersistenceConfig ? 'COMMERCE_PERSISTENCE_MISSING' : 'CHECKOUT_COD_FAILED',
      },
      { status: isPersistenceConfig ? 503 : 400 }
    )
  }
}
