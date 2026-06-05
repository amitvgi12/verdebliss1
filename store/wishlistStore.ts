'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WishlistState } from '@/types'

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: async (productId, userId) => {
        const inList = get().ids.includes(productId)
        set((s) => ({ ids: inList ? s.ids.filter((x) => x !== productId) : [...s.ids, productId] }))
        const resolvedUserId = userId ?? (await getCurrentUserId())
        if (resolvedUserId) {
          const supabase = await getSupabase()
          if (inList)
            await supabase
              .from('wishlist')
              .delete()
              .eq('user_id', resolvedUserId)
              .eq('product_id', productId)
          else
            await supabase
              .from('wishlist')
              .insert({ user_id: resolvedUserId, product_id: productId })
        }
      },
      load: async (userId) => {
        if (!userId) return
        const supabase = await getSupabase()
        const { data } = await supabase.from('wishlist').select('product_id').eq('user_id', userId)
        if (data) set({ ids: data.map((x) => String(x.product_id)) })
      },
      has: (id) => get().ids.includes(id),
    }),
    { name: 'verdebliss-wishlist' }
  )
)

async function getSupabase() {
  const { supabase } = await import('@/lib/supabase')
  return supabase
}

async function getCurrentUserId() {
  try {
    const { useAuthStore } = await import('@/store/authStore')
    const storeUserId = useAuthStore.getState().user?.id
    if (storeUserId) return storeUserId

    const supabase = await getSupabase()
    const { data } = await supabase.auth.getSession()
    return data.session?.user?.id ?? null
  } catch {
    return null
  }
}
