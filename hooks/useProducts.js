'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { PRODUCTS } from '@/constants/products'

export function useProducts(filters = {}) {
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    let query = supabase.from('products').select('*')

    if (filters.category && filters.category !== 'All')
      query = query.eq('category', filters.category)
    if (filters.skinType && filters.skinType !== 'All')
      query = query.contains('skin_types', [filters.skinType])
    if (filters.sortBy === 'Price Low→High') query = query.order('price', { ascending: true })
    else if (filters.sortBy === 'Price High→Low') query = query.order('price', { ascending: false })
    else if (filters.sortBy === 'Top Rated') query = query.order('rating', { ascending: false })
    else query = query.order('review_count', { ascending: false })

    query.then(({ data, error }) => {
      if (error || !data?.length) {
        let fb = [...PRODUCTS]
        if (filters.category && filters.category !== 'All') fb = fb.filter(p => p.category === filters.category)
        if (filters.skinType && filters.skinType !== 'All') fb = fb.filter(p => p.skin_types.includes(filters.skinType) || p.skin_types.includes('All Types'))
        setProducts(fb)
      } else {
        setProducts(data)
      }
      setLoading(false)
    })
  }, [filters.category, filters.skinType, filters.sortBy])

  return { products, loading }
}

export function useProduct(id) {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    supabase.from('products').select('*').eq('id', id).single()
      .then(({ data }) => {
        setProduct(data || PRODUCTS.find(p => p.id === id) || null)
        setLoading(false)
      })
  }, [id])

  return { product, loading }
}

/**
 * Server-side data fetch — call from async Server Components
 * Returns product array (no React state, no loading).
 */
export async function getProductsServer(filters = {}) {
  try {
    let query = supabase.from('products').select('*')
    if (filters.category && filters.category !== 'All') query = query.eq('category', filters.category)
    const { data, error } = await query.order('review_count', { ascending: false })
    if (error || !data?.length) return PRODUCTS
    return data
  } catch {
    return PRODUCTS
  }
}

export async function getProductServer(id) {
  try {
    const { data } = await supabase.from('products').select('*').eq('id', id).single()
    return data || PRODUCTS.find(p => p.id === id) || null
  } catch {
    return PRODUCTS.find(p => p.id === id) || null
  }
}
