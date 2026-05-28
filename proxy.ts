import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Per-request CSP nonce proxy + optional Cloudflare origin gate.
 *
 * - Generates a fresh nonce per request via Web Crypto (Edge runtime safe).
 * - Forwards the nonce to Server Components via the `x-nonce` request header
 *   for code that needs to emit nonce-bearing scripts.
 * - Forwards the CSP itself on the request. Next parses that request header to
 *   attach the same nonce to its framework/bootstrap scripts.
 * - Sets a strict CSP that drops `'unsafe-inline'` for scripts.
 * - When `CF_ORIGIN_SECRET` is set, rejects requests to `/api/*` that don't
 *   carry the matching `x-cf-origin-secret` header. See `CLOUDFLARE_WAF.md`.
 *
 * Why strict-dynamic + nonce: it lets Next's chunk loader (which is itself
 * loaded with the nonce) load further chunks without us having to nonce every
 * generated <script>.
 */

const CF_ORIGIN_SECRET = process.env.CF_ORIGIN_SECRET
const CF_ORIGIN_GATE_ENABLED = Boolean(CF_ORIGIN_SECRET)

// Emitted as a response header (not a <meta> tag) to keep the build fingerprint
// out of the rendered HTML where it could be scraped by bots.
const BUILD_SHA =
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.NEXT_PUBLIC_BUILD_SHA ??
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ??
  'dev'

// When Sentry is configured, its ingest endpoint must be in connect-src so
// error reports are not blocked by CSP. The pattern covers all Sentry org IDs.
const SENTRY_CONNECT_SRC = process.env.SENTRY_DSN ? ' https://o*.ingest.sentry.io' : ''
// Webhook routes are exempt: third parties (Razorpay) call them directly
// through Cloudflare, but the WAF rule for the webhook locks down the source
// IP so app-level gating is unnecessary. We still want them to work even if
// Cloudflare's header rewrite ever lags behind a deploy.
const CF_ORIGIN_GATE_EXEMPT = (path: string) =>
  path.startsWith('/api/webhooks/') || path === '/api/version' || path === '/api/csp-report'

export function proxy(request: NextRequest) {
  // 1) Optional Cloudflare origin gate — runs before any other work so direct
  //    -to-origin abuse pays the absolute minimum cost.
  if (
    CF_ORIGIN_GATE_ENABLED &&
    request.nextUrl.pathname.startsWith('/api/') &&
    !CF_ORIGIN_GATE_EXEMPT(request.nextUrl.pathname)
  ) {
    const presented = request.headers.get('x-cf-origin-secret')
    if (presented !== CF_ORIGIN_SECRET) {
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  const isProduction = process.env.NODE_ENV === 'production'
  const nonce = generateNonce()
  const cspDirectives = buildContentSecurityPolicy(nonce, {
    isProduction,
    sentryConnectSrc: SENTRY_CONNECT_SRC,
  })

  // Forward nonce to Server Components and to Next's framework script nonce parser.
  const requestHeaders = withSecurityRequestHeaders(request.headers, nonce, cspDirectives)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', cspDirectives)
  response.headers.set('Reporting-Endpoints', 'csp-endpoint="/api/csp-report"')
  response.headers.set(
    'Report-To',
    JSON.stringify({
      group: 'csp-endpoint',
      max_age: 10886400,
      endpoints: [{ url: '/api/csp-report' }],
    })
  )
  // Network Error Logging — captures DNS/TCP/TLS failures to the same reporting
  // endpoint. Zero-cost signal since the Report-To infrastructure is already live.
  response.headers.set(
    'NEL',
    JSON.stringify({ report_to: 'csp-endpoint', max_age: 10886400, include_subdomains: false })
  )
  // Build fingerprint in a response header rather than an HTML <meta> tag so it
  // is not included in the rendered page source (reduces bot scraping surface).
  response.headers.set('x-build-sha', BUILD_SHA)
  // Blocks Flash / Acrobat cross-domain policy file lookups. Trivial cost, defence-
  // in-depth for CDN-served assets even though Flash is end-of-life.
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
  // Prevents the browser from DNS-prefetching linked domains, which would leak
  // user browsing patterns to external DNS resolvers. Aligns with privacy-first brand.
  response.headers.set('X-DNS-Prefetch-Control', 'off')
  // NOTE: Cross-Origin-Embedder-Policy is intentionally absent. Razorpay
  // Checkout runs in a cross-origin iframe and COEP can break payment embed
  // behavior. Track this in docs/security-follow-ups.md and re-evaluate once
  // Razorpay publishes COEP-compatible embed docs.
  return response
}

function generateNonce(): string {
  // 16 random bytes → 22-24 char base64.
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  let str = ''
  for (const b of bytes) str += String.fromCharCode(b)
  // btoa is available in Edge runtime.
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function buildContentSecurityPolicy(
  nonce: string,
  {
    isProduction,
    sentryConnectSrc = '',
  }: {
    isProduction: boolean
    sentryConnectSrc?: string
  }
): string {
  const scriptSrc = `'self' 'nonce-${nonce}' 'strict-dynamic' https://checkout.razorpay.com https://cdn.razorpay.com https://challenges.cloudflare.com https://va.vercel-scripts.com${
    isProduction ? '' : " 'unsafe-eval'"
  }`

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    `script-src-elem 'self' 'nonce-${nonce}' 'strict-dynamic' https://checkout.razorpay.com https://cdn.razorpay.com https://challenges.cloudflare.com https://va.vercel-scripts.com`,
    // Tailwind v4 + Next.js inject style tags. 'unsafe-inline' here is widely
    // accepted because style-based exfiltration is much weaker than script
    // execution. Hashes/nonces for styles are possible but can break Tailwind's
    // JIT/runtime styles. Track removal in docs/security-follow-ups.md.
    "style-src 'self' 'unsafe-inline'",
    "style-src-elem 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob: https://*.supabase.co",
    `connect-src 'self' https://*.supabase.co https://api.razorpay.com https://lumberjack.razorpay.com https://generativelanguage.googleapis.com https://challenges.cloudflare.com https://va.vercel-scripts.com https://vitals.vercel-insights.com${sentryConnectSrc}`,
    'frame-src https://api.razorpay.com https://checkout.razorpay.com https://challenges.cloudflare.com',
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "manifest-src 'self'",
    'upgrade-insecure-requests',
    'report-to csp-endpoint',
    'report-uri /api/csp-report',
  ].join('; ')
}

export function withSecurityRequestHeaders(
  headers: Headers,
  nonce: string,
  cspDirectives: string
): Headers {
  const requestHeaders = new Headers(headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('x-csp', cspDirectives)
  requestHeaders.set('Content-Security-Policy', cspDirectives)
  return requestHeaders
}

export const config = {
  // Skip static assets, image optimisation, the Razorpay webhook (raw body!),
  // and metadata files. Everything else gets CSP + nonce.
  matcher: [
    '/((?!_next/static|_next/image|api/webhooks|favicon.ico|favicon.svg|manifest.json|robots.txt|sitemap.xml|images/).*)',
  ],
}
