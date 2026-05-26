import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createSupabaseAdmin: vi.fn(),
  getUserFromAuthorizationHeader: vi.fn(),
  hasSupabaseAdminEnv: vi.fn(),
  requireSameOriginRequest: vi.fn(),
}))

vi.mock('@/lib/supabase-admin', () => ({
  createSupabaseAdmin: mocks.createSupabaseAdmin,
  getUserFromAuthorizationHeader: mocks.getUserFromAuthorizationHeader,
  hasSupabaseAdminEnv: mocks.hasSupabaseAdminEnv,
}))

vi.mock('@/lib/csrf', () => ({
  requireSameOriginRequest: mocks.requireSameOriginRequest,
}))

import { PATCH, GET } from '@/app/api/admin/orders/track/route'

const STAFF_USER = { id: 'staff-1' }
const REGULAR_USER = { id: 'user-1' }

describe('admin order tracking API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireSameOriginRequest.mockReturnValue(null)
    mocks.hasSupabaseAdminEnv.mockReturnValue(true)
    mocks.getUserFromAuthorizationHeader.mockResolvedValue(STAFF_USER)
  })

  // ── Auth & permissions ────────────────────────────────────────────────

  it('rejects unauthenticated PATCH requests with 401', async () => {
    mocks.getUserFromAuthorizationHeader.mockResolvedValue(null)

    const res = await PATCH(makeRequest('PATCH', {}))

    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toEqual({ error: 'Sign in required' })
  })

  it('rejects non-staff users with 403', async () => {
    mocks.getUserFromAuthorizationHeader.mockResolvedValue(REGULAR_USER)
    mocks.createSupabaseAdmin.mockReturnValue(
      createAdminMock({ profile: { is_staff: false }, order: null }).client
    )

    const res = await PATCH(makeRequest('PATCH', { orderId: 'order-1' }))

    expect(res.status).toBe(403)
    await expect(res.json()).resolves.toEqual({ error: 'Staff access required' })
  })

  it('returns 503 when admin env is not configured', async () => {
    mocks.hasSupabaseAdminEnv.mockReturnValue(false)

    const res = await PATCH(makeRequest('PATCH', { orderId: 'order-1' }))

    expect(res.status).toBe(503)
  })

  it('rejects unauthenticated GET requests with 401', async () => {
    mocks.getUserFromAuthorizationHeader.mockResolvedValue(null)

    const res = await GET(makeRequest('GET', {}))

    expect(res.status).toBe(401)
  })

  it('rejects non-staff GET with 403', async () => {
    mocks.getUserFromAuthorizationHeader.mockResolvedValue(REGULAR_USER)
    mocks.createSupabaseAdmin.mockReturnValue(
      createAdminMock({ profile: { is_staff: false }, order: null }).client
    )

    const res = await GET(makeRequest('GET', {}))

    expect(res.status).toBe(403)
  })

  // ── Input validation ──────────────────────────────────────────────────

  it('returns 400 when orderId is missing', async () => {
    mocks.createSupabaseAdmin.mockReturnValue(
      createAdminMock({ profile: { is_staff: true }, order: null }).client
    )

    const res = await PATCH(makeRequest('PATCH', { status: 'Shipped' }))

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ error: 'orderId is required' })
  })

  it('returns 400 for an invalid status value', async () => {
    mocks.createSupabaseAdmin.mockReturnValue(
      createAdminMock({ profile: { is_staff: true }, order: baseOrder() }).client
    )

    const res = await PATCH(makeRequest('PATCH', { orderId: 'order-1', status: 'Dispatched' }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/Invalid status/)
  })

  it('returns 404 when the order does not exist', async () => {
    mocks.createSupabaseAdmin.mockReturnValue(
      createAdminMock({ profile: { is_staff: true }, order: null }).client
    )

    const res = await PATCH(makeRequest('PATCH', { orderId: 'missing-order' }))

    expect(res.status).toBe(404)
    await expect(res.json()).resolves.toEqual({ error: 'Order not found' })
  })

  // ── Successful tracking update ────────────────────────────────────────

  it('updates tracking fields and returns success', async () => {
    const { client, update } = createAdminMock({
      profile: { is_staff: true },
      order: baseOrder(),
    })
    mocks.createSupabaseAdmin.mockReturnValue(client)

    const res = await PATCH(
      makeRequest('PATCH', {
        orderId: 'order-1',
        status: 'Shipped',
        tracking_id: 'DL123',
        courier_partner: 'Delhivery',
        estimated_delivery: '2026-05-24',
      })
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'Shipped',
        tracking_id: 'DL123',
        courier_partner: 'Delhivery',
        estimated_delivery: '2026-05-24',
      })
    )
  })

  it('auto-generates a Delhivery tracking URL from AWB + courier', async () => {
    const { client } = createAdminMock({ profile: { is_staff: true }, order: baseOrder() })
    mocks.createSupabaseAdmin.mockReturnValue(client)

    const res = await PATCH(
      makeRequest('PATCH', {
        orderId: 'order-1',
        tracking_id: 'DL9876543210',
        courier_partner: 'Delhivery',
      })
    )

    const body = await res.json()
    expect(body.tracking_url).toBe('https://www.delhivery.com/track/package/DL9876543210')
  })

  it('auto-generates an Ekart tracking URL from AWB + courier', async () => {
    const { client } = createAdminMock({ profile: { is_staff: true }, order: baseOrder() })
    mocks.createSupabaseAdmin.mockReturnValue(client)

    const res = await PATCH(
      makeRequest('PATCH', {
        orderId: 'order-1',
        tracking_id: 'FE123456789IN',
        courier_partner: 'Ekart',
      })
    )

    const body = await res.json()
    expect(body.tracking_url).toBe('https://ekartlogistics.com/shipmenttrack/FE123456789IN')
  })

  it('returns null tracking_url when courier is unknown', async () => {
    const { client } = createAdminMock({ profile: { is_staff: true }, order: baseOrder() })
    mocks.createSupabaseAdmin.mockReturnValue(client)

    const res = await PATCH(
      makeRequest('PATCH', {
        orderId: 'order-1',
        tracking_id: 'XYZ999',
        courier_partner: 'UnknownCourier',
      })
    )

    const body = await res.json()
    expect(body.tracking_url).toBeNull()
  })

  it('returns null tracking_url for Mock courier (no external link generated)', async () => {
    const { client } = createAdminMock({ profile: { is_staff: true }, order: baseOrder() })
    mocks.createSupabaseAdmin.mockReturnValue(client)

    const res = await PATCH(
      makeRequest('PATCH', {
        orderId: 'order-1',
        status: 'Shipped',
        tracking_id: 'MOCK-AWB-001',
        courier_partner: 'Mock',
      })
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.tracking_url).toBeNull()
  })

  // ── Timestamp auto-setting ────────────────────────────────────────────

  it('sets shipped_at when transitioning to Shipped for the first time', async () => {
    const { client, update } = createAdminMock({
      profile: { is_staff: true },
      order: baseOrder('Processing'),
    })
    mocks.createSupabaseAdmin.mockReturnValue(client)

    await PATCH(makeRequest('PATCH', { orderId: 'order-1', status: 'Shipped' }))

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ shipped_at: expect.any(String) }))
  })

  it('does not reset shipped_at when order is already Shipped', async () => {
    const { client, update } = createAdminMock({
      profile: { is_staff: true },
      order: baseOrder('Shipped'),
    })
    mocks.createSupabaseAdmin.mockReturnValue(client)

    await PATCH(
      makeRequest('PATCH', { orderId: 'order-1', status: 'Shipped', tracking_id: 'DL999' })
    )

    const callArg = update.mock.calls[0][0] as Record<string, unknown>
    expect(callArg.shipped_at).toBeUndefined()
  })

  it('sets out_for_delivery_at when transitioning to Out for Delivery', async () => {
    const { client, update } = createAdminMock({
      profile: { is_staff: true },
      order: baseOrder('Shipped'),
    })
    mocks.createSupabaseAdmin.mockReturnValue(client)

    await PATCH(makeRequest('PATCH', { orderId: 'order-1', status: 'Out for Delivery' }))

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ out_for_delivery_at: expect.any(String) })
    )
  })

  it('sets delivered_at when transitioning to Delivered', async () => {
    const { client, update } = createAdminMock({
      profile: { is_staff: true },
      order: baseOrder('Out for Delivery'),
    })
    mocks.createSupabaseAdmin.mockReturnValue(client)

    await PATCH(makeRequest('PATCH', { orderId: 'order-1', status: 'Delivered' }))

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ delivered_at: expect.any(String) })
    )
  })

  it('does not set delivered_at when order is already Delivered', async () => {
    const { client, update } = createAdminMock({
      profile: { is_staff: true },
      order: baseOrder('Delivered'),
    })
    mocks.createSupabaseAdmin.mockReturnValue(client)

    await PATCH(makeRequest('PATCH', { orderId: 'order-1', status: 'Delivered' }))

    const callArg = update.mock.calls[0][0] as Record<string, unknown>
    expect(callArg.delivered_at).toBeUndefined()
  })

  // ── GET couriers list ─────────────────────────────────────────────────

  it('returns the supported couriers list for staff', async () => {
    mocks.createSupabaseAdmin.mockReturnValue(
      createAdminMock({ profile: { is_staff: true }, order: null }).client
    )

    const res = await GET(makeRequest('GET', {}))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.couriers)).toBe(true)
    expect(body.couriers).toContain('Delhivery')
    expect(body.couriers).toContain('Ekart')
    expect(body.couriers).toContain('Shiprocket')
    expect(body.couriers).toContain('Mock')
  })
})

// ── Helpers ───────────────────────────────────────────────────────────────

function baseOrder(status = 'Processing') {
  return { id: 'order-1', status }
}

function makeRequest(method: string, body: Record<string, unknown>) {
  return new Request('http://localhost/api/admin/orders/track', {
    method,
    headers: {
      authorization: 'Bearer staff-token',
      'content-type': 'application/json',
      'x-vb-client': 'web',
    },
    body: method !== 'GET' ? JSON.stringify(body) : undefined,
  })
}

function createAdminMock({
  profile,
  order,
}: {
  profile: { is_staff: boolean } | null
  order: { id: string; status: string } | null
}) {
  const profileBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: profile, error: null }),
  }

  const update = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  })

  const ordersBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: order,
      error: order ? null : { message: 'not found' },
    }),
    update,
  }

  const client = {
    from: vi.fn((table: string) => {
      if (table === 'profiles') return profileBuilder
      return ordersBuilder
    }),
  }

  return { client, update }
}
