import { NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdminEnv } from '@/lib/supabase-admin'
import { hashNewsletterConfirmationToken } from '@/lib/newsletter-confirmation'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')?.trim()
  const redirectUrl = new URL('/', request.url)

  if (!token || token.length < 24) {
    redirectUrl.searchParams.set('newsletter', 'invalid')
    return NextResponse.redirect(redirectUrl)
  }

  if (!hasSupabaseAdminEnv()) {
    redirectUrl.searchParams.set('newsletter', 'unavailable')
    return NextResponse.redirect(redirectUrl)
  }

  try {
    const supabase = createSupabaseAdmin()
    const tokenHash = hashNewsletterConfirmationToken(token)
    const { data, error } = await supabase
      .from('customer_consents')
      .select('id, confirmation_expires_at')
      .eq('consent_type', 'newsletter')
      .eq('confirmation_token_hash', tokenHash)
      .maybeSingle()

    if (error) throw new Error(error.message)

    if (!data) {
      redirectUrl.searchParams.set('newsletter', 'invalid')
      return NextResponse.redirect(redirectUrl)
    }

    const expiresAt = Date.parse(String(data.confirmation_expires_at ?? ''))
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      redirectUrl.searchParams.set('newsletter', 'expired')
      return NextResponse.redirect(redirectUrl)
    }

    const now = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('customer_consents')
      .update({
        consented: true,
        consented_at: now,
        confirmed_at: now,
        revoked_at: null,
        confirmation_token_hash: null,
        confirmation_expires_at: null,
      })
      .eq('id', data.id)

    if (updateError) throw new Error(updateError.message)

    redirectUrl.searchParams.set('newsletter', 'confirmed')
    return NextResponse.redirect(redirectUrl)
  } catch {
    redirectUrl.searchParams.set('newsletter', 'error')
    return NextResponse.redirect(redirectUrl)
  }
}
