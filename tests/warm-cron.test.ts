import { afterEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/cron/warm/route'

describe('cache-warming cron', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('requires the cron bearer token when CRON_SECRET is configured', async () => {
    vi.stubEnv('CRON_SECRET', 'cron-secret')
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const response = await GET(new Request('http://localhost/api/cron/warm'))

    expect(response.status).toBe(401)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('fails closed in production when CRON_SECRET is missing', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const response = await GET(new Request('http://localhost/api/cron/warm'))

    expect(response.status).toBe(503)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('warms the key routes when authorized', async () => {
    vi.stubEnv('CRON_SECRET', 'cron-secret')
    const fetchSpy = vi.fn(async () => ({ status: 200 }) as Response)
    vi.stubGlobal('fetch', fetchSpy)

    const response = await GET(
      new Request('http://localhost/api/cron/warm', {
        headers: { authorization: 'Bearer cron-secret' },
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    const warmedPaths = body.warmed.map((w: { path: string }) => w.path)
    expect(warmedPaths).toEqual(
      expect.arrayContaining(['/', '/products', '/products/bakuchiol-renewal-serum'])
    )
    // Every warm target is fetched against the canonical origin.
    expect(fetchSpy).toHaveBeenCalledTimes(warmedPaths.length)
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('https://www.verdebliss.com/'),
      expect.objectContaining({ cache: 'no-store' })
    )
  })
})
