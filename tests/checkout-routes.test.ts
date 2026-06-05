import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireSameOriginRequest: vi.fn(),
  isRateLimited: vi.fn(),
  verifyTurnstileFromRequest: vi.fn(),
  completeRazorpayCheckout: vi.fn(),
  verifyRazorpaySignature: vi.fn(),
}))

vi.mock('@/lib/csrf', () => ({
  requireSameOriginRequest: mocks.requireSameOriginRequest,
}))

vi.mock('@/lib/rate-limit', () => ({
  isRateLimited: mocks.isRateLimited,
}))

vi.mock('@/lib/turnstile', () => ({
  verifyTurnstileFromRequest: mocks.verifyTurnstileFromRequest,
  turnstileFailureMessage: (reason?: string) =>
    reason === 'missing_token'
      ? 'Please complete the verification check before continuing.'
      : 'Verification could not be confirmed. Please complete the check again and retry.',
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
    normalizeCart: vi.fn(),
    persistOrder: vi.fn(),
    validateAddress: vi.fn(),
    createCheckoutSession: vi.fn(),
    createRazorpayOrder: vi.fn(),
    completeRazorpayCheckout: mocks.completeRazorpayCheckout,
    verifyRazorpaySignature: mocks.verifyRazorpaySignature,
  }
})

vi.mock('@/lib/supabase-admin', () => ({
  getUserFromAuthorizationHeader: vi.fn(),
}))

import { CheckoutValidationError } from '@/lib/commerce'
import { POST as placeCod } from '@/app/api/checkout/cod/route'
import { POST as createRazorpayOrder } from '@/app/api/checkout/create-razorpay-order/route'
import { POST as verifyRazorpay } from '@/app/api/checkout/verify-razorpay/route'

describe('checkout bot protection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireSameOriginRequest.mockReturnValue(null)
    mocks.isRateLimited.mockResolvedValue(false)
    mocks.verifyTurnstileFromRequest.mockResolvedValue({ ok: false, reason: 'missing_token' })
    mocks.verifyRazorpaySignature.mockReturnValue(true)
  })

  it('rejects COD checkout when Turnstile verification fails', async () => {
    const response = await placeCod(makeRequest('/api/checkout/cod'))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Please complete the verification check before continuing.',
      code: 'missing_token',
    })
  })

  it('rejects Razorpay order creation when Turnstile verification fails', async () => {
    const response = await createRazorpayOrder(makeRequest('/api/checkout/create-razorpay-order'))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Please complete the verification check before continuing.',
      code: 'missing_token',
    })
  })

  it('returns the concrete Razorpay payment method after verification', async () => {
    mocks.completeRazorpayCheckout.mockResolvedValue({
      orderId: 'order-final',
      pointsAwarded: true,
      totals: { subtotal: 895, shipping: 0, total: 895, pointsToEarn: 89 },
      idempotent: false,
      paymentMethod: 'Razorpay · UPI',
    })

    const response = await verifyRazorpay(
      new Request('http://localhost/api/checkout/verify-razorpay', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-vb-client': 'web',
        },
        body: JSON.stringify({
          razorpay_order_id: 'order_RZP',
          razorpay_payment_id: 'pay_RZP',
          razorpay_signature: 'a'.repeat(64),
        }),
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      orderId: 'order-final',
      paymentId: 'pay_RZP',
      paymentMethod: 'Razorpay · UPI',
    })
  })

  it('never leaks an internal error message to the customer on verification failure', async () => {
    // Simulate a raw internal failure (e.g. a Supabase/DB error naming columns
    // or an env/config identifier). The customer must see a generic message.
    mocks.completeRazorpayCheckout.mockRejectedValue(
      new Error(
        'insert into "orders" violates row-level security policy for SUPABASE_SERVICE_ROLE_KEY'
      )
    )

    const response = await verifyRazorpay(makeVerifyRequest())

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.code).toBe('PAYMENT_VERIFY_FAILED')
    expect(body.error).not.toMatch(/supabase|service_role|row-level|orders|insert/i)
    expect(body.error).toBe(
      'We could not verify your payment. Please contact support if you were charged.'
    )
  })

  it('echoes customer-safe validation errors on verification failure', async () => {
    mocks.completeRazorpayCheckout.mockRejectedValue(
      new CheckoutValidationError('Checkout session expired. Please start checkout again.')
    )

    const response = await verifyRazorpay(makeVerifyRequest())

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Checkout session expired. Please start checkout again.',
      code: 'PAYMENT_VERIFY_FAILED',
    })
  })
})

function makeVerifyRequest() {
  return new Request('http://localhost/api/checkout/verify-razorpay', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-vb-client': 'web' },
    body: JSON.stringify({
      razorpay_order_id: 'order_RZP',
      razorpay_payment_id: 'pay_RZP',
      razorpay_signature: 'a'.repeat(64),
    }),
  })
}

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
