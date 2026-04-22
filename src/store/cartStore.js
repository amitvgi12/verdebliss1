/**
 * cartStore.js
 *
 * BUG FIX — ES getter properties do NOT survive Zustand persist rehydration.
 * JSON.stringify strips getter definitions, so after a page reload
 * `get total()` and `get itemCount()` are gone and return undefined.
 *
 * Solution: remove all ES getters from the store state object.
 * Expose standalone selector functions instead — components call these
 * inside useCartStore() hooks so they stay reactive.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/* Standalone selectors — call inside useCartStore() for reactivity */
export const selectTotal      = (s) => s.items.reduce((sum, i) => sum + i.price * i.qty, 0)
export const selectItemCount  = (s) => s.items.reduce((sum, i) => sum + i.qty, 0)
export const selectPointsToEarn = (s) => Math.floor(selectTotal(s) / 10)

export const useCartStore = create(
  persist(
    (set) => ({
      items:  [],
      isOpen: false,

      addItem: (product) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === product.id)
          return {
            items: existing
              ? state.items.map((i) =>
                  i.id === product.id ? { ...i, qty: i.qty + 1 } : i
                )
              : [...state.items, { ...product, qty: 1 }],
          }
        }),

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      updateQty: (id, delta) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i
          ),
        })),

      clearCart: () => set({ items: [] }),

      openCart:  () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    { name: 'verdebliss-cart' }
  )
)
