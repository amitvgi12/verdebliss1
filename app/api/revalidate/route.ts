/**
 * POST /api/revalidate
 *
 * On-demand cache purge for product pages, FAQ, and certifications.
 * Requires the REVALIDATE_SECRET env var to match the x-revalidate-secret header.
 *
 * Body (JSON, all optional):
 *   { productId: string }   — purge one PDP; omit to purge all products
 *
 * Use cases:
 *   - Post-deploy CI step (all products + FAQ + certifications in one call)
 *   - Supabase Database Webhook on products table changes
 *   - Manual curl during incident response
 *
 * Example:
 *   curl -X POST https://verdebliss.com/api/revalidate \
 *     -H "x-revalidate-secret: <secret>" \
 *     -H "Content-Type: application/json" \
 *     -d '{}'
 */
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { revalidateProductsCache } from '@/lib/revalidate-products'

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret || request.headers.get('x-revalidate-secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let productId: string | undefined
  try {
    const body = await request.json()
    if (typeof body?.productId === 'string' && body.productId) {
      productId = body.productId
    }
  } catch {
    // body is optional — no productId means purge all products
  }

  revalidateProductsCache(productId ? [productId] : undefined)
  // Always purge content pages alongside products so corrections go live on the
  // next request rather than waiting for the ISR TTL.
  revalidatePath('/faq', 'page')
  revalidatePath('/certifications', 'page')
  revalidatePath('/cookie-policy', 'page')

  return NextResponse.json({
    revalidated: true,
    productId: productId ?? 'all',
    paths: ['/faq', '/certifications', '/cookie-policy'],
  })
}
