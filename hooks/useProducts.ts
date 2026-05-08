'use client'
import { useEffect, useState } from 'react'
import { PRODUCTS } from '@/constants/products'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/types'

export interface ProductFilters {
  category?: string
  skinType?: string
  sortBy?: string
}

export function useProducts(filters: ProductFilters = {}) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    let query = supabase.from('products').select('*')
    if (filters.category && filters.category !== 'All')
      query = query.eq('category', filters.category)
    if (filters.skinType && filters.skinType !== 'All')
      query = query.contains('skin_types', [filters.skinType])
    if (filters.sortBy === 'Price Low→High') query = query.order('price', { ascending: true })
    else if (filters.sortBy === 'Price High→Low') query = query.order('price', { ascending: false })
    else if (filters.sortBy === 'Top Rated') query = query.order('rating', { ascending: false })
    else query = query.order('review_count', { ascending: false })
    const fallbackProducts = () => {
      let fb: Product[] = [...PRODUCTS]
      if (filters.category && filters.category !== 'All')
        fb = fb.filter((p) => p.category === filters.category)
      if (filters.skinType && filters.skinType !== 'All') {
        fb = fb.filter(
          (p) =>
            p.skin_types?.includes(filters.skinType as never) ||
            p.skin_types?.includes('All Types' as never)
        )
      }
      return fb
    }

    setLoading(true)
    Promise.resolve(query)
      .then(({ data, error }) => {
        if (!active) return
        if (error || !data?.length) setProducts(fallbackProducts())
        else setProducts(data as Product[])
      })
      .catch(() => {
        if (active) setProducts(fallbackProducts())
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [filters.category, filters.skinType, filters.sortBy])
  return { products, loading }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function staticProductByIdOrSlug(idOrSlug?: string): Product | null {
  if (!idOrSlug) return null
  return PRODUCTS.find((p) => p.id === idOrSlug || p.slug === idOrSlug) ?? null
}

export function useProduct(id?: string) {
  const [product, setProduct] = useState<Product | null>(() => staticProductByIdOrSlug(id))
  const [loading, setLoading] = useState(Boolean(id))

  useEffect(() => {
    if (!id) {
      setProduct(null)
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)

    async function loadProduct() {
      try {
        // Slugs work on both text-ID and uuid-ID Supabase product tables.
        const bySlug = await supabase
          .from('products')
          .select('*')
          .eq('slug', id)
          .eq('active', true)
          .maybeSingle()

        if (!active) return
        if (bySlug.data) {
          setProduct(bySlug.data as Product)
          return
        }

        // Only query uuid-looking IDs directly. Static IDs like "2" should not
        // be sent to older uuid product tables because Postgres rejects them.
        if (UUID_RE.test(id)) {
          const byId = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .eq('active', true)
            .maybeSingle()

          if (!active) return
          if (byId.data) {
            setProduct(byId.data as Product)
            return
          }
        }

        setProduct(staticProductByIdOrSlug(id))
      } catch {
        if (active) setProduct(staticProductByIdOrSlug(id))
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadProduct()
    return () => {
      active = false
    }
  }, [id])

  return { product, loading }
}

export async function getProductsServer(filters: ProductFilters = {}): Promise<Product[]> {
  try {
    let query = supabase.from('products').select('*')
    if (filters.category && filters.category !== 'All')
      query = query.eq('category', filters.category)
    const { data, error } = await query.order('review_count', { ascending: false })
    if (error || !data?.length) return PRODUCTS
    return data as Product[]
  } catch {
    return PRODUCTS
  }
}

export async function getProductServer(id: string): Promise<Product | null> {
  try {
    const bySlug = await supabase
      .from('products')
      .select('*')
      .eq('slug', id)
      .eq('active', true)
      .maybeSingle()
    if (bySlug.data) return bySlug.data as Product

    if (UUID_RE.test(id)) {
      const byId = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('active', true)
        .maybeSingle()
      if (byId.data) return byId.data as Product
    }

    return staticProductByIdOrSlug(id)
  } catch {
    return staticProductByIdOrSlug(id)
  }
}
