'use client'
import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { AuthState } from '@/types'

const AUTH_INIT_TIMEOUT_MS = 8000
let authListenerAttached = false

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initializationError: null,
  recoveryMode: false,

  init: async () => {
    set({ loading: true, initializationError: null })

    if (!authListenerAttached) {
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          set({ recoveryMode: true })
        }

        if (session?.user) {
          set({
            user: session.user,
            loading: false,
            initializationError: null,
          })
          setTimeout(() => {
            void get().fetchProfile(session.user.id)
          }, 0)
        } else {
          set({ user: null, profile: null, loading: false, recoveryMode: false })
        }
      })
      authListenerAttached = true
    }

    try {
      const {
        data: { session },
        error,
      } = await withTimeout(supabase.auth.getSession(), AUTH_INIT_TIMEOUT_MS)

      if (error) throw error

      if (session?.user) {
        set({ user: session.user, loading: false, initializationError: null })
        void get().fetchProfile(session.user.id)
      } else {
        set({ user: null, profile: null, loading: false, initializationError: null })
      }
    } catch (error) {
      set({
        user: null,
        profile: null,
        loading: false,
        initializationError: formatInitializationError(error),
      })
    }
  },

  fetchProfile: async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) set({ profile: data })
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  signUp: async (email, password, fullName, skinType) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, skin_type: skinType } },
    })
    if (error) throw error
    return data
  },

  resetPassword: async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/account`,
    })
    if (error) throw error
    return data
  },

  updatePassword: async (password) => {
    const { data, error } = await supabase.auth.updateUser({ password })
    if (error) throw error
    set({ recoveryMode: false })
    return data
  },

  clearRecoveryMode: () => set({ recoveryMode: false }),

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/account` },
    })
    if (error) throw error
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  },

  refreshProfile: async () => {
    const userId = get().user?.id
    if (userId) await get().fetchProfile(userId)
  },
}))

export async function syncWishlist(ids: string[]) {
  const userId = useAuthStore.getState().user?.id
  if (!userId) return
  return ids
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('auth-bootstrap-timeout')), timeoutMs)
  })

  try {
    return await Promise.race([promise, timeout])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

function formatInitializationError(error: unknown) {
  if (error instanceof Error && error.message === 'auth-bootstrap-timeout') {
    return 'Account services are taking longer than expected. You can still sign in below.'
  }
  return 'We could not verify your account session. You can still sign in below.'
}
