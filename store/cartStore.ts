'use client'
import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import { MAX_CART_ITEM_QTY } from '@/constants/cart'
import { useToastStore } from '@/store/toastStore'
import type { CartItem, CartState } from '@/types'

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
}

export const selectItemCount = (s: CartState): number =>
  s.items.reduce((sum: number, i: CartItem) => sum + i.qty, 0)

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      addItem: (product) => {
        const existing = get().items.find((i) => i.id === product.id)
        const ceiling = Math.min(product.stock ?? MAX_CART_ITEM_QTY, MAX_CART_ITEM_QTY)
        if (existing && existing.qty >= ceiling) {
          useToastStore
            .getState()
            .push(`Maximum ${ceiling} per order for ${existing.name}.`, 'warning')
          return
        }
        set((state) => ({
          items: existing
            ? state.items.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i))
            : [...state.items, { ...product, qty: 1 }],
        }))
      },
      removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      updateQty: (id, delta) => {
        const item = get().items.find((i) => i.id === id)
        if (!item) return
        if (delta < 0 && item.qty + delta <= 0) {
          set((state) => ({ items: state.items.filter((i) => i.id !== id) }))
          return
        }
        const ceiling = Math.min(item.stock ?? MAX_CART_ITEM_QTY, MAX_CART_ITEM_QTY)
        if (delta > 0 && item.qty >= ceiling) {
          useToastStore.getState().push(`Maximum ${ceiling} per order for ${item.name}.`, 'warning')
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, qty: Math.min(ceiling, Math.max(1, i.qty + delta)) } : i
          ),
        }))
      },
      clearCart: () => set({ items: [] }),
      syncCatalogProducts: (products) => {
        if (!products.length) return
        const byId = new Map(products.map((product) => [product.id, product]))
        const byName = new Map(products.map((product) => [product.name, product]))

        set((state) => ({
          items: state.items.map((item) => {
            const product = byId.get(item.id) ?? byName.get(item.name)
            if (!product) return item
            const ceiling = Math.min(product.stock ?? MAX_CART_ITEM_QTY, MAX_CART_ITEM_QTY)
            return { ...product, qty: Math.min(item.qty, ceiling) }
          }),
        }))
      },
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: 'verdebliss-cart',
      storage: createJSONStorage(() =>
        typeof window === 'undefined' ? noopStorage : window.localStorage
      ),
      partialize: (state) => ({ items: state.items }),
    }
  )
)
