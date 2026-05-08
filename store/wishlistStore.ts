'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import type { WishlistState } from '@/types'

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: async (productId, userId) => {
        const inList = get().ids.includes(productId)
        set((s) => ({ ids: inList ? s.ids.filter((x) => x !== productId) : [...s.ids, productId] }))
        if (userId) {
          if (inList)
            await supabase
              .from('wishlists')
              .delete()
              .eq('user_id', userId)
              .eq('product_id', productId)
          else await supabase.from('wishlists').insert({ user_id: userId, product_id: productId })
        }
      },
      load: async (userId) => {
        if (!userId) return
        const { data } = await supabase.from('wishlists').select('product_id').eq('user_id', userId)
        if (data) set({ ids: data.map((x) => String(x.product_id)) })
      },
      has: (id) => get().ids.includes(id),
    }),
    { name: 'verdebliss-wishlist' }
  )
)
