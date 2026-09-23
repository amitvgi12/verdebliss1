import { afterEach, describe, expect, it, vi } from 'vitest'
import { createWebhookReporter, scrubPii } from '@/lib/alert-webhook'

async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('ops alert webhook reporter', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('scrubs emails and Indian phone numbers', () => {
    expect(scrubPii('buyer kavya@verdebliss.in called +91 98765 43210')).toBe(
      'buyer [email] called [phone]'
    )
  })

  it('posts a Slack/Discord-renderable alert tagged with release and environment', async () => {
    vi.stubEnv('VERCEL_GIT_COMMIT_SHA', 'abcdef1234567890')
    vi.stubEnv('VERCEL_ENV', 'production')
    const send = vi.fn().mockResolvedValue({ ok: true })
    const reporter = createWebhookReporter('https://hooks.example/ops', { send })

    reporter.captureMessage('[ALERT] payment_reconciliation_failed', {
      providerOrderId: 'order_1',
      email: 'kavya@verdebliss.in',
    })
    await flush()

    expect(send).toHaveBeenCalledTimes(1)
    const [url, init] = send.mock.calls[0]
    expect(url).toBe('https://hooks.example/ops')
    const body = JSON.parse(init.body)
    expect(body.text).toContain('payment_reconciliation_failed')
    expect(body.content).toBe(body.text)
    expect(body).toMatchObject({
      level: 'alert',
      environment: 'production',
      release: 'abcdef123456',
    })
    expect(body.context).toContain('order_1')
    expect(body.context).not.toContain('kavya@verdebliss.in')
  })

  it('throttles a repeating event and reports how many were suppressed', async () => {
    let clock = 0
    const send = vi.fn().mockResolvedValue({ ok: true })
    const reporter = createWebhookReporter('https://hooks.example/ops', { send, now: () => clock })

    reporter.captureException(new Error('boom'))
    reporter.captureException(new Error('boom'))
    reporter.captureException(new Error('boom'))
    clock = 6 * 60 * 1000
    reporter.captureException(new Error('boom'))
    await flush()

    expect(send).toHaveBeenCalledTimes(2)
    expect(JSON.parse(send.mock.calls[1][1].body).suppressedSinceLast).toBe(2)
  })

  it('never throws when delivery fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const send = vi.fn().mockRejectedValue(new Error('network down'))
    const reporter = createWebhookReporter('https://hooks.example/ops', { send })

    expect(() => reporter.captureMessage('[ALERT] x')).not.toThrow()
    await flush()
    expect(warn).toHaveBeenCalledWith('[alert-webhook] delivery failed')
    warn.mockRestore()
  })
})
