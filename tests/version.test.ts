import { afterEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/version/route'

describe('version API', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('exposes environment capability flags without secret values', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service')
    vi.stubEnv('NEXT_PUBLIC_RAZORPAY_KEY_ID', 'rzp_public')
    vi.stubEnv('RAZORPAY_KEY_ID', 'rzp_server')
    vi.stubEnv('RAZORPAY_KEY_SECRET', 'secret')
    vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', 'webhook')
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'site')
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'turnstile-secret')

    const response = await GET()
    const body = await response.json()

    expect(body.capabilities).toEqual({
      publicSupabase: true,
      supabaseAdmin: true,
      razorpay: true,
      turnstile: true,
      staticSupabaseFallback: false,
    })
    expect(JSON.stringify(body)).not.toContain('turnstile-secret')
    expect(JSON.stringify(body)).not.toContain('rzp_server')
  })
})
