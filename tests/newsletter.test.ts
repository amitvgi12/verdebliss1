import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireSameOriginRequest: vi.fn(),
  isRateLimited: vi.fn(),
  verifyTurnstileFromRequest: vi.fn(),
  hasSupabaseAdminEnv: vi.fn(),
  from: vi.fn(),
  capturedUpsert: null as Record<string, unknown> | null,
  capturedUpdate: null as Record<string, unknown> | null,
}))

vi.mock('@/lib/csrf', () => ({
  requireSameOriginRequest: mocks.requireSameOriginRequest,
}))

vi.mock('@/lib/rate-limit', () => ({
  isRateLimited: mocks.isRateLimited,
}))

vi.mock('@/lib/turnstile', () => ({
  verifyTurnstileFromRequest: mocks.verifyTurnstileFromRequest,
}))

vi.mock('@/lib/supabase-admin', () => ({
  hasSupabaseAdminEnv: mocks.hasSupabaseAdminEnv,
  createSupabaseAdmin: () => ({ from: mocks.from }),
}))

import { GET as confirmNewsletter } from '@/app/api/newsletter/confirm/route'
import { POST as subscribeNewsletter } from '@/app/api/newsletter/route'

describe('newsletter double opt-in', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.capturedUpsert = null
    mocks.capturedUpdate = null
    mocks.requireSameOriginRequest.mockReturnValue(null)
    mocks.isRateLimited.mockResolvedValue(false)
    mocks.verifyTurnstileFromRequest.mockResolvedValue({ ok: true })
    mocks.hasSupabaseAdminEnv.mockReturnValue(true)
  })

  it('stores newsletter signup as pending confirmation, not immediate consent', async () => {
    mocks.from.mockReturnValue(newsletterTable({ existing: null }))

    const response = await subscribeNewsletter(
      makePostRequest({ email: 'Kavya@VerdeBliss.Test', source: 'homepage_newsletter' })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      stored: true,
      status: 'confirmation_required',
      confirmationSent: false,
    })
    expect(mocks.capturedUpsert).toMatchObject({
      email: 'kavya@verdebliss.test',
      consent_type: 'newsletter',
      source: 'homepage_newsletter',
      consented: false,
      consented_at: null,
      revoked_at: null,
    })
    expect(String(mocks.capturedUpsert?.confirmation_token_hash)).toHaveLength(64)
    expect(mocks.capturedUpsert?.confirmation_expires_at).toBeTruthy()
  })

  it('does not reset an already-confirmed subscriber', async () => {
    mocks.from.mockReturnValue(newsletterTable({ existing: { consented: true } }))

    const response = await subscribeNewsletter(makePostRequest({ email: 'kavya@verdebliss.test' }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      stored: true,
      status: 'already_confirmed',
    })
    expect(mocks.capturedUpsert).toBeNull()
  })

  it('confirms a pending newsletter token and clears the token hash', async () => {
    mocks.from.mockReturnValue(
      newsletterTable({
        confirmationRow: {
          id: 'consent-1',
          confirmation_expires_at: new Date(Date.now() + 60_000).toISOString(),
        },
      })
    )

    const response = await confirmNewsletter(
      new Request(
        'https://www.verdebliss.com/api/newsletter/confirm?token=test-token-value-long-enough'
      )
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('newsletter=confirmed')
    expect(mocks.capturedUpdate).toMatchObject({
      consented: true,
      revoked_at: null,
      confirmation_token_hash: null,
      confirmation_expires_at: null,
    })
    expect(mocks.capturedUpdate?.consented_at).toBeTruthy()
    expect(mocks.capturedUpdate?.confirmed_at).toBeTruthy()
  })
})

function makePostRequest(body: Record<string, unknown>) {
  return new Request('https://www.verdebliss.com/api/newsletter', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-vb-client': 'web',
    },
    body: JSON.stringify(body),
  })
}

function newsletterTable({
  existing,
  confirmationRow,
}: {
  existing?: { consented: boolean } | null
  confirmationRow?: Record<string, unknown> | null
}) {
  return {
    select: vi.fn(() => eqChain(existing ?? confirmationRow ?? null)),
    upsert: vi.fn(async (row: Record<string, unknown>) => {
      mocks.capturedUpsert = row
      return { error: null }
    }),
    update: vi.fn((row: Record<string, unknown>) => {
      mocks.capturedUpdate = row
      return { eq: vi.fn(async () => ({ error: null })) }
    }),
  }
}

function eqChain(data: unknown) {
  const chain = {
    eq: vi.fn(() => chain),
    maybeSingle: vi.fn(async () => ({ data, error: null })),
  }
  return chain
}
