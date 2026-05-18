export const revalidate = 300

import { notFound, permanentRedirect } from 'next/navigation'
import {
  getApprovedReviewsServer,
  getProductServer,
  getReviewAggregatesServer,
} from '@/lib/products-server'
import ProductDetailClient from './ProductDetailClient'
import { absoluteUrl, breadcrumbJsonLd, productImagePath, productPath } from '@/lib/seo'
import { StructuredData } from '@/lib/structured-data'
import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_COST } from '@/constants/shipping'
import type { Product } from '@/types'

interface ReviewAggregate {
  count: number
  average: number
}

function productJsonLd(product: Product, aggregate: ReviewAggregate | null) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: absoluteUrl(productImagePath(product)),
    sku: product.id,
    brand: { '@type': 'Brand', name: 'VerdeBliss' },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'INR',
      availability:
        (product.stock ?? 1) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: absoluteUrl(productPath(product)),
      // Honest shipping disclosure: Free shipping kicks in on cart subtotal,
      // not single-product price. Quote the standard rate; the threshold is
      // surfaced via the checkout UI / FAQ, not Schema-level conditional rates.
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IN' },
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: STANDARD_SHIPPING_COST,
          currency: 'INR',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 3, unitCode: 'DAY' },
        },
      },
    },
    // FREE_SHIPPING_THRESHOLD is surfaced at checkout, not in offer schema —
    // Google penalises offer schema that mismatches the on-page experience.
    // Reading this constant keeps the import wired so future schema additions
    // can use it without an extra import line.
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Free shipping cart threshold',
        value: `INR ${FREE_SHIPPING_THRESHOLD}`,
      },
    ],
  }

  // Only emit aggregateRating when we actually have approved reviews. Hard-coded
  // counts are a Google policy violation (rich-result manual action risk).
  if (aggregate && aggregate.count > 0) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: aggregate.average.toFixed(1),
      reviewCount: aggregate.count,
    }
  }

  return data
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = await getProductServer(id)
  if (!p) {
    return {
      title: 'Product Not Found',
      robots: { index: false, follow: false },
    }
  }

  const image = productImagePath(p)
  const canonical = absoluteUrl(productPath(p))
  return {
    title: p.name,
    description: `${p.description} Shop ${p.name} at VerdeBliss. Free shipping above ₹499.`,
    openGraph: {
      title: `${p.name} | VerdeBliss`,
      description: p.description,
      images: [image],
      url: canonical,
    },
    alternates: { canonical },
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProductServer(id)

  if (!product) {
    notFound()
  }

  if (product?.slug && product.slug !== id) {
    permanentRedirect(productPath(product))
  }

  const [initialReviews, aggregate] = product
    ? await Promise.all([
        getApprovedReviewsServer(product.id),
        getReviewAggregatesServer(product.id),
      ])
    : [[], null]

  return (
    <>
      <StructuredData data={productJsonLd(product, aggregate)} />
      <StructuredData
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Shop', path: '/products' },
          { name: product.name, path: productPath(product) },
        ])}
      />
      <ProductDetailClient
        id={id}
        initialProduct={product}
        initialReviews={initialReviews}
        initialReviewAggregate={aggregate}
      />
    </>
  )
}
