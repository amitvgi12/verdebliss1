/**
 * Client IP extraction.
 *
 * Header order, most-trusted first:
 *   1. `cf-connecting-ip`         — set by Cloudflare's edge ONLY for traffic
 *      that actually transits Cloudflare. Cannot be spoofed at the origin
 *      because we lock origin access to Cloudflare via authenticated origin
 *      pulls or an IP allow-list (see CLOUDFLARE_WAF.md).
 *   2. `x-vercel-forwarded-for`   — Vercel's verified header. Stripped from
 *      inbound traffic and re-set at the Vercel edge.
 *   3. `x-forwarded-for`          — left-most entry is the client, but every
 *      hop can append; trustworthy only if upstream is known.
 *   4. `x-real-ip`                — common nginx convention for the last hop.
 *
 * Callers must NEVER use the result to authenticate or authorise — only as a
 * coarse rate-limit / abuse signal.
 */

export type ClientIpSource = 'cf' | 'vercel' | 'xff' | 'real-ip' | 'unknown'

export interface ClientIpResult {
  ip: string
  source: ClientIpSource
}

function pickFirst(value: string | null): string | null {
  if (!value) return null
  const first = value.split(',')[0]?.trim()
  return first && first.length > 0 ? first : null
}

export function getClientIp(request: Request): string {
  return resolveClientIp(request).ip
}

export function resolveClientIp(request: Request): ClientIpResult {
  const cf = pickFirst(request.headers.get('cf-connecting-ip'))
  if (cf) return { ip: cf, source: 'cf' }

  const vercel = pickFirst(request.headers.get('x-vercel-forwarded-for'))
  if (vercel) return { ip: vercel, source: 'vercel' }

  const xff = pickFirst(request.headers.get('x-forwarded-for'))
  if (xff) return { ip: xff, source: 'xff' }

  const real = pickFirst(request.headers.get('x-real-ip'))
  if (real) return { ip: real, source: 'real-ip' }

  return { ip: 'unknown', source: 'unknown' }
}
