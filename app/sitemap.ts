import type { MetadataRoute } from 'next'
import { PUBLIC_STATIC_ROUTES } from '@/constants/publicRoutes'
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
  const routes: MetadataRoute.Sitemap = PUBLIC_STATIC_ROUTES.map((route) => ({
    url: `${BASE_URL}${route === '/' ? '' : route}`,
    lastModified: routeLastModified(route),
    changeFrequency: route === '/' ? 'daily' : 'weekly',
    priority: route === '/' ? 1 : 0.7,
  }))

  // Catalogue URLs come from the DB-backed product source so price-bearing
  // product records stay canonical.
  const products = await getProductsServer()
  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${BASE_URL}${productPath(product)}`,
    // Prefer updated_at so edits move the lastModified date; fall back to
    // created_at, then to the fixed fallback date.
    lastModified: product.updated_at
      ? new Date(product.updated_at)
      : product.created_at
        ? new Date(product.created_at)
        : fallbackModified,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...routes, ...productRoutes]
}
