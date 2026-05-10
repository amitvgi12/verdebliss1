import type { Product } from '@/types'

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

export function safeJsonLd(data: unknown): string {
  // Escape characters that can break out of <script> tags or HTML context.
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}
