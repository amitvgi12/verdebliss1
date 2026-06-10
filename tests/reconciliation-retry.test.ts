/**
 * Tests for webhook-triggered DLQ retry logic: retryPendingReconciliations.
 *
 * The function lives in lib/commerce.ts and calls completeRazorpayCheckout
 * internally. Rather than trying to mock an intra-module ESM call (which
 * doesn't work without factory-style injection), tests control behaviour by
 * shaping the Supabase mock responses: an erroring checkout_sessions query
 * makes completeRazorpayCheckout throw; a successful one makes it resolve.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createSupabaseAdmin: vi.fn(),
  hasSupabaseAdminEnv: vi.fn(),
}))

vi.mock('@/lib/supabase-admin', () => ({
  createSupabaseAdmin: mocks.createSupabaseAdmin,
  hasSupabaseAdminEnv: mocks.hasSupabaseAdminEnv,
}))

import { retryPendingReconciliations } from '@/lib/commerce'

/** Returns a chainable Supabase query builder mock that resolves with the
 * given result at the terminal call (.single / .limit / direct await). */
function queryChain(terminal: () => Promise<unknown>) {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'lt', 'in', 'order', 'neq', 'not', 'is', 'single']
  for (const m of methods) chain[m] = vi.fn(() => chain)
  chain['limit'] = vi.fn(terminal)
  chain['update'] = vi.fn(() => chain)
  return chain
}

describe('retryPendingReconciliations', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('is a no-op when Supabase admin env is not configured', async () => {
    mocks.hasSupabaseAdminEnv.mockReturnValue(false)
    await retryPendingReconciliations()
    expect(mocks.createSupabaseAdmin).not.toHaveBeenCalled()
  })

  it('does not throw when the DB query returns an error', async () => {
    mocks.hasSupabaseAdminEnv.mockReturnValue(true)
    const chain = queryChain(() => Promise.resolve({ data: null, error: { message: 'DB error' } }))
    mocks.createSupabaseAdmin.mockReturnValue({ from: vi.fn(() => chain) })

    await expect(retryPendingReconciliations()).resolves.toBeUndefined()
  })

  it('skips rows with null provider IDs without calling checkout', async () => {
    mocks.hasSupabaseAdminEnv.mockReturnValue(true)

    const rowWithNullIds = {
      id: 'failure-uuid-3',
      event_type: 'payment.captured',
      provider_order_id: null,
      provider_payment_id: null,
      payload: {},
      retry_count: 0,
    }

    const updateMock = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }))
    const chain = queryChain(() => Promise.resolve({ data: [rowWithNullIds], error: null }))
    chain['update'] = updateMock
    mocks.createSupabaseAdmin.mockReturnValue({ from: vi.fn(() => chain) })

    await expect(retryPendingReconciliations()).resolves.toBeUndefined()
    // update should NOT be called: we skipped because IDs are null.
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('increments retry_count when checkout fails (session missing)', async () => {
    mocks.hasSupabaseAdminEnv.mockReturnValue(true)

    const pendingRow = {
      id: 'failure-uuid-fail',
      event_type: 'payment.captured',
      provider_order_id: 'order_no_session',
      provider_payment_id: 'pay_no_session',
      payload: {},
      retry_count: 2,
    }

    const eqAfterUpdate = vi.fn().mockResolvedValue({ error: null })
    const updateMock = vi.fn(() => ({ eq: eqAfterUpdate }))

    // First from() call → DLQ select (returns pendingRow).
    // Subsequent from() calls → checkout_sessions select (returns nothing → checkout throws).
    let callCount = 0
    mocks.createSupabaseAdmin.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'payment_reconciliation_failures') {
          if (callCount === 0) {
            callCount++
            // Initial SELECT
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              lt: vi.fn().mockReturnThis(),
              in: vi.fn().mockReturnThis(),
              order: vi.fn().mockReturnThis(),
              limit: vi.fn().mockResolvedValue({ data: [pendingRow], error: null }),
              update: updateMock,
            }
          }
          // UPDATE call after failed retry
          return { update: updateMock }
        }
        // checkout_sessions or any other table: return error so completeRazorpayCheckout throws
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi
            .fn()
            .mockResolvedValue({ data: null, error: { message: 'session not found' } }),
        }
      }),
    })

    await retryPendingReconciliations()

    // Should have called update with incremented retry_count
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ retry_count: 3 }))
    // Must not have set resolved: true
    expect(updateMock).not.toHaveBeenCalledWith(expect.objectContaining({ resolved: true }))
  })

  it('returns without retrying when the DLQ has no pending rows', async () => {
    mocks.hasSupabaseAdminEnv.mockReturnValue(true)

    const updateMock = vi.fn()
    const chain = queryChain(() => Promise.resolve({ data: [], error: null }))
    chain['update'] = updateMock
    mocks.createSupabaseAdmin.mockReturnValue({ from: vi.fn(() => chain) })

    await retryPendingReconciliations()

    expect(updateMock).not.toHaveBeenCalled()
  })
})
