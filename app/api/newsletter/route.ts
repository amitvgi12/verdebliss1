import { NextResponse } from 'next/server'
import { isRateLimited } from '@/lib/rate-limit'
import { requireSameOriginRequest } from '@/lib/csrf'
import { verifyTurnstileFromRequest } from '@/lib/turnstile'
import { createSupabaseAdmin, hasSupabaseAdminEnv } from '@/lib/supabase-admin'
import {
  createNewsletterConfirmationToken,
  hashNewsletterConfirmationToken,
  newsletterConfirmationExpiresAt,
  newsletterConfirmationUrl,
} from '@/lib/newsletter-confirmation'

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

    if (process.env.NODE_ENV === 'production' && !process.env.NEWSLETTER_CONFIRMATION_WEBHOOK_URL) {
      return NextResponse.json(
        { error: 'Newsletter confirmation email is not configured. Please try again later.' },
        { status: 503 }
      )
    }

    const supabase = createSupabaseAdmin()
    const { data: existing, error: existingError } = await supabase
      .from('customer_consents')
      .select('consented')
      .eq('email', email)
      .eq('consent_type', 'newsletter')
      .maybeSingle()

    if (existingError) throw new Error(existingError.message)

    if (existing?.consented) {
      return NextResponse.json({ ok: true, stored: true, status: 'already_confirmed' })
    }

    const token = createNewsletterConfirmationToken()
    const confirmationUrl = newsletterConfirmationUrl(request.url, token)

    const { error } = await supabase.from('customer_consents').upsert(
      {
        email,
        consent_type: 'newsletter',
        source,
        consented: false,
        consented_at: null,
        revoked_at: null,
        confirmation_token_hash: hashNewsletterConfirmationToken(token),
        confirmation_sent_at: new Date().toISOString(),
        confirmation_expires_at: newsletterConfirmationExpiresAt(),
      },
      { onConflict: 'email,consent_type' }
    )

    if (error) throw new Error(error.message)

    const emailResult = await sendNewsletterConfirmation(email, confirmationUrl)
    return NextResponse.json({
      ok: true,
      stored: true,
      status: 'confirmation_required',
      confirmationSent: emailResult.sent,
      ...(process.env.NODE_ENV === 'production' ? {} : { confirmationUrl }),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to subscribe' },
      { status: 400 }
    )
  }
}

async function sendNewsletterConfirmation(email: string, confirmationUrl: string) {
  const endpoint = process.env.NEWSLETTER_CONFIRMATION_WEBHOOK_URL
  if (!endpoint) return { sent: false }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(process.env.NEWSLETTER_CONFIRMATION_WEBHOOK_SECRET
        ? { authorization: `Bearer ${process.env.NEWSLETTER_CONFIRMATION_WEBHOOK_SECRET}` }
        : {}),
    },
    body: JSON.stringify({
      email,
      confirmationUrl,
      source: 'verdebliss_newsletter_double_opt_in',
    }),
  })

  if (!response.ok) {
    throw new Error('Unable to send confirmation email. Please try again shortly.')
  }

  return { sent: true }
}
