import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireSameOriginRequest: vi.fn(),
  isRateLimited: vi.fn(),
  verifyTurnstileFromRequest: vi.fn(),
  normalizeCart: vi.fn(),
  persistOrder: vi.fn(),
  validateAddress: vi.fn(),
  getUserFromAuthorizationHeader: vi.fn(),
  assessCodRisk: vi.fn(),
  sendOrderConfirmationEmail: vi.fn(),
  scheduleProductsRevalidation: vi.fn(),
}))

vi.mock('@/lib/csrf', () => ({ requireSameOriginRequest: mocks.requireSameOriginRequest }))
vi.mock('@/lib/rate-limit', () => ({ isRateLimited: mocks.isRateLimited }))
vi.mock('@/lib/turnstile', () => ({
  verifyTurnstileFromRequest: mocks.verifyTurnstileFromRequest,
  turnstileFailureMessage: () => 'verification failed',
}))
vi.mock('@/lib/commerce', () => {
  class CheckoutValidationError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'CheckoutValidationError'
    }
  }
  return {
    CheckoutValidationError,
    PRODUCT_CATALOGUE_UNAVAILABLE_MESSAGE: 'Product catalogue is temporarily unavailable.',
    normalizeCart: mocks.normalizeCart,
    persistOrder: mocks.persistOrder,
    validateAddress: mocks.validateAddress,
  }
})
vi.mock('@/lib/supabase-admin', () => ({
  getUserFromAuthorizationHeader: mocks.getUserFromAuthorizationHeader,
}))
vi.mock('@/lib/cod-risk', () => ({ assessCodRisk: mocks.assessCodRisk }))
vi.mock('@/lib/order-email', () => ({ sendOrderConfirmationEmail: mocks.sendOrderConfirmationEmail }))
vi.mock('@/lib/revalidate-products', () => ({
  scheduleProductsRevalidation: mocks.scheduleProductsRevalidation,
}))

import { POST as placeCod } from '@/app/api/checkout/cod/route'

const ADDRESS = {
  name: 'Asha Rao',
  email: 'asha@example.com',
  phone: '9800011122',
  line1: '12 Green Residency Lane',
  city: 'Pune',
  state: 'Maharashtra',
  pincode: '411001',
}
const ITEMS = [{ id: 'serum', name: 'Serum', price: 895, qty: 1 }]
const TOTALS = { subtotal: 895, shipping: 0, total: 895, pointsToEarn: 44 }

function codRequest() {
  return new Request('http://localhost/api/checkout/cod', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-vb-client': 'web' },
    body: JSON.stringify({ address: ADDRESS, items: [{ id: 'serum', qty: 1 }] }),
  })
}

describe('COD idempotency', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireSameOriginRequest.mockReturnValue(null)
    mocks.isRateLimited.mockResolvedValue(false)
    mocks.verifyTurnstileFromRequest.mockResolvedValue({ ok: true })
    mocks.validateAddress.mockReturnValue(ADDRESS)
    mocks.normalizeCart.mockResolvedValue({ items: ITEMS, totals: TOTALS })
    mocks.getUserFromAuthorizationHeader.mockResolvedValue(null)
    mocks.assessCodRisk.mockReturnValue({ decision: 'allow', allowed: true, flags: [] })
  })

  it('derives a deterministic payment ref so a repeat submit hits the same order', async () => {
    mocks.persistOrder.mockResolvedValue({ id: 'order-1', pointsAwarded: false, idempotent: false })

    await placeCod(codRequest())
    await placeCod(codRequest())

    const firstRef = mocks.persistOrder.mock.calls[0][0].paymentId
    const secondRef = mocks.persistOrder.mock.calls[1][0].paymentId
    expect(firstRef).toMatch(/^COD-/)
    expect(secondRef).toBe(firstRef)
  })

  it('does not send a second email or re-revalidate for a deduped resubmit', async () => {
    mocks.persistOrder.mockResolvedValue({ id: 'order-1', pointsAwarded: false, idempotent: true })

    const res = await placeCod(codRequest())

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({ orderId: 'order-1' })
    expect(mocks.sendOrderConfirmationEmail).not.toHaveBeenCalled()
    expect(mocks.scheduleProductsRevalidation).not.toHaveBeenCalled()
  })

  it('sends the confirmation email for a genuinely new order', async () => {
    mocks.persistOrder.mockResolvedValue({ id: 'order-2', pointsAwarded: false, idempotent: false })

    await placeCod(codRequest())

    expect(mocks.sendOrderConfirmationEmail).toHaveBeenCalledTimes(1)
    expect(mocks.scheduleProductsRevalidation).toHaveBeenCalledTimes(1)
  })
})
