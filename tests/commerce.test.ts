import crypto from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  amountInPaise,
  validateAddress,
  validateCartItems,
  verifyRazorpaySignature,
  verifyRazorpayWebhookSignature,
} from '@/lib/commerce'

describe('commerce validation and payment helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
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
