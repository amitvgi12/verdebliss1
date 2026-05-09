import { createSupabaseAdmin, hasSupabaseAdminEnv } from '@/lib/supabase-admin'

interface MemoryBucket {
  count: number
  resetAt: number
}

const memoryBuckets = new Map<string, MemoryBucket>()

function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

function memoryLimit(key: string, limit: number, windowSeconds: number): boolean {
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

export async function isRateLimited(
  request: Request,
  scope: string,
  limit: number,
  windowSeconds = 60
): Promise<boolean> {
  const ip = getClientIp(request)
  const key = `${scope}:${ip}`

  if (!hasSupabaseAdminEnv()) {
    return memoryLimit(key, limit, windowSeconds)
  }

  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase.rpc('check_api_rate_limit', {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  })

  if (error) {
    console.warn('[rate-limit] Falling back to in-memory limiter:', error.message)
    return memoryLimit(key, limit, windowSeconds)
  }

  return data !== true
}
