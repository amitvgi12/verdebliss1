/**
 * POST /api/revalidate
 *
 * On-demand cache purge for product pages. Requires the REVALIDATE_SECRET env
 * var to match the x-revalidate-secret request header.
 *
 * Body (JSON, all optional):
 *   { productId: string }   — purge one PDP; omit to purge only the catalogue
 *
 * Use cases:
 *   - Supabase Database Webhook on products table changes
 *   - Admin script after bulk product edits
 *   - Manual curl during incident response
 *
 * Example:
 *   curl -X POST https://verdebliss.com/api/revalidate \
 *     -H "x-revalidate-secret: <secret>" \
 *     -H "Content-Type: application/json" \
 *     -d '{"productId":"bakuchiol-renewal-serum"}'
 */
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
    // body is optional — no productId means purge catalogue only
  }

  revalidateProductsCache(productId ? [productId] : undefined)

  return NextResponse.json({ revalidated: true, productId: productId ?? 'catalogue' })
}
