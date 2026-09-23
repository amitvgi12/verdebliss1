import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createSupabaseAdmin: vi.fn(),
  getUserFromAuthorizationHeader: vi.fn(),
  hasSupabaseAdminEnv: vi.fn(),
  isRateLimited: vi.fn(),
  requireSameOriginRequest: vi.fn(),
}))

vi.mock('@/lib/supabase-admin', () => ({
  createSupabaseAdmin: mocks.createSupabaseAdmin,
  getUserFromAuthorizationHeader: mocks.getUserFromAuthorizationHeader,
  hasSupabaseAdminEnv: mocks.hasSupabaseAdminEnv,
}))

vi.mock('@/lib/rate-limit', () => ({
  isRateLimited: mocks.isRateLimited,
}))

vi.mock('@/lib/csrf', () => ({
  requireSameOriginRequest: mocks.requireSameOriginRequest,
}))

import { POST } from '@/app/api/refunds/request/route'
import { getRefundIneligibilityReason } from '@/lib/refunds'

const DAY = 24 * 60 * 60 * 1000
const recentOrder = {
  id: 'order-1',
  user_id: 'user-1',
  status: 'Delivered',
  payment_status: 'paid',
  created_at: new Date(Date.now() - DAY).toISOString(),
  total: 429,
}

describe('refund request API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireSameOriginRequest.mockReturnValue(null)
    mocks.getUserFromAuthorizationHeader.mockResolvedValue({ id: 'user-1' })
    mocks.hasSupabaseAdminEnv.mockReturnValue(true)
    mocks.isRateLimited.mockResolvedValue(false)
  })

  it('rejects unauthenticated refund requests', async () => {
    mocks.getUserFromAuthorizationHeader.mockResolvedValue(null)

    const response = await POST(makeRequest({ orderId: 'order-1', reason: validReason }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Sign in required' })
  })

  it('rejects requests without an order ID', async () => {
    const response = await POST(makeRequest({ reason: validReason }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Please select an order for the refund request',
    })
  })

  it('creates a refund for a valid order ID', async () => {
    const supabase = createSupabaseMock({ order: recentOrder })
    mocks.createSupabaseAdmin.mockReturnValue(supabase.client)

    const response = await POST(makeRequest({ orderId: 'order-1', reason: validReason }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
    expect(supabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        order_id: 'order-1',
        reason: validReason,
        status: 'requested',
      })
    )
  })

  it('rejects order IDs that do not belong to the user', async () => {
    const supabase = createSupabaseMock({ order: null })
    mocks.createSupabaseAdmin.mockReturnValue(supabase.client)

    const response = await POST(makeRequest({ orderId: 'other-user-order', reason: validReason }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Order not found for your account',
    })
  })

  it('rejects duplicate open refund requests', async () => {
    const supabase = createSupabaseMock({
      order: recentOrder,
      existingRefund: { id: 'refund-1', status: 'requested' },
    })
    mocks.createSupabaseAdmin.mockReturnValue(supabase.client)

    const response = await POST(makeRequest({ orderId: 'order-1', reason: validReason }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'A refund request is already open for this order',
    })
    expect(supabase.insert).not.toHaveBeenCalled()
  })

  it('rejects orders outside the refund window', async () => {
    const supabase = createSupabaseMock({
      order: {
        ...recentOrder,
        created_at: new Date(Date.now() - 15 * DAY).toISOString(),
      },
    })
    mocks.createSupabaseAdmin.mockReturnValue(supabase.client)

    const response = await POST(makeRequest({ orderId: 'order-1', reason: validReason }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Refund window expired. Requests are accepted within 14 days of delivery.',
    })
  })

  it('starts the refund window at delivery, not at order placement', async () => {
    // Ordered 20 days ago, delivered 5 days ago: inside the 14-day window.
    const supabase = createSupabaseMock({
      order: {
        ...recentOrder,
        created_at: new Date(Date.now() - 20 * DAY).toISOString(),
        delivered_at: new Date(Date.now() - 5 * DAY).toISOString(),
      },
    })
    mocks.createSupabaseAdmin.mockReturnValue(supabase.client)

    const response = await POST(makeRequest({ orderId: 'order-1', reason: validReason }))

    expect(response.status).toBe(200)
    expect(supabase.insert).toHaveBeenCalled()
  })
})

describe('refund window basis', () => {
  const now = Date.parse('2026-09-23T00:00:00Z')
  const daysAgo = (n: number) => new Date(now - n * DAY).toISOString()

  it('does not expire an order that has not been delivered yet', () => {
    expect(
      getRefundIneligibilityReason(
        { status: 'Shipped', payment_status: 'paid', created_at: daysAgo(30) },
        now
      )
    ).toBeNull()
  })

  it('falls back to the order date for legacy Delivered orders without a timestamp', () => {
    expect(
      getRefundIneligibilityReason(
        { status: 'Delivered', payment_status: 'paid', created_at: daysAgo(15) },
        now
      )
    ).toMatch(/expired/)
  })

  it('treats an order already in cancellation review as ineligible', () => {
    expect(
      getRefundIneligibilityReason(
        { status: 'Cancellation Requested', payment_status: 'cod_pending', created_at: daysAgo(1) },
        now
      )
    ).toMatch(/not eligible/)
  })
})

const validReason = 'The seal arrived damaged and the product leaked in transit.'

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/refunds/request', {
    method: 'POST',
    headers: {
      authorization: 'Bearer token',
      'content-type': 'application/json',
      'x-vb-client': 'web',
    },
    body: JSON.stringify(body),
  })
}

function createSupabaseMock({
  order,
  existingRefund = null,
}: {
  order: (typeof recentOrder & { delivered_at?: string }) | null
  existingRefund?: { id: string; status: string } | null
}) {
  const orderBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: order, error: null }),
  }
  const insert = vi.fn().mockResolvedValue({ error: null })
  const refundBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: existingRefund, error: null }),
    insert,
  }
  const client = {
    from: vi.fn((table: string) => (table === 'orders' ? orderBuilder : refundBuilder)),
  }

  return { client, insert }
}
