import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createSupabaseAdmin: vi.fn(),
  hasSupabaseAdminEnv: vi.fn(),
}))

vi.mock('@/lib/supabase-admin', () => ({
  createSupabaseAdmin: mocks.createSupabaseAdmin,
  hasSupabaseAdminEnv: mocks.hasSupabaseAdminEnv,
}))

import { GET } from '@/app/api/cron/reconciliation-alert/route'

describe('reconciliation alert cron', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('requires the cron bearer token when CRON_SECRET is configured', async () => {
    vi.stubEnv('CRON_SECRET', 'cron-secret')

    const response = await GET(new Request('http://localhost/api/cron/reconciliation-alert'))

    expect(response.status).toBe(401)
    expect(mocks.createSupabaseAdmin).not.toHaveBeenCalled()
  })

  it('fails closed in production when CRON_SECRET is missing', async () => {
    vi.stubEnv('NODE_ENV', 'production')

    const response = await GET(new Request('http://localhost/api/cron/reconciliation-alert'))

    expect(response.status).toBe(503)
    expect(mocks.createSupabaseAdmin).not.toHaveBeenCalled()
  })

  it('reports missing Supabase admin configuration clearly', async () => {
    mocks.hasSupabaseAdminEnv.mockReturnValue(false)

    const response = await GET(new Request('http://localhost/api/cron/reconciliation-alert'))
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.error).toMatch(/Supabase admin/)
  })

  it('posts an ops alert when unresolved reconciliation failures are stale', async () => {
    mocks.hasSupabaseAdminEnv.mockReturnValue(true)
    vi.stubEnv('OPS_ALERT_WEBHOOK_URL', 'https://ops.example.test/webhook')
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-05-20T12:00:00.000Z'))

    const limit = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'failure-1',
          event_type: 'payment.captured',
          provider_order_id: 'order_123',
          provider_payment_id: 'pay_123',
          failure_reason: 'session_missing',
          created_at: '2026-05-20T09:00:00.000Z',
        },
      ],
      error: null,
    })
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      lt: vi.fn(() => query),
      order: vi.fn(() => query),
      limit,
    }
    mocks.createSupabaseAdmin.mockReturnValue({
      from: vi.fn(() => query),
    })
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    const response = await GET(new Request('http://localhost/api/cron/reconciliation-alert'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.pending).toBe(1)
    expect(body.alert).toEqual({ sent: true, reason: 'sent' })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://ops.example.test/webhook',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('payment_reconciliation_failures_pending'),
      })
    )
    expect(query.lt).toHaveBeenCalledWith('created_at', '2026-05-20T11:00:00.000Z')
  })
})
