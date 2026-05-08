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
    setLoading(true)
    query.then(({ data, error }) => {
      if (!active) return
      if (error || !data?.length) {
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
        setProducts(fb)
      } else setProducts(data as Product[])
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [filters.category, filters.skinType, filters.sortBy])
  return { products, loading }
}

export function useProduct(id?: string) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!id) return
    let active = true
    setLoading(true)
    supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (!active) return
        setProduct((data as Product | null) || PRODUCTS.find((p) => p.id === id) || null)
        setLoading(false)
      })
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
    const { data } = await supabase.from('products').select('*').eq('id', id).single()
    return (data as Product | null) || PRODUCTS.find((p) => p.id === id) || null
  } catch {
    return PRODUCTS.find((p) => p.id === id) || null
  }
}
