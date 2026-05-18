import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireSameOriginRequest: vi.fn(),
  getUserFromAuthorizationHeader: vi.fn(),
  isRateLimited: vi.fn(),
}))

vi.mock('@/lib/csrf', () => ({
  requireSameOriginRequest: mocks.requireSameOriginRequest,
}))

vi.mock('@/lib/supabase-admin', () => ({
  createSupabaseAdmin: vi.fn(),
  getUserFromAuthorizationHeader: mocks.getUserFromAuthorizationHeader,
  hasSupabaseAdminEnv: vi.fn(() => false),
}))

vi.mock('@/lib/rate-limit', () => ({
  isRateLimited: mocks.isRateLimited,
}))

vi.mock('@/lib/products-server', () => ({
  getProductsServer: vi.fn(async () => []),
}))

import { POST } from '@/app/api/chat/route'

describe('chat API consent gate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireSameOriginRequest.mockReturnValue(null)
  })

  it('rejects requests before optional third-party AI consent is granted', async () => {
    const response = await POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-vb-client': 'web',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Where is my order?' }],
        }),
      })
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: 'AI support consent is required.' })
    expect(mocks.getUserFromAuthorizationHeader).not.toHaveBeenCalled()
    expect(mocks.isRateLimited).not.toHaveBeenCalled()
  })
})
