import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/seo'

export const maxDuration = 20

// Keep the highest-traffic ISR routes (and one dynamic route) warm between
// sparse visits. On a low-traffic site, ISR cache entries get evicted and
// serverless functions scale to zero, so real visitors pay cold blocking
// renders that show up as Poor TTFB in Speed Insights. Pinging these shifts the
// cold render onto the warmer instead of a customer.
//
// The Vercel cron only runs this DAILY (Hobby plan limit). For effective
// warming, point an external pinger (cron-job.org / UptimeRobot) at this
// endpoint every ~10 min with `Authorization: Bearer <CRON_SECRET>`. On Pro,
// bump the vercel.json schedule to `*/10 * * * *`. See docs/performance-follow-ups.md.
const WARM_PATHS = ['/', '/products', '/products/bakuchiol-renewal-serum', '/faq']

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  // Fail closed in production if the secret is missing (mirrors the other cron
  // routes); allow the bypass in dev so it can be hit from curl.
  if (!cronSecret) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
    }
  } else if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const warmed = await Promise.all(
    WARM_PATHS.map(async (path) => {
      const startedAt = Date.now()
      try {
        const res = await fetch(`${SITE_URL}${path}`, {
          headers: { 'x-vb-warmer': '1' },
          // Always reach the origin so a stale/evicted ISR entry actually
          // re-renders here rather than for the next real visitor.
          cache: 'no-store',
          signal: AbortSignal.timeout(8000),
        })
        return { path, status: res.status, ms: Date.now() - startedAt }
      } catch (err) {
        return {
          path,
          status: 0,
          ms: Date.now() - startedAt,
          error: err instanceof Error ? err.message : 'fetch failed',
        }
      }
    })
  )

  return NextResponse.json({ ok: true, warmed })
}
