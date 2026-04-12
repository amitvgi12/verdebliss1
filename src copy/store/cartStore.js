import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product) => {
        set((state) => {
          const existing = state.items.find((i) => i.id === product.id)
          return {
            items: existing
              ? state.items.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
              : [...state.items, { ...product, qty: 1 }],
          }
        })
      },

      removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      updateQty: (id, delta) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i
          ),
        })),

      clearCart: () => set({ items: [] }),

      openCart:  () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      get total()     { return get().items.reduce((s, i) => s + i.price * i.qty, 0) },
      get itemCount() { return get().items.reduce((s, i) => s + i.qty, 0) },
      get pointsToEarn() { return Math.floor(get().total / 10) },
    }),
    { name: 'verdebliss-cart' }
  )
)
