export const revalidate = 300

import { getProductServer, getReviewAggregatesServer } from '@/lib/products-server'
import { breadcrumbJsonLd, productJsonLd, productPath, safeJsonLd } from '@/lib/seo'
import { getLegalNameServer } from '@/constants/businessCompliance'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [product, aggregate] = await Promise.all([
    getProductServer(id),
    getReviewAggregatesServer(id),
  ])

  if (!product) return new Response('Not Found', { status: 404 })

  const legalName = getLegalNameServer()
  const schemas = [
    productJsonLd(product, aggregate, legalName),
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Shop', path: '/products' },
      { name: product.name, path: productPath(product) },
    ]),
  ]

  return new Response(safeJsonLd(schemas), {
    headers: {
      'Content-Type': 'application/ld+json',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
    },
  })
}
