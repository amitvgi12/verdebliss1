import type { MetadataRoute } from 'next'
import { getProductsServer } from '@/lib/products-server'
import { productPath } from '@/lib/seo'

const BASE_URL = 'https://www.verdebliss.com'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const staticRoutes = [
    '',
    '/products',
    '/quiz',
    '/ingredients',
    '/our-story',
    '/sustainability',
    '/blog',
    '/faq',
    '/contact',
    '/press',
  ]

  const routes: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: now,
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.7,
  }))

  // Catalogue is DB-first via getProductsServer(), with static fallback for local
  // builds. That keeps public URLs aligned with the canonical product source.
  const products = await getProductsServer()
  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${BASE_URL}${productPath(product)}`,
    lastModified: product.created_at ? new Date(product.created_at) : now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...routes, ...productRoutes]
}
