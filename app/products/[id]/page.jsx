import { getProductServer } from '@/lib/products-server'
import { PRODUCTS } from '@/constants/products'
import ProductDetailClient from './ProductDetailClient'

/**
 * generateMetadata — runs SERVER-SIDE so every product page gets
 * its own unique <title>, <meta description>, and Product JSON-LD
 * in the actual HTML response. This is the key SSR benefit over
 * the previous Vite SPA where useSEO() ran client-side.
 */
export async function generateMetadata({ params }) {
  const p = await getProductServer(params.id)
  if (!p) return { title: 'Product Not Found' }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description,
    image: `https://www.verdebliss.com/images/products/${p.ingredient?.toLowerCase().replace(' ', '-') || 'serum'}.webp`,
    brand: { '@type': 'Brand', name: 'VerdeBliss' },
    offers: {
      '@type': 'Offer',
      price: p.price,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: `https://www.verdebliss.com/products/${params.id}`,
    },
    ...(p.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: p.rating,
        reviewCount: p.review_count ?? 1,
      },
    }),
  }

  return {
    title: p.name,
    description: `${p.description} Shop ${p.name} at VerdeBliss. Free shipping above ₹499.`,
    openGraph: {
      title: `${p.name} | VerdeBliss`,
      description: p.description,
      images: [`/images/products/${p.ingredient?.toLowerCase().replace(' ', '-') || 'serum'}.webp`],
      url: `https://www.verdebliss.com/products/${params.id}`,
    },
    alternates: { canonical: `https://www.verdebliss.com/products/${params.id}` },
    other: {
      'script:ld+json': JSON.stringify(jsonLd),
    },
  }
}

/**
 * generateStaticParams — pre-renders all 8 product pages at build time.
 * Results in static HTML with correct metadata for each product —
 * zero JS required for Google to index them with rich snippets.
 */
export async function generateStaticParams() {
  return PRODUCTS.map((p) => ({ id: p.id }))
}

export default async function ProductDetailPage({ params }) {
  // Fetch product server-side so the client component receives it as a prop
  // (avoids a duplicate network call on the client)
  const product = await getProductServer(params.id)
  return <ProductDetailClient id={params.id} initialProduct={product} />
}
