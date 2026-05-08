import type { MetadataRoute } from 'next'
import { PRODUCTS } from '@/constants/products'
import { productPath } from '@/lib/seo'

const BASE_URL = 'https://www.verdebliss.com'

export default function sitemap(): MetadataRoute.Sitemap {
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

  const products: MetadataRoute.Sitemap = PRODUCTS.map((product) => ({
    url: `${BASE_URL}${productPath(product)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...routes, ...products]
}
