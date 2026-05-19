import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createSupabaseAdmin: vi.fn(),
  hasSupabaseAdminEnv: vi.fn(),
  redisConstructor: vi.fn(),
  redisExpire: vi.fn(),
  redisExec: vi.fn(),
  redisIncr: vi.fn(),
  redisPipeline: vi.fn(),
  redisSet: vi.fn(),
  redisTtl: vi.fn(),
  rpc: vi.fn(),
}))

vi.mock('@upstash/redis', () => {
  class RedisMock {
    constructor(options: unknown) {
      mocks.redisConstructor(options)
      return {
        expire: mocks.redisExpire,
        pipeline: mocks.redisPipeline,
      }
    }
  }

  return { Redis: RedisMock }
})

vi.mock('@/lib/supabase-admin', () => ({
  createSupabaseAdmin: mocks.createSupabaseAdmin,
  hasSupabaseAdminEnv: mocks.hasSupabaseAdminEnv,
}))

import { isRateLimited } from '@/lib/rate-limit'

describe('distributed rate limiter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    const pipeline = {
      exec: mocks.redisExec,
      incr: mocks.redisIncr,
      set: mocks.redisSet,
      ttl: mocks.redisTtl,
    }

    mocks.redisPipeline.mockReturnValue(pipeline)
    mocks.redisSet.mockReturnValue(pipeline)
    mocks.redisIncr.mockReturnValue(pipeline)
    mocks.redisTtl.mockReturnValue(pipeline)
    mocks.redisExpire.mockResolvedValue(1)

    mocks.hasSupabaseAdminEnv.mockReturnValue(false)
    mocks.createSupabaseAdmin.mockReturnValue({ rpc: mocks.rpc })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('uses the Upstash Redis SDK before Supabase when configured', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example.com')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'redis-token')
    mocks.redisExec.mockResolvedValue([null, 1, 60])

    const limited = await isRateLimited(makeRequest(), 'cod', 6)

    expect(limited).toBe(false)
    expect(mocks.redisConstructor).toHaveBeenCalledWith({
      url: 'https://redis.example.com',
      token: 'redis-token',
    })
    expect(mocks.redisSet).toHaveBeenCalledWith('vb:rate:cod:ip:203.0.113.10', 0, {
      ex: 60,
      nx: true,
    })
    expect(mocks.redisIncr).toHaveBeenCalledWith('vb:rate:cod:ip:203.0.113.10')
    expect(mocks.redisTtl).toHaveBeenCalledWith('vb:rate:cod:ip:203.0.113.10')
    expect(mocks.createSupabaseAdmin).not.toHaveBeenCalled()
  })

  it('accepts Vercel KV REST URL aliases and the writable token', async () => {
    vi.stubEnv('KV_REST_API_REDIS_URL', 'https://vercel-kv.example.com')
    vi.stubEnv('KV_REST_API_TOKEN', 'kv-write-token')
    mocks.redisExec.mockResolvedValue([null, 7, 58])

    const limited = await isRateLimited(makeRequest(), 'cod', 6)

    expect(limited).toBe(true)
    expect(mocks.redisConstructor).toHaveBeenCalledWith({
      url: 'https://vercel-kv.example.com',
      token: 'kv-write-token',
    })
  })

  it('ignores the read-only Vercel KV token for write-heavy rate limiting', async () => {
    vi.stubEnv('KV_REST_API_URL', 'https://kv.example.com')
    vi.stubEnv('KV_REST_API_READ_ONLY_TOKEN', 'read-only-token')

    const limited = await isRateLimited(makeRequest(), 'read-only-token-test', 99)

    expect(limited).toBe(false)
    expect(mocks.redisConstructor).not.toHaveBeenCalled()
    expect(mocks.createSupabaseAdmin).not.toHaveBeenCalled()
  })

  it('ignores raw redis connection URLs because the SDK path needs REST', async () => {
    vi.stubEnv('KV_REST_API_REDIS_URL', 'redis://default:token@example.upstash.io:6379')
    vi.stubEnv('KV_REST_API_TOKEN', 'kv-write-token')

    const limited = await isRateLimited(makeRequest(), 'raw-redis-url-test', 99)

    expect(limited).toBe(false)
    expect(mocks.redisConstructor).not.toHaveBeenCalled()
  })

  it('falls back to Supabase if the Redis limiter is unavailable', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example.com')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'redis-token')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role')
    mocks.redisExec.mockRejectedValue(new Error('redis down'))
    mocks.hasSupabaseAdminEnv.mockReturnValue(true)
    mocks.rpc.mockResolvedValue({ data: true, error: null })

    const limited = await isRateLimited(makeRequest(), 'cod', 6)

    expect(limited).toBe(false)
    expect(mocks.rpc).toHaveBeenCalledWith('check_api_rate_limit', {
      p_key: 'cod:ip:203.0.113.10',
      p_limit: 6,
      p_window_seconds: 60,
    })
  })
})

function makeRequest() {
  return new Request('https://www.verdebliss.com/api/checkout/cod', {
    headers: {
      'x-forwarded-for': '203.0.113.10',
    },
  })
}
