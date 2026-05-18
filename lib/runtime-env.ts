import { reportError } from '@/lib/observability'

const REQUIRED_PRODUCTION_TURNSTILE_ENV = [
  'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
  'TURNSTILE_SECRET_KEY',
] as const

export function getMissingProductionEnv(): string[] {
  if (process.env.NODE_ENV !== 'production') return []

  return REQUIRED_PRODUCTION_TURNSTILE_ENV.filter((key) => !process.env[key])
}

export function validateStartupEnv(): void {
  const missing = getMissingProductionEnv()
  if (missing.length === 0) return

  reportError('production_env_missing', {
    subsystem: 'turnstile',
    missing,
  })
}
