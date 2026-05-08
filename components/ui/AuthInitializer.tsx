'use client'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

/**
 * Mounts once in RootLayout to initialise Supabase auth listener.
 * Must be a Client Component since it uses useEffect + Zustand.
 */
export default function AuthInitializer() {
  const init = useAuthStore((s) => s.init)
  useEffect(() => {
    init()
  }, [init])
  return null
}
