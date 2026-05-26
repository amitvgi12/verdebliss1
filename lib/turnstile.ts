/**
 * Cloudflare Turnstile server-side verification.
 *
 * Why Turnstile over reCAPTCHA: no Google data-broker entanglement, no v3
 * "score" theatre, and a Cloudflare-only privacy posture that fits a brand
 * that markets on "we don't sell your data".
 *
 * Setup:
 *   1. Create a Turnstile site at https://dash.cloudflare.com/?to=/:account/turnstile
 *   2. Set NEXT_PUBLIC_TURNSTILE_SITE_KEY (browser-safe) and
 *      TURNSTILE_SECRET_KEY (server-only) in Vercel.
 *   3. Render the widget on the page (see TurnstileWidget.tsx).
 *   4. Send the resulting token in the request body as `turnstileToken`.
 *
 * If TURNSTILE_SECRET_KEY is not configured, this helper allows requests only
 * outside production so dev / preview environments don't break. Production
 * fails closed.
 */

import { getClientIp } from '@/lib/client-ip'

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export interface TurnstileVerifyResult {
  ok: boolean
  reason?: string
}

export function turnstileFailureMessage(reason?: string): string {
  if (reason === 'missing_token') {
    return 'Complete the Cloudflare verification box before continuing. If it is not visible, refresh checkout and try again.'
  }
  if (reason === 'timeout-or-duplicate') {
    return 'Cloudflare verification expired. Complete the box again and retry.'
  }
  if (reason === 'turnstile_not_configured' || reason === 'invalid-input-secret') {
    return 'Verification is not configured correctly. Please contact support.'
  }
  if (reason?.startsWith('verify_http_') || reason === 'verify_network_error') {
    return 'Verification could not be reached. Please retry in a moment.'
  }
  return 'Cloudflare verification could not be confirmed. Complete the box again and retry.'
}

export function isTurnstileConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY)
}

export async function verifyTurnstileToken(
  token: string | undefined | null,
  remoteIp?: string | null
): Promise<TurnstileVerifyResult> {
  if (!isTurnstileConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, reason: 'turnstile_not_configured' }
    }
    // Dev / preview convenience: silently pass when not configured.
    return { ok: true, reason: 'turnstile_not_configured' }
  }
  if (!token || typeof token !== 'string') {
    return { ok: false, reason: 'missing_token' }
  }

  const params = new URLSearchParams()
  params.set('secret', process.env.TURNSTILE_SECRET_KEY ?? '')
  params.set('response', token)
  if (remoteIp) params.set('remoteip', remoteIp)

  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      // 5s budget — Turnstile usually responds in <300ms.
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return { ok: false, reason: `verify_http_${res.status}` }
    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] }
    if (!data.success) {
      return {
        ok: false,
        reason: (data['error-codes'] ?? ['unknown']).join(','),
      }
    }
    return { ok: true }
  } catch (err) {
    // Network / timeout: fail closed in production, but don't take down the
    // whole site — log and reject with a recognisable reason so the UI can
    // suggest a retry.
    console.warn(
      '[turnstile] verification call failed:',
      err instanceof Error ? err.message : String(err)
    )
    return { ok: false, reason: 'verify_network_error' }
  }
}

function localClientIp(request: Request): string | null {
  const ip = getClientIp(request)
  return ip === 'unknown' ? null : ip
}

/**
 * Convenience wrapper: pass the Request and the parsed body. Returns the
 * verification result, with the IP automatically extracted.
 */
export async function verifyTurnstileFromRequest(
  request: Request,
  body: { turnstileToken?: unknown }
): Promise<TurnstileVerifyResult> {
  const token = typeof body.turnstileToken === 'string' ? body.turnstileToken : null
  const ip = localClientIp(request)
  return verifyTurnstileToken(token, ip)
}
