import { reportError } from '@/lib/observability'

const REQUIRED_PRODUCTION_TURNSTILE_ENV = [
  'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
  'TURNSTILE_SECRET_KEY',
] as const

const REQUIRED_PUBLIC_SUPABASE_ENV = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const

export function isDemoModeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || process.env.STORYBOOK === 'true'
}

export function canUseStaticSupabaseFallback(): boolean {
  return process.env.NODE_ENV !== 'production' || isDemoModeEnabled()
}

export function hasPublicSupabaseEnv(): boolean {
  return REQUIRED_PUBLIC_SUPABASE_ENV.every((key) => Boolean(process.env[key]))
}

export function assertPublicSupabaseEnv(): void {
  if (hasPublicSupabaseEnv() || canUseStaticSupabaseFallback()) return

  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in production.'
  )
}

export function getMissingProductionEnv(): string[] {
  if (process.env.NODE_ENV !== 'production') return []

  const required = isDemoModeEnabled()
    ? REQUIRED_PRODUCTION_TURNSTILE_ENV
    : [...REQUIRED_PUBLIC_SUPABASE_ENV, ...REQUIRED_PRODUCTION_TURNSTILE_ENV]

  return required.filter((key) => !process.env[key])
}

export function validateStartupEnv(): void {
  const missing = getMissingProductionEnv()
  if (missing.length === 0) return

  reportError('production_env_missing', {
    missing,
  })
}

export function getEnvironmentCapabilities() {
  return {
    publicSupabase: hasPublicSupabaseEnv(),
    supabaseAdmin: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ),
    razorpay: Boolean(
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      process.env.RAZORPAY_WEBHOOK_SECRET
    ),
    turnstile: REQUIRED_PRODUCTION_TURNSTILE_ENV.every((key) => Boolean(process.env[key])),
    staticSupabaseFallback: !hasPublicSupabaseEnv() && canUseStaticSupabaseFallback(),
  }
}
