import type { MetadataRoute } from 'next'
import { getProductsServer } from '@/lib/products-server'
import { productPath } from '@/lib/seo'
import routeModified from './route-modified.json'

const BASE_URL = 'https://www.verdebliss.com'
const fallbackModified = new Date('2026-04-01T00:00:00.000Z')
const routeModifiedByPath = routeModified as Record<string, string>

export const revalidate = 3600

function routeLastModified(route: string) {
  const modified = routeModifiedByPath[route]
  if (!modified) return fallbackModified

  const date = new Date(modified)
  return Number.isNaN(date.getTime()) ? fallbackModified : date
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    '',
    '/products',
    '/quiz',
    '/ingredients',
    '/our-story',
    '/sustainability',
    '/blog',
    '/faq',
    '/certifications',
    '/contact',
    '/press',
    '/privacy-policy',
    '/terms',
    '/cookie-policy',
    '/returns-refunds',
    '/shipping-policy',
  ]

  const routes: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: routeLastModified(route),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.7,
  }))

  // Catalogue is DB-first via getProductsServer(), with static fallback for local
  // builds. That keeps public URLs aligned with the canonical product source.
  const products = await getProductsServer()
  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${BASE_URL}${productPath(product)}`,
    lastModified: product.created_at ? new Date(product.created_at) : fallbackModified,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...routes, ...productRoutes]
}
