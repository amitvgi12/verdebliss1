import { createClient } from '@supabase/supabase-js'

export function hasSupabaseAdminEnv(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    // Message intentionally omits the env var names: this can surface in server
    // logs and must never leak internal config identifiers to customer output.
    throw new Error('Supabase admin credentials are not configured')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function getUserFromAuthorizationHeader(authorization: string | null) {
  if (!authorization?.startsWith('Bearer ')) return null
  if (!hasSupabaseAdminEnv()) return null

  const token = authorization.slice('Bearer '.length).trim()
  if (!token) return null

  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}
