import { PRODUCTS } from '@/constants/products'
import type { Product } from '@/types'
import { createSupabaseAdmin, hasSupabaseAdminEnv } from '@/lib/supabase-admin'

export async function getProductsServer(): Promise<Product[]> {
  if (!hasSupabaseAdminEnv()) return PRODUCTS

  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('review_count', { ascending: false })
    if (error || !data?.length) return PRODUCTS
    return data as Product[]
  } catch {
    return PRODUCTS
  }
}

export async function getProductServer(idOrSlug: string): Promise<Product | null> {
  if (hasSupabaseAdminEnv()) {
    try {
      const supabase = createSupabaseAdmin()
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
        .eq('active', true)
        .limit(1)
        .maybeSingle()
      if (!error && data) return data as Product
    } catch {
      // Fall back to static catalogue below.
    }
  }

  return PRODUCTS.find((p) => p.id === idOrSlug || p.slug === idOrSlug) ?? null
}
