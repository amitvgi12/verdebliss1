export const revalidate = 300

import { notFound, permanentRedirect } from 'next/navigation'
import {
  getApprovedReviewsServer,
  getProductServer,
  getReviewAggregatesServer,
} from '@/lib/products-server'
import { PRODUCTS } from '@/constants/products'
import ProductDetailClient from './ProductDetailClient'
import {
  absoluteUrl,
  breadcrumbJsonLd,
  productImagePath,
  productOgImagePath,
  productPath,
} from '@/lib/seo'
import { StructuredData } from '@/lib/structured-data'
import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_COST } from '@/constants/shipping'
import { getVerifiablePriceOffer } from '@/lib/pricing'
import { BUSINESS_COMPLIANCE } from '@/constants/businessCompliance'
import type { Product } from '@/types'

interface ReviewAggregate {
  count: number
  average: number
}

export function productJsonLd(product: Product, aggregate: ReviewAggregate | null) {
  const priceOffer = getVerifiablePriceOffer(product)
  const offer: Record<string, unknown> = {
    '@type': 'Offer',
    price: priceOffer.price,
    priceCurrency: 'INR',
    availability:
      (product.stock ?? 1) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    url: absoluteUrl(productPath(product)),
    seller: {
      '@type': 'Organization',
      name: BUSINESS_COMPLIANCE.brandName,
      legalName: BUSINESS_COMPLIANCE.legalName,
    },
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'IN',
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: 14,
      returnMethod: 'https://schema.org/ReturnByMail',
      returnFees: 'https://schema.org/FreeReturn',
    },
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
  }

  if (priceOffer.priceValidUntil) {
    offer.priceValidUntil = priceOffer.priceValidUntil.slice(0, 10)
  }

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: absoluteUrl(productImagePath(product)),
    sku: product.id,
    brand: { '@type': 'Brand', name: 'VerdeBliss' },
    offers: offer,
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

// Pre-build all known PDPs at deploy time so no PDP ever starts life as a
// runtime ISR render from the previous build. dynamicParams=true (default)
// keeps dynamic rendering available for any product added after the build.
export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ id: p.slug ?? p.id }))
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

  const ogImage = productOgImagePath(p)
  const canonical = absoluteUrl(productPath(p))
  return {
    title: p.name,
    description: `${p.description} Shop ${p.name} at VerdeBliss. Free shipping above ₹499.`,
    openGraph: {
      title: `${p.name} | VerdeBliss`,
      description: p.description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: p.name }],
      url: canonical,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${p.name} | VerdeBliss`,
      description: `${p.description} Shop ${p.name} at VerdeBliss. Free shipping above ₹499.`,
      images: [ogImage],
    },
    alternates: { canonical },
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProductServer(id)

  if (!product) notFound()

  if (product.slug && product.slug !== id) {
    permanentRedirect(productPath(product))
  }

  const [initialReviews, aggregate] = await Promise.all([
    getApprovedReviewsServer(product.id),
    getReviewAggregatesServer(product.id),
  ])

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
