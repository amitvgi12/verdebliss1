import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireSameOriginRequest: vi.fn(),
  isRateLimited: vi.fn(),
  verifyTurnstileFromRequest: vi.fn(),
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

vi.mock('@/lib/commerce', () => ({
  normalizeCart: vi.fn(),
  persistOrder: vi.fn(),
  validateAddress: vi.fn(),
  createCheckoutSession: vi.fn(),
  createRazorpayOrder: vi.fn(),
}))

vi.mock('@/lib/supabase-admin', () => ({
  getUserFromAuthorizationHeader: vi.fn(),
}))

import { POST as placeCod } from '@/app/api/checkout/cod/route'
import { POST as createRazorpayOrder } from '@/app/api/checkout/create-razorpay-order/route'

describe('checkout bot protection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireSameOriginRequest.mockReturnValue(null)
    mocks.isRateLimited.mockResolvedValue(false)
    mocks.verifyTurnstileFromRequest.mockResolvedValue({ ok: false, reason: 'missing_token' })
  })

  it('rejects COD checkout when Turnstile verification fails', async () => {
    const response = await placeCod(makeRequest('/api/checkout/cod'))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Verification failed',
      code: 'missing_token',
    })
  })

  it('rejects Razorpay order creation when Turnstile verification fails', async () => {
    const response = await createRazorpayOrder(makeRequest('/api/checkout/create-razorpay-order'))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Verification failed',
      code: 'missing_token',
    })
  })
})

function makeRequest(path: string) {
  return new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-vb-client': 'web',
    },
    body: JSON.stringify({
      address: {},
      items: [],
    }),
  })
}
