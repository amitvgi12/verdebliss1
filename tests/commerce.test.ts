import crypto from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase-admin', () => ({
  createSupabaseAdmin: vi.fn(() => {
    throw new Error('Unexpected Supabase admin client')
  }),
  hasSupabaseAdminEnv: vi.fn(() => false),
}))

import { createSupabaseAdmin, hasSupabaseAdminEnv } from '@/lib/supabase-admin'
import {
  PRODUCT_CATALOGUE_UNAVAILABLE_MESSAGE,
  amountInPaise,
  normalizeCart,
  validateAddress,
  validateCartItems,
  verifyRazorpaySignature,
  verifyRazorpayWebhookSignature,
} from '@/lib/commerce'

function mockProductLookup(response: { data?: unknown[] | null; error?: unknown }) {
  vi.mocked(createSupabaseAdmin).mockReturnValue({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        in: vi.fn(async () => ({
          data: response.data ?? null,
          error: response.error ?? null,
        })),
      })),
    })),
  } as never)
}

describe('commerce validation and payment helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.mocked(hasSupabaseAdminEnv).mockReturnValue(false)
    vi.mocked(createSupabaseAdmin).mockImplementation(() => {
      throw new Error('Unexpected Supabase admin client')
    })
  })

  it('normalises INR totals to Razorpay paise', () => {
    expect(amountInPaise(390)).toBe(39000)
    expect(amountInPaise(390.49)).toBe(39049)
  })

  it('rejects invalid checkout addresses before payment creation', () => {
    expect(() =>
      validateAddress({
        name: 'Amit',
        email: 'bad-email',
        phone: '123',
        line1: 'Street',
        city: 'Pune',
        state: 'MH',
        pincode: '411014',
      })
    ).toThrow('valid email')
  })

  it('merges duplicate cart lines and caps unsafe quantities', () => {
    expect(
      validateCartItems([
        { id: '2', qty: 1 },
        { id: '2', qty: 2 },
      ])
    ).toEqual([{ id: '2', qty: 3 }])

    expect(() => validateCartItems([{ id: '2', qty: 99 }])).toThrow('Invalid quantity')
  })

  it('allows static catalogue fallback outside production when product lookup fails', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.mocked(hasSupabaseAdminEnv).mockReturnValue(true)
    mockProductLookup({ error: { message: 'database unavailable' } })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const result = await normalizeCart([{ id: '1', qty: 1 }])

    expect(result.items[0]).toMatchObject({
      id: '1',
      name: 'Bakuchiol Renewal Serum',
      price: 250,
      qty: 1,
    })
    expect(warn).toHaveBeenCalledWith(
      '[commerce] Product DB lookup fell back where possible:',
      expect.anything()
    )
    warn.mockRestore()
  })

  it('fails closed in production when the configured product catalogue is unavailable', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.mocked(hasSupabaseAdminEnv).mockReturnValue(true)
    mockProductLookup({ error: { message: 'database unavailable' } })

    await expect(normalizeCart([{ id: '1', qty: 1 }])).rejects.toThrow(
      PRODUCT_CATALOGUE_UNAVAILABLE_MESSAGE
    )
  })

  it('does not merge static catalogue rows into production checkout results', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.mocked(hasSupabaseAdminEnv).mockReturnValue(true)
    mockProductLookup({ data: [] })

    await expect(normalizeCart([{ id: '1', qty: 1 }])).rejects.toThrow('Product not found: 1')
  })

  it('verifies Razorpay HMAC signatures server-side', () => {
    vi.stubEnv('RAZORPAY_KEY_SECRET', 'test_secret')
    const orderId = 'order_123'
    const paymentId = 'pay_456'
    const signature = crypto
      .createHmac('sha256', 'test_secret')
      .update(`${orderId}|${paymentId}`)
      .digest('hex')

    expect(verifyRazorpaySignature(orderId, paymentId, signature)).toBe(true)
    expect(verifyRazorpaySignature(orderId, paymentId, 'bad')).toBe(false)
    expect(verifyRazorpaySignature(orderId, paymentId, 'short')).toBe(false)
    expect(verifyRazorpaySignature('', paymentId, signature)).toBe(false)
    expect(verifyRazorpaySignature(orderId, '', signature)).toBe(false)
    expect(verifyRazorpaySignature(orderId, paymentId, '')).toBe(false)
  })

  it('verifies Razorpay webhook signatures against the raw body', () => {
    vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', 'webhook_secret')
    const rawBody = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_456' } } },
    })
    const signature = crypto
      .createHmac('sha256', 'webhook_secret')
      .update(rawBody)
      .digest('hex')

    expect(verifyRazorpayWebhookSignature(rawBody, signature)).toBe(true)
    expect(verifyRazorpayWebhookSignature(rawBody.replace('captured', 'failed'), signature)).toBe(
      false
    )
    expect(verifyRazorpayWebhookSignature(rawBody, 'short')).toBe(false)
    expect(verifyRazorpayWebhookSignature('', signature)).toBe(false)
  })
})
