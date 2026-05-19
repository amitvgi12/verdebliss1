import { Redis } from '@upstash/redis'
import { createSupabaseAdmin, hasSupabaseAdminEnv } from '@/lib/supabase-admin'
import { getClientIp } from '@/lib/client-ip'

/**
 * IP-aware rate limiter with distributed Redis primary, database fallback, and
 * in-memory emergency fallback.
 *
 * Notes for production hardening:
 *  - Configure UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN, or Vercel KV's
 *    writable REST aliases, to make this limiter span serverless
 *    instances/regions. KV_REST_API_READ_ONLY_TOKEN is intentionally ignored:
 *    rate limiting requires write commands.
 *  - Client IP extraction is centralised in `lib/client-ip.ts`. The order
 *    prefers `cf-connecting-ip` (Cloudflare edge), then `x-vercel-forwarded-for`,
 *    then `x-forwarded-for`. See `CLOUDFLARE_WAF.md` for proxy hardening.
 *  - Callers can pass an `additionalKey` (e.g. user id, email, cart id) so a
 *    single attacker cannot bypass the limiter merely by rotating IPs.
 *  - Ingress traffic from CGNAT / corporate proxies will share an IP. Limits
 *    should be set per scope to tolerate this.
 */

interface MemoryBucket {
  count: number
  resetAt: number
}

const memoryBuckets = new Map<string, MemoryBucket>()
const MEMORY_BUCKET_HARD_CAP = 5_000
const RATE_LIMIT_KEY_PREFIX = 'vb:rate'

function isRestUrl(value: string | undefined): value is string {
  return Boolean(value && /^https?:\/\//i.test(value))
}

function getRedisLimiterEnv(): { url: string; token: string } | null {
  const url = [
    process.env.UPSTASH_REDIS_REST_URL,
    process.env.KV_REST_API_URL,
    process.env.KV_REST_API_REDIS_URL,
    process.env.KV_REST_API_KV_URL,
  ].find(isRestUrl)
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN

  if (!url || !token) return null
  return { url, token }
}

function createRedisLimiterClient(): Redis | null {
  const env = getRedisLimiterEnv()
  if (!env) return null

  return new Redis({
    url: env.url,
    token: env.token,
  })
}

function hasRedisLimiterEnv(): boolean {
  return getRedisLimiterEnv() !== null
}

export function hasDistributedRateLimitEnv(): boolean {
  return hasRedisLimiterEnv()
}

function memoryLimit(key: string, limit: number, windowSeconds: number): boolean {
  // Soft eviction so a leaky-bucket attack cannot pin the process.
  if (memoryBuckets.size > MEMORY_BUCKET_HARD_CAP) {
    const now = Date.now()
    for (const [k, bucket] of memoryBuckets) {
      if (bucket.resetAt <= now) memoryBuckets.delete(k)
    }
    if (memoryBuckets.size > MEMORY_BUCKET_HARD_CAP) {
      // Last resort: drop a portion of the oldest entries.
      const toDrop = Math.ceil(memoryBuckets.size * 0.1)
      let dropped = 0
      for (const k of memoryBuckets.keys()) {
        if (dropped++ >= toDrop) break
        memoryBuckets.delete(k)
      }
    }
  }

  const now = Date.now()
  const resetAt = now + windowSeconds * 1000
  const bucket = memoryBuckets.get(key) ?? { count: 0, resetAt }
  if (bucket.resetAt <= now) {
    bucket.count = 0
    bucket.resetAt = resetAt
  }
  bucket.count += 1
  memoryBuckets.set(key, bucket)
  return bucket.count > limit
}

async function checkSingleKey(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const redisResult = await distributedRedisLimit(key, limit, windowSeconds)
  if (typeof redisResult === 'boolean') return redisResult

  if (!hasSupabaseAdminEnv()) return memoryLimit(key, limit, windowSeconds)

  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase.rpc('check_api_rate_limit', {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    })
    if (error) {
      console.warn('[rate-limit] DB limiter error, falling back to memory:', error.message)
      return memoryLimit(key, limit, windowSeconds)
    }
    return data !== true
  } catch (error) {
    console.warn(
      '[rate-limit] DB limiter threw, falling back to memory:',
      error instanceof Error ? error.message : error
    )
    return memoryLimit(key, limit, windowSeconds)
  }
}

async function distributedRedisLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<boolean | null> {
  const redis = createRedisLimiterClient()
  if (!redis) return null

  const redisKey = `${RATE_LIMIT_KEY_PREFIX}:${key}`

  try {
    const [, rawCount, rawTtl] = await redis
      .pipeline()
      // Create the bucket with an expiry only if it does not exist. INCR then
      // works for first and subsequent requests without extending the window.
      .set(redisKey, 0, { ex: windowSeconds, nx: true })
      .incr(redisKey)
      .ttl(redisKey)
      .exec<[unknown, number, number]>()

    const count = Number(rawCount)
    const ttl = Number(rawTtl)
    if (!Number.isFinite(count)) throw new Error('Redis limiter returned invalid count')

    // Defensive repair: if a provider ever returns a key without TTL, add one
    // asynchronously. The primary SET NX path should already prevent this.
    if (Number.isFinite(ttl) && ttl < 0) {
      void redis.expire(redisKey, windowSeconds).catch(() => undefined)
    }

    return count > limit
  } catch (error) {
    console.warn(
      '[rate-limit] Redis limiter error, falling back to Supabase:',
      error instanceof Error ? error.message : error
    )
    return null
  }
}

export async function isRateLimited(
  request: Request,
  scope: string,
  limit: number,
  windowSeconds = 60,
  additionalKey?: string | null
): Promise<boolean> {
  const ip = getClientIp(request)
  const ipKey = `${scope}:ip:${ip}`

  // IP gate first.
  if (await checkSingleKey(ipKey, limit, windowSeconds)) return true

  // If caller supplied an identity gate (user id, email, cart id), also throttle
  // by that — protects against IP rotation.
  if (additionalKey) {
    const idKey = `${scope}:id:${additionalKey}`
    // Identity bucket is a bit more generous so legitimate users on shared IPs
    // are not collateral damage.
    if (await checkSingleKey(idKey, Math.max(limit, limit * 2), windowSeconds)) return true
  }

  return false
}
