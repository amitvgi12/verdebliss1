import { createHmac } from 'node:crypto'
import { expect, test } from '@playwright/test'

test.describe('Razorpay webhook replay protection', () => {
  test('accepts a signed webhook replay without retry-looping', async ({ request }) => {
    const secret = process.env.E2E_RAZORPAY_WEBHOOK_SECRET ?? process.env.RAZORPAY_WEBHOOK_SECRET
    if (!secret) {
      test.skip(true, 'Set E2E_RAZORPAY_WEBHOOK_SECRET to run live webhook idempotency.')
      return
    }

    const payload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_e2e_replay',
            order_id: 'order_e2e_replay',
            amount: 42900,
            currency: 'INR',
            status: 'captured',
            method: 'upi',
          },
        },
      },
    })
    const signature = createHmac('sha256', secret).update(payload).digest('hex')

    const first = await request.post('/api/webhooks/razorpay', {
      data: payload,
      headers: {
        'content-type': 'application/json',
        'x-razorpay-signature': signature,
      },
    })
    const replay = await request.post('/api/webhooks/razorpay', {
      data: payload,
      headers: {
        'content-type': 'application/json',
        'x-razorpay-signature': signature,
      },
    })

    expect(first.status()).toBe(200)
    expect(replay.status()).toBe(200)
    await expect(replay).toBeOK()
  })
})
