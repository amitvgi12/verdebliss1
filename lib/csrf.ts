/**
 * Lightweight CSRF defence for state-changing JSON APIs.
 *
 * Approach:
 *  1) Require a custom header (`x-vb-client: web`). Browsers cannot set custom
 *     headers on cross-origin requests without triggering a preflight, and our
 *     API does not return permissive `Access-Control-Allow-Origin`/`-Headers`
 *     for arbitrary origins, so a malicious site cannot satisfy this check.
 *  2) Validate `Origin` (or `Referer` as a fallback) against the allow-list.
 *
 * This is intentionally simple and stateless — no token issuance, no cookies.
 * It's a defence-in-depth layer on top of Supabase Auth bearer tokens.
 */
import { NextResponse } from 'next/server'

const ALLOWED_ORIGINS = new Set<string>(['https://www.verdebliss.com', 'https://verdebliss.com'])

function shouldAllowDevelopmentOrigin(origin: string): boolean {
  if (process.env.NODE_ENV === 'production') return false
  if (origin.startsWith('http://localhost')) return true
  if (origin.startsWith('http://127.0.0.1')) return true
  // Vercel preview deployments
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) return true
  return false
}

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false
  if (ALLOWED_ORIGINS.has(origin)) return true
  return shouldAllowDevelopmentOrigin(origin)
}

function originFromReferer(referer: string | null): string | null {
  if (!referer) return null
  try {
    const url = new URL(referer)
    return `${url.protocol}//${url.host}`
  } catch {
    return null
  }
}

/**
 * Returns a 403 NextResponse if the request fails CSRF checks; null otherwise.
 */
export function requireSameOriginRequest(request: Request): NextResponse | null {
  const clientHeader = request.headers.get('x-vb-client')
  if (clientHeader !== 'web') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const origin = request.headers.get('origin')
  const refererOrigin = originFromReferer(request.headers.get('referer'))
  const candidate = origin ?? refererOrigin

  if (!isAllowedOrigin(candidate)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return null
}
