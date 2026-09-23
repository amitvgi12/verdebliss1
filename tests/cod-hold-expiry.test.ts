import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createSupabaseAdmin: vi.fn(),
  hasSupabaseAdminEnv: vi.fn(),
  reportError: vi.fn(),
  sendOrderCancelledEmail: vi.fn(),
}))

vi.mock('@/lib/supabase-admin', () => ({
  createSupabaseAdmin: mocks.createSupabaseAdmin,
  hasSupabaseAdminEnv: mocks.hasSupabaseAdminEnv,
}))
vi.mock('@/lib/observability', () => ({ reportError: mocks.reportError }))
vi.mock('@/lib/order-email', () => ({ sendOrderCancelledEmail: mocks.sendOrderCancelledEmail }))
vi.mock('@/lib/revalidate-products', () => ({ scheduleProductsRevalidation: vi.fn() }))

import { GET } from '@/app/api/cron/expire-cod-holds/route'

const HELD = [
  { id: 'order-a', address: { email: 'a@verdebliss.in', name: 'Asha Rao' } },
  { id: 'order-b', address: { email: 'b@verdebliss.in', name: 'Bina Das' } },
]

function createSupabaseMock({ verifiedMeanwhile = [] as string[] } = {}) {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: HELD, error: null }),
  }
  const update = vi.fn(() => {
    const filters: Record<string, string> = {}
    const chain = {
      eq: vi.fn((col: string, val: string) => {
        filters[col] = val
        return chain
      }),
      select: vi.fn(async () => ({
        data: verifiedMeanwhile.includes(filters.id) ? [] : [{ id: filters.id }],
        error: null,
      })),
    }
    return chain
  })
  const rpc = vi.fn().mockResolvedValue({ data: [{ restocked: true, lines: 1 }], error: null })
  const client = {
    rpc,
    from: vi.fn(() => ({ ...query, update })),
  }
  return { client, query, update, rpc }
}

function request(secret = 'cron-secret') {
  return new Request('http://localhost/api/cron/expire-cod-holds', {
    headers: { authorization: `Bearer ${secret}` },
  })
}

describe('COD hold expiry cron', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CRON_SECRET', 'cron-secret')
    mocks.hasSupabaseAdminEnv.mockReturnValue(true)
  })
  afterEach(() => vi.unstubAllEnvs())

  it('rejects requests without the cron secret', async () => {
    const res = await GET(request('wrong'))
    expect(res.status).toBe(401)
    expect(mocks.createSupabaseAdmin).not.toHaveBeenCalled()
  })

  it('cancels, restocks and notifies unverified COD orders older than the hold window', async () => {
    const supabase = createSupabaseMock()
    mocks.createSupabaseAdmin.mockReturnValue(supabase.client)

    const res = await GET(request())
    const body = await res.json()

    expect(body).toMatchObject({ ok: true, holdHours: 48, expired: 2, restockFailures: 0 })
    expect(supabase.query.eq).toHaveBeenCalledWith('status', 'COD Verification Required')
    expect(supabase.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'Cancelled', payment_status: 'cancelled' })
    )
    expect(supabase.rpc).toHaveBeenCalledWith('restock_order_inventory', { p_order_id: 'order-a' })
    expect(mocks.sendOrderCancelledEmail).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: 'order-b', email: 'b@verdebliss.in' })
    )
  })

  it('skips an order staff verified between the query and the update', async () => {
    const supabase = createSupabaseMock({ verifiedMeanwhile: ['order-a'] })
    mocks.createSupabaseAdmin.mockReturnValue(supabase.client)

    const body = await (await GET(request())).json()

    expect(body.expired).toBe(1)
    expect(supabase.rpc).toHaveBeenCalledTimes(1)
    expect(supabase.rpc).toHaveBeenCalledWith('restock_order_inventory', { p_order_id: 'order-b' })
    expect(mocks.sendOrderCancelledEmail).toHaveBeenCalledTimes(1)
  })

  it('honours COD_REVIEW_HOLD_HOURS', async () => {
    vi.stubEnv('COD_REVIEW_HOLD_HOURS', '24')
    const supabase = createSupabaseMock()
    mocks.createSupabaseAdmin.mockReturnValue(supabase.client)

    const body = await (await GET(request())).json()
    expect(body.holdHours).toBe(24)
  })
})
