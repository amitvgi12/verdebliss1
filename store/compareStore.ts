'use client'
import { create } from 'zustand'
import type { Product } from '@/types'

const MAX_COMPARE = 3

interface CompareState {
  products: Product[]
  isOpen: boolean
  toggle: (product: Product) => void
  remove: (id: string) => void
  clear: () => void
  open: () => void
  close: () => void
}

export const useCompareStore = create<CompareState>()((set, get) => ({
  products: [],
  isOpen: false,

  toggle(product) {
    const { products } = get()
    const already = products.find((p) => p.id === product.id)
    if (already) {
      set({ products: products.filter((p) => p.id !== product.id) })
    } else if (products.length < MAX_COMPARE) {
      set({ products: [...products, product] })
    }
  },

  remove(id) {
    set((s) => ({ products: s.products.filter((p) => p.id !== id) }))
  },

  clear() {
    set({ products: [], isOpen: false })
  },

  open() {
    set({ isOpen: true })
  },

  close() {
    set({ isOpen: false })
  },
}))

export const MAX_COMPARE_PRODUCTS = MAX_COMPARE
