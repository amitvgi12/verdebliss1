import type { Product } from '@/types'
import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_COST } from '@/constants/shipping'
import { getVerifiablePriceOffer, hasProductPrice } from '@/lib/pricing'
import { BUSINESS_COMPLIANCE } from '@/constants/businessCompliance'

export const SITE_URL = 'https://www.verdebliss.com'

export const PRODUCT_IMAGE_BY_ID: Record<string, string> = {
  '1': '/images/products/serum.webp',
  '2': '/images/products/moisturiser.webp',
  '3': '/images/products/toner.webp',
  '4': '/images/products/cleanser.webp',
  '5': '/images/products/spf.webp',
  '6': '/images/products/lip-elixir.webp',
  '7': '/images/products/niacinamide-serum.webp',
  '8': '/images/products/night-cream.webp',
}

export const PRODUCT_OG_IMAGE_BY_ID: Record<string, string> = {
  '1': '/og/products/bakuchiol-renewal-serum.jpg',
  '2': '/og/products/rose-hip-glow-moisturiser.jpg',
  '3': '/og/products/green-tea-clarity-toner.jpg',
  '4': '/og/products/turmeric-brightening-cleanser.jpg',
  '5': '/og/products/botanical-spf-50-shield.jpg',
  '6': '/og/products/wild-berry-lip-elixir.jpg',
  '7': '/og/products/niacinamide-pore-serum.jpg',
  '8': '/og/products/shea-butter-night-cream.jpg',
}

export function absoluteUrl(path: string): string {
  if (path.startsWith('http')) return path
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export function productPath(product?: Pick<Product, 'id' | 'slug'> | null): string {
  const identifier = product?.slug || product?.id || ''
  return `/products/${encodeURIComponent(identifier)}`
}

export function productImagePath(product?: Pick<Product, 'id' | 'image_url'> | null): string {
  return (
    product?.image_url || PRODUCT_IMAGE_BY_ID[product?.id ?? ''] || '/images/products/serum.webp'
  )
}

export function productOgImagePath(product?: Pick<Product, 'id' | 'slug'> | null): string {
  if (product?.slug) return `/og/products/${product.slug}.jpg`
  return PRODUCT_OG_IMAGE_BY_ID[product?.id ?? ''] || '/og/home.jpg'
}

export interface BreadcrumbItem {
  name: string
  path: string
}

export function breadcrumbJsonLd(items: readonly BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

/**
 * ItemList of featured products for the homepage — lets crawlers associate the
 * highlighted catalogue entries with their canonical PDP URLs.
 */
export function featuredItemListJsonLd(products: Pick<Product, 'id' | 'slug' | 'name'>[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Featured VerdeBliss products',
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: product.name,
      url: absoluteUrl(productPath(product)),
    })),
  }
}

export interface ReviewAggregate {
  count: number
  average: number
}

export function productJsonLd(
  product: Product,
  aggregate: ReviewAggregate | null,
  legalName = BUSINESS_COMPLIANCE.legalName
) {
  const priceOffer = getVerifiablePriceOffer(product)
  const priceAvailable = hasProductPrice(product)
  const offer: Record<string, unknown> | null = priceAvailable
    ? {
        '@type': 'Offer',
        price: priceOffer.price,
        priceCurrency: 'INR',
        availability:
          (product.stock ?? 1) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: absoluteUrl(productPath(product)),
        seller: {
          '@type': 'Organization',
          name: BUSINESS_COMPLIANCE.brandName,
          legalName,
        },
        hasMerchantReturnPolicy: {
          '@type': 'MerchantReturnPolicy',
          applicableCountry: 'IN',
          returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
          merchantReturnDays: 14,
          returnMethod: 'https://schema.org/ReturnByMail',
          returnFees: 'https://schema.org/FreeReturn',
        },
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
            handlingTime: {
              '@type': 'QuantitativeValue',
              minValue: 0,
              maxValue: 1,
              unitCode: 'DAY',
            },
            transitTime: {
              '@type': 'QuantitativeValue',
              minValue: 2,
              maxValue: 3,
              unitCode: 'DAY',
            },
          },
        },
      }
    : null

  if (offer && priceOffer.priceValidUntil) {
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
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Free shipping cart threshold',
        value: `INR ${FREE_SHIPPING_THRESHOLD}`,
      },
    ],
  }

  if (offer) data.offers = offer

  if (aggregate && aggregate.count > 0) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: aggregate.average.toFixed(1),
      reviewCount: aggregate.count,
    }
  }

  return data
}

export function safeJsonLd(data: unknown): string {
  // Escape characters that can break out of <script> tags or HTML context.
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}
