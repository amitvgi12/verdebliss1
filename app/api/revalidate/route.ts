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
 *
 * Post-deploy usage (CI/CD):
 *   Run scripts/trigger-revalidate.mjs after every Vercel deploy.
 *   A non-200 response means the purge failed — treat it as a deploy failure.
 *   A CDN cache purge alone does NOT fix stale ISR HTML; a revalidation
 *   trigger (this endpoint) is required.
 */
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { getProductsServer } from '@/lib/products-server'

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: 'REVALIDATE_SECRET is not configured — revalidation is disabled' },
      { status: 500 }
    )
  }
  if (request.headers.get('x-revalidate-secret') !== secret) {
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

  const staticPaths = ['/', '/products', '/blog', '/faq', '/certifications', '/cookie-policy']
  for (const path of staticPaths) {
    revalidatePath(path, 'page')
  }

  let productSlugs: string[]
  if (productId) {
    productSlugs = [productId]
  } else {
    // Enumerate slugs dynamically from the canonical product source so the
    // purge always covers the full catalogue — not a hardcoded list that goes
    // stale as products are added.
    let products
    try {
      products = await getProductsServer()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return NextResponse.json(
        { error: `Failed to enumerate products for revalidation: ${message}` },
        { status: 500 }
      )
    }
    productSlugs = products.map((p) => p.slug ?? p.id)
  }

  const failedPaths: string[] = []
  for (const slug of productSlugs) {
    try {
      revalidatePath(`/products/${slug}`, 'page')
    } catch {
      failedPaths.push(`/products/${slug}`)
    }
  }

  if (failedPaths.length > 0) {
    return NextResponse.json(
      {
        error: 'Revalidation failed for one or more product paths',
        failedPaths,
      },
      { status: 500 }
    )
  }

  const revalidatedPaths = [...staticPaths, ...productSlugs.map((s) => `/products/${s}`)]

  return NextResponse.json({
    revalidated: true,
    productId: productId ?? 'all',
    paths: revalidatedPaths,
    productCount: productSlugs.length,
  })
}
