export const revalidate = 300

import { notFound, permanentRedirect } from 'next/navigation'
import {
  getApprovedReviewsServer,
  getProductServer,
  getProductsServer,
  getReviewAggregatesServer,
} from '@/lib/products-server'
import ProductDetailClient from './ProductDetailClient'
import { absoluteUrl, productOgImagePath, productPath } from '@/lib/seo'
import { getSellerDetailsServer } from '@/constants/businessCompliance'
import { isPublishedProduct } from '@/lib/pricing'
import { hasSupabaseAdminEnv } from '@/lib/supabase-admin'

// Pre-build all known PDPs at deploy time so no PDP ever starts life as a
// runtime ISR render from the previous build. dynamicParams=true (default)
// keeps dynamic rendering available for any product added after the build.
export async function generateStaticParams() {
  const products = await getProductsServer()
  return products.map((p) => ({ id: p.slug ?? p.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = await getProductServer(id)
  if (!isPublishedProduct(p, hasSupabaseAdminEnv())) {
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
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${p.name}${p.ingredient ? ` — ${p.ingredient} formula` : ''} | VerdeBliss`,
        },
      ],
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

  // Fail closed: never render a buyable PDP for a missing or priceless product.
  if (!isPublishedProduct(product, hasSupabaseAdminEnv())) notFound()

  if (product.slug && product.slug !== id) {
    permanentRedirect(productPath(product))
  }

  const [initialReviews, aggregate] = await Promise.all([
    getApprovedReviewsServer(product.id),
    getReviewAggregatesServer(product.id),
  ])

  const sellerDetails = getSellerDetailsServer()

  return (
    <>
      {/* JSON-LD served from same-origin route — covered by script-src 'self', no nonce needed */}
      <script async type="application/ld+json" src={`/api/schema/product/${id}`} />
      <ProductDetailClient
        id={id}
        initialProduct={product}
        initialReviews={initialReviews}
        initialReviewAggregate={aggregate}
        sellerDetails={sellerDetails}
      />
    </>
  )
}
