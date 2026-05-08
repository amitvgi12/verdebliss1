import { PRODUCTS } from '@/constants/products'
import type { Product } from '@/types'
import { createSupabaseAdmin, hasSupabaseAdminEnv } from '@/lib/supabase-admin'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function staticProductByIdOrSlug(idOrSlug: string): Product | null {
  return PRODUCTS.find((p) => p.id === idOrSlug || p.slug === idOrSlug) ?? null
}

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

      // Query slug first. This avoids invalid uuid casts on older Supabase
      // projects where products.id is uuid but the route param is a slug or
      // static product number such as "2".
      const bySlug = await supabase
        .from('products')
        .select('*')
        .eq('slug', idOrSlug)
        .eq('active', true)
        .maybeSingle()
      if (!bySlug.error && bySlug.data) return bySlug.data as Product

      if (UUID_RE.test(idOrSlug)) {
        const byId = await supabase
          .from('products')
          .select('*')
          .eq('id', idOrSlug)
          .eq('active', true)
          .maybeSingle()
        if (!byId.error && byId.data) return byId.data as Product
      }
    } catch {
      // Fall back to static catalogue below.
    }
  }

  return staticProductByIdOrSlug(idOrSlug)
}
