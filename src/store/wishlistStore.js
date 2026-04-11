import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      ids: [],          // local fallback (guest users)
      synced: false,

      // Toggle: works for both guest and logged-in users
      toggle: async (productId, userId) => {
        const inList = get().ids.includes(productId)

        // Optimistic local update
        set((s) => ({
          ids: inList ? s.ids.filter((x) => x !== productId) : [...s.ids, productId],
        }))

        // Persist to Supabase if logged in
        if (userId) {
          if (inList) {
            await supabase.from('wishlist').delete()
              .match({ user_id: userId, product_id: productId })
          } else {
            await supabase.from('wishlist').insert({ user_id: userId, product_id: productId })
          }
        }
      },

      // Sync from Supabase after login
      syncFromServer: async (userId) => {
        const { data } = await supabase
          .from('wishlist')
          .select('product_id')
          .eq('user_id', userId)
        if (data) {
          set({ ids: data.map((r) => r.product_id), synced: true })
        }
      },

      has: (id) => get().ids.includes(id),
    }),
    { name: 'verdebliss-wishlist' }
  )
)
