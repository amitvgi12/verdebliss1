import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Per-request CSP nonce proxy + optional Cloudflare origin gate.
 *
 * - Generates a fresh nonce per request via Web Crypto (Edge runtime safe).
 * - Forwards the nonce to Server Components via the `x-nonce` request header,
 *   which `app/layout.tsx` reads with `headers()` to attach to JSON-LD blocks.
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

  const nonce = generateNonce()
  const isProduction = process.env.NODE_ENV === 'production'

  const cspDirectives = [
    "default-src 'self'",
    // strict-dynamic lets nonce'd scripts load further scripts; we still keep
    // an allow-list for Razorpay because their checkout JS lives at a fixed
    // origin and is loaded directly by client code.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://checkout.razorpay.com https://cdn.razorpay.com https://challenges.cloudflare.com${
      isProduction ? '' : " 'unsafe-eval'"
    }`,
    `script-src-elem 'self' 'nonce-${nonce}' 'strict-dynamic' https://checkout.razorpay.com https://cdn.razorpay.com https://challenges.cloudflare.com`,
    // Tailwind v4 + Next.js inject style tags. 'unsafe-inline' here is widely
    // accepted because style-based exfiltration is much weaker than script
    // execution. Hashes/nonces for styles are possible but break Tailwind's JIT.
    "style-src 'self' 'unsafe-inline'",
    "style-src-elem 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob: https://*.supabase.co",
    "connect-src 'self' https://*.supabase.co https://api.razorpay.com https://lumberjack.razorpay.com https://generativelanguage.googleapis.com https://challenges.cloudflare.com https://*.ingest.sentry.io https://*.ingest.us.sentry.io",
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

  // Forward nonce to Server Components.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('x-csp', cspDirectives)

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

export const config = {
  // Skip static assets, image optimisation, the Razorpay webhook (raw body!),
  // and the favicon/manifest. Everything else gets CSP + nonce.
  matcher: [
    '/((?!_next/static|_next/image|api/webhooks|favicon.ico|favicon.svg|manifest.json|robots.txt|images/).*)',
  ],
}
