import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  assertPublicSupabaseEnv,
  canUseStaticSupabaseFallback,
  hasPublicSupabaseEnv,
} from '@/lib/runtime-env'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

assertPublicSupabaseEnv()

if (!hasPublicSupabaseEnv() && canUseStaticSupabaseFallback()) {
  console.warn(
    '[VerdeBliss] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. ' +
      'DB-backed product prices will be unavailable until Supabase public env vars are set.'
  )
}

let browserClient: SupabaseClient | null = null

function getBrowserSupabaseClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    throw new Error('The public Supabase client is browser-only. Use supabase-admin on the server.')
  }

  if (!browserClient) {
    browserClient = createClient(
      supabaseUrl ?? 'https://placeholder.supabase.co',
      supabaseKey ?? 'placeholder-anon-key',
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      }
    )
  }

  return browserClient
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getBrowserSupabaseClient(), prop, receiver)
  },
})
