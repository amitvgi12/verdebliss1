import { afterEach, describe, expect, it, vi } from 'vitest'
import { getMissingProductionEnv } from '@/lib/runtime-env'
import { verifyTurnstileToken } from '@/lib/turnstile'

describe('turnstile verification', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('fails closed when Turnstile config is missing outside production', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('TURNSTILE_SECRET_KEY', '')

    await expect(verifyTurnstileToken(null)).resolves.toEqual({
      ok: false,
      reason: 'turnstile_not_configured',
    })
  })

  it('allows an explicit local Turnstile bypass outside production', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('TURNSTILE_SECRET_KEY', '')
    vi.stubEnv('TURNSTILE_ALLOW_DEV_BYPASS', 'true')

    await expect(verifyTurnstileToken(null)).resolves.toEqual({
      ok: true,
      reason: 'turnstile_dev_bypass',
    })
  })

  it('fails closed when Turnstile config is missing in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('TURNSTILE_SECRET_KEY', '')

    await expect(verifyTurnstileToken(null)).resolves.toEqual({
      ok: false,
      reason: 'turnstile_not_configured',
    })
  })
})

describe('startup environment validation', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('reports both required Turnstile variables when production config is absent', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon')
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '')
    vi.stubEnv('TURNSTILE_SECRET_KEY', '')

    expect(getMissingProductionEnv()).toEqual([
      'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
      'TURNSTILE_SECRET_KEY',
    ])
  })
})
