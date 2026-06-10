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

vi.mock('@/lib/revalidate-products', () => ({
  scheduleProductsRevalidation: vi.fn(),
}))

vi.mock('@/lib/observability', () => ({
  reportError: vi.fn(),
}))

import { POST } from '@/app/api/orders/cancel/route'

const baseOrder = {
  id: 'order-1',
  user_id: 'user-1',
  status: 'Processing',
  payment_status: 'cod_pending',
  total: 429,
}

describe('order cancellation API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireSameOriginRequest.mockReturnValue(null)
    mocks.getUserFromAuthorizationHeader.mockResolvedValue({ id: 'user-1' })
    mocks.hasSupabaseAdminEnv.mockReturnValue(true)
    mocks.isRateLimited.mockResolvedValue(false)
  })

  it('rejects unauthenticated cancellation requests', async () => {
    mocks.getUserFromAuthorizationHeader.mockResolvedValue(null)

    const response = await POST(makeRequest({ orderId: 'order-1' }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Sign in required' })
  })

  it('rejects delivered orders', async () => {
    const supabase = createSupabaseMock({
      order: { ...baseOrder, status: 'Delivered', payment_status: 'paid' },
    })
    mocks.createSupabaseAdmin.mockReturnValue(supabase.client)

    const response = await POST(makeRequest({ orderId: 'order-1' }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Delivered orders cannot be cancelled. Please use the refund request flow.',
    })
    expect(supabase.update).not.toHaveBeenCalled()
  })

  it('cancels a COD order before delivery', async () => {
    const supabase = createSupabaseMock({ order: baseOrder })
    mocks.createSupabaseAdmin.mockReturnValue(supabase.client)

    const response = await POST(makeRequest({ orderId: 'order-1' }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      status: 'Cancelled',
      refundQueued: false,
    })
    expect(supabase.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'Cancelled', payment_status: 'cancelled' })
    )
    expect(supabase.insert).not.toHaveBeenCalled()
    // Immediate cancellation must return stock via the idempotent restock RPC.
    expect(supabase.rpc).toHaveBeenCalledWith('restock_order_inventory', {
      p_order_id: 'order-1',
    })
  })

  it('moves a prepaid order to cancellation review and queues a refund request', async () => {
    const supabase = createSupabaseMock({
      order: { ...baseOrder, payment_status: 'paid' },
    })
    mocks.createSupabaseAdmin.mockReturnValue(supabase.client)

    const response = await POST(makeRequest({ orderId: 'order-1' }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      status: 'Cancellation Requested',
      refundQueued: true,
    })
    expect(supabase.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'Cancellation Requested' })
    )
    expect(supabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        order_id: 'order-1',
        status: 'requested',
        details: expect.objectContaining({ source: 'website_order_cancellation' }),
      })
    )
    // Prepaid orders restock only when staff confirm the cancellation —
    // dispatch may already be in progress.
    expect(supabase.rpc).not.toHaveBeenCalled()
  })
})

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/orders/cancel', {
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
  order: typeof baseOrder | null
  existingRefund?: { id: string; status: string } | null
}) {
  const orderSelectBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: order, error: null }),
  }
  const update = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnThis(),
  })
  const refundSelectBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: existingRefund, error: null }),
  }
  const insert = vi.fn().mockResolvedValue({ error: null })
  const refundInsertBuilder = { insert }
  const rpc = vi.fn().mockResolvedValue({ data: [{ restocked: true, lines: 1 }], error: null })

  const client = {
    rpc,
    from: vi.fn((table: string) => {
      if (table === 'orders') {
        return {
          select: orderSelectBuilder.select,
          eq: orderSelectBuilder.eq,
          maybeSingle: orderSelectBuilder.maybeSingle,
          update,
        }
      }
      return {
        select: refundSelectBuilder.select,
        eq: refundSelectBuilder.eq,
        in: refundSelectBuilder.in,
        maybeSingle: refundSelectBuilder.maybeSingle,
        insert: refundInsertBuilder.insert,
      }
    }),
  }

  return { client, update, insert, rpc }
}
