import { NextResponse } from 'next/server'
import { isRateLimited } from '@/lib/rate-limit'
import { requireSameOriginRequest } from '@/lib/csrf'
import {
  createSupabaseAdmin,
  getUserFromAuthorizationHeader,
  hasSupabaseAdminEnv,
} from '@/lib/supabase-admin'

function cleanText(value: unknown, maxLength: number): string {
  return String(value ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

export async function POST(request: Request) {
  try {
    const csrfFailure = requireSameOriginRequest(request)
    if (csrfFailure) return csrfFailure

    const user = await getUserFromAuthorizationHeader(request.headers.get('authorization'))
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
    if (!hasSupabaseAdminEnv()) {
      return NextResponse.json({ error: 'Review service is not configured' }, { status: 503 })
    }

    if (await isRateLimited(request, 'reviews', 3, 3600, user.id)) {
      return NextResponse.json(
        { error: 'Too many review attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const productId = cleanText(body?.productId, 80)
    const title = cleanText(body?.title, 120)
    const reviewBody = cleanText(body?.body, 2000)
    const rating = Number(body?.rating)

    if (!productId) throw new Error('Product is required')
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5')
    }
    if (title.length < 3) throw new Error('Review title is required')
    if (reviewBody.length < 20) throw new Error('Review must be at least 20 characters')

    const supabase = createSupabaseAdmin()

    // Verified-purchase gate: a customer can review a product only when a paid
    // or confirmed-COD order item for that product belongs to their account.
    const { data: orderItems, error: orderItemError } = await supabase
      .from('order_items')
      .select('id, product_id, orders!inner(id, user_id, payment_status, status)')
      .eq('product_id', productId)
      .eq('orders.user_id', user.id)
      .in('orders.payment_status', ['paid', 'cod_pending'])
      .limit(5)

    if (orderItemError) throw new Error(orderItemError.message)
    const eligibleItem = (orderItems ?? [])[0] as { id: string } | undefined
    if (!eligibleItem) {
      throw new Error('Reviews are available after purchasing this product.')
    }

    const { data: existing, error: existingError } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .maybeSingle()
    if (existingError) throw new Error(existingError.message)
    if (existing) throw new Error('You have already submitted a review for this product.')

    const { error } = await supabase.from('reviews').insert({
      product_id: productId,
      user_id: user.id,
      order_item_id: eligibleItem.id,
      verified_purchase: true,
      rating,
      title,
      body: reviewBody,
      approved: false,
    })
    if (error) throw new Error(error.message)

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to submit review' },
      { status: 400 }
    )
  }
}
