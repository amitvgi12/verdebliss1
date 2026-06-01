/**
 * Client IP extraction.
 *
 * Header order, most-trusted first:
 *   1. `cf-connecting-ip`         — trusted only when proxy.ts has already
 *      verified the Cloudflare origin secret and stamped x-vb-origin-verified.
 *   2. `x-vercel-forwarded-for`   — Vercel's verified header. Stripped from
 *      inbound traffic and re-set at the Vercel edge.
 *   3. `x-forwarded-for`          — development / explicitly trusted proxy
 *      fallback only. Never rely on this for production authz decisions.
 *   4. `x-real-ip`                — development / explicitly trusted proxy
 *      fallback only.
 *
 * Callers must NEVER use the result to authenticate or authorise — only as a
 * coarse rate-limit / abuse signal.
 */

import { ORIGIN_VERIFIED_CLOUDFLARE, ORIGIN_VERIFIED_HEADER } from '@/lib/origin-trust'

export type ClientIpSource = 'cf' | 'vercel' | 'xff' | 'real-ip' | 'unknown'

export interface ClientIpResult {
  ip: string
  source: ClientIpSource
}

export interface ClientIpOptions {
  trustGenericProxyHeaders?: boolean
}

function pickFirst(value: string | null): string | null {
  if (!value) return null
  const first = value.split(',')[0]?.trim()
  return first && first.length > 0 ? first : null
}

function shouldTrustGenericProxyHeaders(options?: ClientIpOptions): boolean {
  if (typeof options?.trustGenericProxyHeaders === 'boolean') {
    return options.trustGenericProxyHeaders
  }
  if (process.env.TRUST_GENERIC_PROXY_HEADERS === 'true') return true
  return process.env.NODE_ENV !== 'production'
}

function hasVerifiedCloudflareOrigin(headers: Headers): boolean {
  return headers.get(ORIGIN_VERIFIED_HEADER) === ORIGIN_VERIFIED_CLOUDFLARE
}

export function getClientIp(request: Request, options?: ClientIpOptions): string {
  return resolveClientIp(request, options).ip
}

export function resolveClientIp(request: Request, options?: ClientIpOptions): ClientIpResult {
  if (hasVerifiedCloudflareOrigin(request.headers)) {
    const cf = pickFirst(request.headers.get('cf-connecting-ip'))
    if (cf) return { ip: cf, source: 'cf' }
  }

  const vercel = pickFirst(request.headers.get('x-vercel-forwarded-for'))
  if (vercel) return { ip: vercel, source: 'vercel' }

  if (!shouldTrustGenericProxyHeaders(options)) {
    return { ip: 'unknown', source: 'unknown' }
  }

  const xff = pickFirst(request.headers.get('x-forwarded-for'))
  if (xff) return { ip: xff, source: 'xff' }

  const real = pickFirst(request.headers.get('x-real-ip'))
  if (real) return { ip: real, source: 'real-ip' }

  return { ip: 'unknown', source: 'unknown' }
}
