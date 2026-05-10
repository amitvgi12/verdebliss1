import { NextResponse } from 'next/server'
import { isRateLimited } from '@/lib/rate-limit'
import { requireSameOriginRequest } from '@/lib/csrf'
import { verifyTurnstileFromRequest } from '@/lib/turnstile'
import { createSupabaseAdmin, hasSupabaseAdminEnv } from '@/lib/supabase-admin'

const EMAIL_RE = /\S+@\S+\.\S+/

export async function POST(request: Request) {
  try {
    const csrfFailure = requireSameOriginRequest(request)
    if (csrfFailure) return csrfFailure

    const body = await request.json()
    const email = String(body?.email ?? '')
      .trim()
      .toLowerCase()

    if (await isRateLimited(request, 'newsletter', 5, 60, email || null)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429 }
      )
    }

    // Bot defence: Turnstile + honeypot.
    const turnstile = await verifyTurnstileFromRequest(request, body)
    if (!turnstile.ok) {
      return NextResponse.json(
        { error: 'Bot check failed. Please refresh and try again.' },
        { status: 400 }
      )
    }

    const source = String(body?.source ?? 'homepage_newsletter').slice(0, 100)
    const honeypot = String(body?.website ?? '').trim()

    if (honeypot) return NextResponse.json({ ok: true })
    if (!EMAIL_RE.test(email) || email.length > 200) throw new Error('Please enter a valid email')

    if (!hasSupabaseAdminEnv()) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Newsletter service is not configured. Please try again later.' },
          { status: 503 }
        )
      }
      return NextResponse.json({ ok: true, stored: false, reason: 'supabase_admin_not_configured' })
    }

    const supabase = createSupabaseAdmin()
    const { error } = await supabase.from('customer_consents').upsert(
      {
        email,
        consent_type: 'newsletter',
        source,
        consented: true,
        consented_at: new Date().toISOString(),
      },
      { onConflict: 'email,consent_type' }
    )

    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true, stored: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to subscribe' },
      { status: 400 }
    )
  }
}
