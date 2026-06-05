export const revalidate = 3600

import { notFound, permanentRedirect } from 'next/navigation'
import {
  getApprovedReviewsServer,
  getProductServer,
  getProductsServer,
  getReviewAggregatesServer,
} from '@/lib/products-server'
import ProductDetailClient from './ProductDetailClient'
import {
  absoluteUrl,
  breadcrumbJsonLd,
  productJsonLd,
  productOgImagePath,
  productPath,
} from '@/lib/seo'
import { InlineStructuredData } from '@/lib/structured-data'
import { getLegalNameServer, getSellerDetailsServer } from '@/constants/businessCompliance'
import { hasProductPrice, isProductionRuntime, isPublishedProduct } from '@/lib/pricing'
import { hasSupabaseAdminEnv } from '@/lib/supabase-admin'

// Pre-build PDPs that have a real price. If the build environment lacks the
// Supabase admin key (SUPABASE_SERVICE_ROLE_KEY), getProductsServer returns
// price-0 static shells; prerendering those would bake "Price temporarily
// unavailable" into the PDP HTML. Filtering to priced products means a key-less
// build prerenders nothing, so each PDP renders on-demand at runtime (where the
// key is present) and ISR-caches the real price. dynamicParams=true (default)
// keeps that on-demand path available.
export async function generateStaticParams() {
  const products = await getProductsServer()
  return products.filter((p) => hasProductPrice(p)).map((p) => ({ id: p.slug ?? p.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = await getProductServer(id)
  const e2eMode = Boolean(process.env.E2E_STATIC_CATALOGUE)
  if (
    !isPublishedProduct(p, {
      hasCatalogue: hasSupabaseAdminEnv(),
      isProduction: isProductionRuntime() && !e2eMode,
    })
  ) {
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
  const e2eMode = Boolean(process.env.E2E_STATIC_CATALOGUE)

  // Fail closed: never render a buyable PDP for a missing or priceless product.
  // In production this requires a real price regardless of catalogue/env state.
  // E2E_STATIC_CATALOGUE lets Playwright test runs (no Supabase) render price-0 shells.
  if (
    !isPublishedProduct(product, {
      hasCatalogue: hasSupabaseAdminEnv(),
      isProduction: isProductionRuntime() && !e2eMode,
    })
  ) {
    notFound()
  }

  if (product.slug && product.slug !== id) {
    permanentRedirect(productPath(product))
  }

  const [initialReviews, aggregate] = await Promise.all([
    getApprovedReviewsServer(product.id),
    getReviewAggregatesServer(product.id),
  ])

  const sellerDetails = getSellerDetailsServer()

  // Inline JSON-LD so crawlers actually parse it. A `<script type="application/ld+json" src>`
  // is an HTML data block whose src is ignored — the schema never enters the DOM. PDPs are
  // ISR/non-nonce routes (script-src 'unsafe-inline'), so the inline block needs no nonce.
  // The same schema is also exposed at /api/schema/product/[id] for the post-deploy smoke test.
  const productSchema = [
    productJsonLd(product, aggregate, getLegalNameServer()),
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Shop', path: '/products' },
      { name: product.name, path: productPath(product) },
    ]),
  ]

  return (
    <>
      <InlineStructuredData data={productSchema} />
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
