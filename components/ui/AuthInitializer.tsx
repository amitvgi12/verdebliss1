'use client'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useWishlistStore } from '@/store/wishlistStore'

/**
 * Mounts once in RootLayout to initialise Supabase auth listener.
 * Must be a Client Component since it uses useEffect + Zustand.
 */
export default function AuthInitializer() {
  const init = useAuthStore((s) => s.init)
  const userId = useAuthStore((s) => s.user?.id)
  const loadWishlist = useWishlistStore((s) => s.load)

  useEffect(() => {
    init()
  }, [init])

  useEffect(() => {
    if (userId) void loadWishlist(userId)
  }, [loadWishlist, userId])

  return null
}
