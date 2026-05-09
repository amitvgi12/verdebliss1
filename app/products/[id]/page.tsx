export const dynamic = 'force-dynamic'

import { permanentRedirect } from 'next/navigation'
import { getProductServer } from '@/lib/products-server'
import ProductDetailClient from './ProductDetailClient'
import { absoluteUrl, productImagePath, productPath, StructuredData } from '@/lib/seo'
import type { Product } from '@/types'

function productJsonLd(product: Product) {
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
      url: absoluteUrl(productPath(product)),
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IN' },
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: product.price >= 499 ? 0 : 79,
          currency: 'INR',
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'IN',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 14,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
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

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = await getProductServer(id)
  if (!p) return { title: 'Product Not Found' }

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

  if (product?.slug && product.slug !== id) {
    permanentRedirect(productPath(product))
  }

  return (
    <>
      {product && <StructuredData data={productJsonLd(product)} />}
      <ProductDetailClient id={id} initialProduct={product} />
    </>
  )
}
