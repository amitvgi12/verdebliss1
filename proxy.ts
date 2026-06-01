import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  CF_ORIGIN_SECRET_HEADER,
  ORIGIN_VERIFIED_CLOUDFLARE,
  ORIGIN_VERIFIED_HEADER,
} from '@/lib/origin-trust'

/**
 * Per-request CSP nonce proxy + optional Cloudflare origin gate.
 *
 * - Generates a fresh nonce per request via Web Crypto (Edge runtime safe).
 * - Forwards the nonce to Server Components via the `x-nonce` request header
 *   for code that needs to emit nonce-bearing scripts.
 * - Forwards the CSP itself on the request. Next parses that request header to
 *   attach the same nonce to its framework/bootstrap scripts.
 * - Sets a route-aware script CSP (see `requiresScriptNonce`): a per-request
 *   nonce + `'strict-dynamic'` for always-dynamic routes, and `'unsafe-inline'`
 *   for static/ISR routes whose cached HTML cannot embed a per-request nonce.
 * - When `CF_ORIGIN_SECRET` is set, rejects protected `/api/*` requests that
 *   don't carry the matching `x-cf-origin-secret` header. See
 *   `CLOUDFLARE_WAF.md`.
 *
 * Why strict-dynamic + nonce: it lets Next's chunk loader (which is itself
 * loaded with the nonce) load further chunks without us having to nonce every
 * generated <script>. The catch is that the nonce is generated per request, so
 * it can only match a page that is rendered per request. A statically generated
 * or ISR-cached page bakes its <script> tags ahead of time with no nonce; under
 * `'strict-dynamic'` those nonce-less scripts are blocked and the page renders
 * blank. Such routes therefore fall back to `'unsafe-inline'`.
 */

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

interface CloudflareOriginGateEnv {
  CF_ORIGIN_SECRET?: string
  CF_ORIGIN_GATE_REQUIRED?: string
  NODE_ENV?: string
}

interface CloudflareOriginGateDecision {
  allowed: boolean
  verified: boolean
  status?: 403 | 503
  message?: string
}

// Routes that always render per-request (authenticated account pages, payment
// checkout, and the interactive forms) can carry a fresh per-request nonce, so
// they get the strict `'nonce-…' 'strict-dynamic'` script policy.
//
// Every other route is static / ISR-cacheable: its HTML is generated ahead of
// the request, so it cannot embed the per-request nonce and must use
// `'unsafe-inline'` instead — the standard ISR-compatible compromise for pages
// that carry no authenticated context. Defaulting *unknown* routes to the
// inline policy is deliberate: it means a newly added static page (e.g. a legal
// or marketing page) can never silently blank out under a nonce it cannot
// satisfy. Only this explicit, rarely-changing set opts into nonce enforcement.
const NONCE_ROUTE_PREFIXES = ['/account', '/checkout', '/contact', '/quiz', '/refund']

export function requiresScriptNonce(pathname: string): boolean {
  return NONCE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export function isCloudflareOriginGateProtected(pathname: string): boolean {
  return pathname.startsWith('/api/') && !CF_ORIGIN_GATE_EXEMPT(pathname)
}

export function checkCloudflareOriginGate(
  pathname: string,
  headers: Headers,
  env: CloudflareOriginGateEnv = process.env
): CloudflareOriginGateDecision {
  if (!isCloudflareOriginGateProtected(pathname)) {
    return { allowed: true, verified: false }
  }

  const secret = env.CF_ORIGIN_SECRET
  const required = env.NODE_ENV === 'production' && env.CF_ORIGIN_GATE_REQUIRED === 'true'

  if (!secret) {
    if (required) {
      return {
        allowed: false,
        verified: false,
        status: 503,
        message: 'Origin protection is not configured',
      }
    }
    return { allowed: true, verified: false }
  }

  if (headers.get(CF_ORIGIN_SECRET_HEADER) !== secret) {
    return { allowed: false, verified: false, status: 403, message: 'Forbidden' }
  }

  return { allowed: true, verified: true }
}

export function proxy(request: NextRequest) {
  // 1) Cloudflare origin gate runs before any other work so direct-to-origin
  // abuse pays the absolute minimum cost. CF_ORIGIN_GATE_REQUIRED=true makes
  // production fail closed if the secret is missing.
  const originGate = checkCloudflareOriginGate(request.nextUrl.pathname, request.headers)
  if (!originGate.allowed) {
    return new NextResponse(originGate.message, { status: originGate.status })
  }

  const isProduction = process.env.NODE_ENV === 'production'
  const useNonce = requiresScriptNonce(request.nextUrl.pathname)
  // Empty on inline routes so StructuredData and other x-nonce consumers fall
  // back cleanly (an empty nonce attribute is still allowed under unsafe-inline).
  const nonce = useNonce ? generateNonce() : ''
  const cspDirectives = buildContentSecurityPolicy(nonce, {
    isProduction,
    sentryConnectSrc: SENTRY_CONNECT_SRC,
    useNonce,
  })

  // Forward nonce to Server Components and to Next's framework script nonce parser.
  const requestHeaders = withSecurityRequestHeaders(request.headers, nonce, cspDirectives, {
    cloudflareOriginVerified: originGate.verified,
  })

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
    useNonce = true,
  }: {
    isProduction: boolean
    sentryConnectSrc?: string
    useNonce?: boolean
  }
): string {
  const scriptHosts =
    'https://checkout.razorpay.com https://cdn.razorpay.com https://challenges.cloudflare.com https://va.vercel-scripts.com'
  // Per-request (dynamic) routes: nonce + 'strict-dynamic'. Static/ISR routes:
  // 'unsafe-inline' so Next's nonce-less bootstrap and RSC hydration scripts in
  // the cached HTML are allowed to run. See `requiresScriptNonce` above.
  const scriptCore = useNonce
    ? `'self' 'nonce-${nonce}' 'strict-dynamic' ${scriptHosts}`
    : `'self' 'unsafe-inline' ${scriptHosts}`

  return [
    "default-src 'self'",
    // 'unsafe-eval' is enabled only outside production for Next's dev tooling.
    `script-src ${scriptCore}${isProduction ? '' : " 'unsafe-eval'"}`,
    `script-src-elem ${scriptCore}`,
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
  cspDirectives: string,
  { cloudflareOriginVerified = false }: { cloudflareOriginVerified?: boolean } = {}
): Headers {
  const requestHeaders = new Headers(headers)
  requestHeaders.delete(CF_ORIGIN_SECRET_HEADER)
  requestHeaders.delete(ORIGIN_VERIFIED_HEADER)

  if (cloudflareOriginVerified) {
    requestHeaders.set(ORIGIN_VERIFIED_HEADER, ORIGIN_VERIFIED_CLOUDFLARE)
  }

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
