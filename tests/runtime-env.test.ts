import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  assertPublicSupabaseEnv,
  canUseStaticSupabaseFallback,
  getEnvironmentCapabilities,
  getMissingProductionEnv,
} from '@/lib/runtime-env'

describe('runtime environment policy', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('throws when public Supabase env is missing in real production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
    vi.stubEnv('NEXT_PUBLIC_DEMO_MODE', '')
    vi.stubEnv('STORYBOOK', '')

    expect(() => assertPublicSupabaseEnv()).toThrow(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in production.'
    )
  })

  it('allows static Supabase fallback outside production or in explicit demo mode', () => {
    vi.stubEnv('NODE_ENV', 'development')
    expect(canUseStaticSupabaseFallback()).toBe(true)

    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_DEMO_MODE', 'true')
    expect(canUseStaticSupabaseFallback()).toBe(true)
    expect(() => assertPublicSupabaseEnv()).not.toThrow()
  })

  it('reports required production env gaps without exposing values', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '')
    vi.stubEnv('TURNSTILE_SECRET_KEY', '')

    expect(getMissingProductionEnv()).toEqual([
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
      'TURNSTILE_SECRET_KEY',
    ])
  })

  it('summarises environment capabilities as booleans', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service')
    vi.stubEnv('NEXT_PUBLIC_RAZORPAY_KEY_ID', 'rzp_public')
    vi.stubEnv('RAZORPAY_KEY_ID', 'rzp_server')
    vi.stubEnv('RAZORPAY_KEY_SECRET', 'secret')
    vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', 'webhook')
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'site')
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret')
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example.com')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'redis-token')

    expect(getEnvironmentCapabilities()).toEqual({
      publicSupabase: true,
      supabaseAdmin: true,
      razorpay: true,
      turnstile: true,
      distributedRateLimiter: true,
      staticSupabaseFallback: false,
    })
  })

  it('recognises Vercel KV Redis aliases for distributed rate limiting', () => {
    vi.stubEnv('KV_REST_API_REDIS_URL', 'https://vercel-kv.example.com')
    vi.stubEnv('KV_REST_API_TOKEN', 'kv-write-token')

    expect(getEnvironmentCapabilities().distributedRateLimiter).toBe(true)
  })

  it('does not report distributed rate limiting for raw redis URLs', () => {
    vi.stubEnv('KV_REST_API_REDIS_URL', 'redis://default:token@example.upstash.io:6379')
    vi.stubEnv('KV_REST_API_TOKEN', 'kv-write-token')

    expect(getEnvironmentCapabilities().distributedRateLimiter).toBe(false)
  })
})
