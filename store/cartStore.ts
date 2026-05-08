'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, CartState } from '@/types'

export const selectTotal = (s: CartState): number =>
  s.items.reduce((sum: number, i: CartItem) => sum + i.price * i.qty, 0)
export const selectItemCount = (s: CartState): number =>
  s.items.reduce((sum: number, i: CartItem) => sum + i.qty, 0)
export const selectPointsToEarn = (s: CartState): number => Math.floor(selectTotal(s) / 10)

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      addItem: (product) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === product.id)
          return {
            items: existing
              ? state.items.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i))
              : [...state.items, { ...product, qty: 1 }],
          }
        }),
      removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      updateQty: (id, delta) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i
          ),
        })),
      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    { name: 'verdebliss-cart' }
  )
)
