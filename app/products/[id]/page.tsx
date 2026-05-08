export const dynamic = 'force-dynamic'

import { getProductServer } from '@/lib/products-server'
import ProductDetailClient from './ProductDetailClient'
import { absoluteUrl, productImagePath, StructuredData } from '@/lib/seo'

function productJsonLd(product, id) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: absoluteUrl(productImagePath(product)),
    brand: { '@type': 'Brand', name: 'VerdeBliss' },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'INR',
      availability:
        (product.stock ?? 1) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: absoluteUrl(`/products/${id}`),
    },
    ...(product.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.review_count ?? 1,
      },
    }),
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params
  const p = await getProductServer(id)
  if (!p) return { title: 'Product Not Found' }

  const image = productImagePath(p)
  return {
    title: p.name,
    description: `${p.description} Shop ${p.name} at VerdeBliss. Free shipping above ₹499.`,
    openGraph: {
      title: `${p.name} | VerdeBliss`,
      description: p.description,
      images: [image],
      url: absoluteUrl(`/products/${id}`),
    },
    alternates: { canonical: absoluteUrl(`/products/${id}`) },
  }
}

export default async function ProductDetailPage({ params }) {
  const { id } = await params
  const product = await getProductServer(id)
  return (
    <>
      {product && <StructuredData data={productJsonLd(product, id)} />}
      <ProductDetailClient id={id} initialProduct={product} />
    </>
  )
}
