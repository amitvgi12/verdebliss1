import { afterEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/version/route'

describe('version API', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('exposes environment capability flags without secret values', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('VERCEL_GIT_COMMIT_SHA', '1234567890abcdef1234567890abcdef12345678')
    vi.stubEnv('VERCEL_DEPLOYMENT_CREATED_AT', '2026-05-20T08:00:00.000Z')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service')
    vi.stubEnv('NEXT_PUBLIC_RAZORPAY_KEY_ID', 'rzp_public')
    vi.stubEnv('RAZORPAY_KEY_ID', 'rzp_server')
    vi.stubEnv('RAZORPAY_KEY_SECRET', 'secret')
    vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', 'webhook')
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'site')
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'turnstile-secret')
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example.com')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'redis-token')

    const response = await GET()
    const body = await response.json()

    expect(body.capabilities).toEqual({
      publicSupabase: true,
      supabaseAdmin: true,
      razorpay: true,
      turnstile: true,
      distributedRateLimiter: true,
      staticSupabaseFallback: false,
    })
    expect(JSON.stringify(body)).not.toContain('turnstile-secret')
    expect(JSON.stringify(body)).not.toContain('redis-token')
    expect(JSON.stringify(body)).not.toContain('rzp_server')
    expect(body.gitSha).toBe('redacted')
    expect(body.deployedAt).toBe('2026-05-20T08:00:00.000Z')
    expect(body.schemaVersion).toBe('2026-05-27-retail-prices-review-disclosures-invoice-trigger')
    expect(body).not.toHaveProperty('version')
    expect(JSON.stringify(body)).not.toContain('1234567890abcdef')
  })

  it('can expose a short build revision outside production diagnostics', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('VERCEL_GIT_COMMIT_SHA', 'abcdef1234567890abcdef1234567890abcdef12')

    const response = await GET()
    const body = await response.json()

    expect(body.gitSha).toBe('abcdef123456')
  })

  it('maps a phone-like grievance officer name to the grievance env field', async () => {
    vi.resetModules()
    stubValidProductionComplianceEnv()
    vi.stubEnv('NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_OFFICER_NAME', '+911352000000')

    const { GET: getVersion } = await import('@/app/api/version/route')
    const response = await getVersion()
    const body = await response.json()

    expect(body.compliance).toMatchObject({
      ok: false,
      errorCount: 1,
      failingFields: ['NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_OFFICER_NAME'],
    })
  })
})

function stubValidProductionComplianceEnv() {
  vi.stubEnv('VERCEL_ENV', 'production')
  vi.stubEnv('NEXT_PUBLIC_VERDEBLISS_LEGAL_NAME', 'VerdeBliss Cosmetics Private Limited')
  vi.stubEnv('NEXT_PUBLIC_VERDEBLISS_CIN', 'U24246MH2020PTC123456')
  vi.stubEnv('NEXT_PUBLIC_VERDEBLISS_GSTIN', '27AAACV1234F1Z5')
  vi.stubEnv('NEXT_PUBLIC_VERDEBLISS_REGISTERED_OFFICE_LINE1', '12 Botanical Park Road')
  vi.stubEnv('NEXT_PUBLIC_VERDEBLISS_REGISTERED_OFFICE_CITY', 'Mumbai')
  vi.stubEnv('NEXT_PUBLIC_VERDEBLISS_REGISTERED_OFFICE_STATE', 'Maharashtra')
  vi.stubEnv('NEXT_PUBLIC_VERDEBLISS_REGISTERED_OFFICE_PINCODE', '400001')
  vi.stubEnv('NEXT_PUBLIC_VERDEBLISS_SUPPORT_PHONE_DISPLAY', '+91 135 2000 000')
  vi.stubEnv('NEXT_PUBLIC_VERDEBLISS_SUPPORT_PHONE_HREF', 'tel:+911352000000')
  vi.stubEnv('NEXT_PUBLIC_VERDEBLISS_SUPPORT_EMAIL', 'hello@verdebliss.com')
  vi.stubEnv('NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_OFFICER_NAME', 'Ananya Rao')
  vi.stubEnv('NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_EMAIL', 'grievance@verdebliss.com')
  vi.stubEnv('LEGAL_DATA_VERIFIED', 'true')
}
