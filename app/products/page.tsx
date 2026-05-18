import ProductsClient from './ProductsClient'
import { getProductsServer } from '@/lib/products-server'
import { CATEGORIES, SKIN_TYPES, SORT_OPTIONS } from '@/constants/products'
import type { Product } from '@/types'

export const revalidate = 300

export const metadata = {
  title: 'Shop Organic Skincare',
  description:
    'Browse VerdeBliss certified organic serums, moisturisers, cleansers and SPF. Filter by skin type. Free shipping above ₹499.',
  openGraph: {
    title: 'Shop Organic Skincare | VerdeBliss',
    url: 'https://www.verdebliss.com/products',
  },
  alternates: { canonical: 'https://www.verdebliss.com/products' },
}

interface ProductsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function validOption(value: string | undefined, options: readonly string[], fallback: string) {
  return value && options.includes(value) ? value : fallback
}

export function filterAndSortProducts(
  products: Product[],
  filters: { category: string; skinType: string; sortBy: string; query?: string }
): Product[] {
  const normalizedQuery = filters.query?.trim().toLowerCase()

  const filtered = products.filter((product) => {
    const categoryMatch = filters.category === 'All' || product.category === filters.category
    const skinTypes = product.skin_types ?? []
    const skinMatch =
      filters.skinType === 'All' ||
      skinTypes.includes(filters.skinType) ||
      skinTypes.includes('All Types')
    const searchHaystack = [
      product.name,
      product.category,
      product.ingredient,
      product.description,
      ...(product.badges ?? []),
      ...skinTypes,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    const queryMatch = !normalizedQuery || searchHaystack.includes(normalizedQuery)

    return categoryMatch && skinMatch && queryMatch
  })

  return filtered.sort((a, b) => {
    switch (filters.sortBy) {
      case 'Price Low→High':
      case 'Price: Low to High':
        return Number(a.price) - Number(b.price)
      case 'Price High→Low':
      case 'Price: High to Low':
        return Number(b.price) - Number(a.price)
      case 'Top Rated':
        return Number(b.rating ?? 0) - Number(a.rating ?? 0)
      case 'Newest':
        return String(b.created_at ?? b.id).localeCompare(String(a.created_at ?? a.id))
      case 'Bestselling':
      default:
        return (b.review_count ?? 0) - (a.review_count ?? 0)
    }
  })
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams
  const category = validOption(firstParam(params.cat), CATEGORIES, 'All')
  const skinType = validOption(firstParam(params.skin), SKIN_TYPES, 'All')
  const sortBy = validOption(firstParam(params.sort), SORT_OPTIONS, 'Bestselling')
  const query = firstParam(params.q)?.trim() ?? ''
  const allProducts = await getProductsServer()
  const products = filterAndSortProducts(allProducts, { category, skinType, sortBy, query })

  return (
    <ProductsClient
      products={products}
      totalProducts={allProducts.length}
      category={category}
      skinType={skinType}
      sortBy={sortBy}
      query={query}
    />
  )
}
