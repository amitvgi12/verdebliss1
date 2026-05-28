import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import type { Product } from '@/types'
import { createSupabaseAdmin, hasSupabaseAdminEnv } from '@/lib/supabase-admin'
import { normalizeProductClaimList, normalizeProductClaims } from '@/lib/product-claims'
import { PRODUCTS } from '@/constants/products'

export interface ApprovedReview {
  id: string
  rating: number
  title: string | null
  body: string | null
  created_at: string
  verified_purchase?: boolean | null
  review_source?: 'verified_purchase' | 'organic' | 'sampling' | 'pr_unit' | null
  source_disclosure?: string | null
  profiles?: { full_name?: string | null } | null
}

export interface ReviewAggregate {
  count: number
  average: number
}

interface ApprovedReviewMetricRow {
  product_id: string
  rating: number
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function getStaticProductShell(idOrSlug: string): Product | null {
  return PRODUCTS.find((product) => product.id === idOrSlug || product.slug === idOrSlug) ?? null
}

async function fetchProductsFromDb(): Promise<Product[]> {
  if (!hasSupabaseAdminEnv()) return []
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase.from('products').select('*').eq('active', true)
    if (error || !data?.length) return []

    const products = normalizeProductClaimList(data as Product[])
    const productIds = products.map((product) => product.id)
    const { data: approvedReviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('product_id, rating')
      .eq('approved', true)
      .in('product_id', productIds)

    const productsWithReviewMetrics = applyApprovedReviewMetrics(
      products,
      reviewsError ? [] : ((approvedReviews ?? []) as ApprovedReviewMetricRow[])
    )

    return productsWithReviewMetrics.sort((a, b) => (b.review_count ?? 0) - (a.review_count ?? 0))
  } catch {
    return []
  }
}

export function applyApprovedReviewMetrics(
  products: Product[],
  reviews: ApprovedReviewMetricRow[]
): Product[] {
  const aggregates = new Map<string, { total: number; count: number }>()

  reviews.forEach((review) => {
    const rating = Number(review.rating)
    if (!Number.isFinite(rating) || rating <= 0) return
    const current = aggregates.get(review.product_id) ?? { total: 0, count: 0 }
    aggregates.set(review.product_id, {
      total: current.total + rating,
      count: current.count + 1,
    })
  })

  return products.map((product) => {
    const aggregate = aggregates.get(product.id)
    if (!aggregate) return { ...product, rating: null, review_count: 0 }

    return {
      ...product,
      rating: Number((aggregate.total / aggregate.count).toFixed(2)),
      review_count: aggregate.count,
    }
  })
}

// unstable_cache: cross-request persistence, 5-min revalidation.
// cache(): intra-render deduplication — multiple callers in the same render
// (homepage, sitemap, chat route) share one resolved promise.
export const getProductsServer = cache(
  unstable_cache(async (): Promise<Product[]> => fetchProductsFromDb(), ['products-catalogue-v1'], {
    revalidate: 300,
    tags: ['products'],
  })
)

async function fetchProductFromDb(idOrSlug: string): Promise<Product | null> {
  if (!hasSupabaseAdminEnv()) return getStaticProductShell(idOrSlug)

  try {
    const supabase = createSupabaseAdmin()

    // Query slug first. This avoids invalid uuid casts on older Supabase
    // projects where products.id is uuid but the route param is a slug or
    // static product number such as "2".
    const bySlug = await supabase
      .from('products')
      .select('*')
      .eq('slug', idOrSlug)
      .eq('active', true)
      .maybeSingle()
    if (!bySlug.error && bySlug.data) return normalizeProductClaims(bySlug.data as Product)

    if (UUID_RE.test(idOrSlug)) {
      const byId = await supabase
        .from('products')
        .select('*')
        .eq('id', idOrSlug)
        .eq('active', true)
        .maybeSingle()
      if (!byId.error && byId.data) return normalizeProductClaims(byId.data as Product)
    }
  } catch {
    return null
  }

  return null
}

export function getProductServer(idOrSlug: string): Promise<Product | null> {
  return unstable_cache(() => fetchProductFromDb(idOrSlug), [`product-v1-${idOrSlug}`], {
    revalidate: 300,
    tags: ['products', `product-${idOrSlug}`],
  })()
}

export async function getApprovedReviewsServer(
  productId: string,
  limit = 5
): Promise<ApprovedReview[]> {
  if (!hasSupabaseAdminEnv()) return []

  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('reviews')
      .select(
        'id, rating, title, body, created_at, verified_purchase, review_source, source_disclosure, profiles(full_name)'
      )
      .eq('product_id', productId)
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) return []
    return (data ?? []) as unknown as ApprovedReview[]
  } catch {
    return []
  }
}

/**
 * Returns the *real* approved-review aggregate so the AggregateRating JSON-LD
 * never lies about review counts. Returns null if there are no approved reviews
 * — the caller must omit aggregateRating in that case.
 */
export async function getReviewAggregatesServer(
  productId: string
): Promise<ReviewAggregate | null> {
  if (!hasSupabaseAdminEnv()) return null

  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', productId)
      .eq('approved', true)

    if (error || !data || !data.length) return null
    const ratings = data
      .map((r: { rating: number }) => Number(r.rating))
      .filter((r: number) => Number.isFinite(r) && r > 0)
    if (!ratings.length) return null
    const sum = ratings.reduce((acc: number, r: number) => acc + r, 0)
    return { count: ratings.length, average: sum / ratings.length }
  } catch {
    return null
  }
}
