'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/types'

interface ProductFilters {
  category?: string
  skinType?: string
  sortBy?: string
}

export function useProducts(filters: ProductFilters = {}) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    let query = supabase.from('products').select('*').eq('active', true)
    if (filters.category && filters.category !== 'All')
      query = query.eq('category', filters.category)
    if (filters.skinType && filters.skinType !== 'All')
      query = query.contains('skin_types', [filters.skinType])
    if (filters.sortBy === 'Price Low→High') query = query.order('price', { ascending: true })
    else if (filters.sortBy === 'Price High→Low') query = query.order('price', { ascending: false })
    else if (filters.sortBy === 'Top Rated') query = query.order('rating', { ascending: false })
    else query = query.order('review_count', { ascending: false })
    setLoading(true)
    Promise.resolve(query)
      .then(({ data, error }) => {
        if (!active) return
        if (error || !data?.length) setProducts([])
        else setProducts(data as Product[])
      })
      .catch(() => {
        if (active) setProducts([])
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

export function useProduct(id?: string) {
  const [product, setProduct] = useState<Product | null>(null)
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
      if (!id) return
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

        setProduct(null)
      } catch {
        if (active) setProduct(null)
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
