import { NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdminEnv } from '@/lib/supabase-admin'

const EMAIL_RE = /\S+@\S+\.\S+/
const TOPICS = new Set([
  'Product question',
  'Order issue',
  'Returns & refunds',
  'Press enquiry',
  'Partnership',
  'Other',
])

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = String(body?.name ?? '').trim()
    const email = String(body?.email ?? '')
      .trim()
      .toLowerCase()
    const topic = String(body?.topic ?? 'Other').trim() || 'Other'
    const message = String(body?.message ?? '').trim()
    const honeypot = String(body?.website ?? '').trim()

    if (honeypot) return NextResponse.json({ ok: true })
    if (!name || name.length > 120) throw new Error('Please enter your name')
    if (!EMAIL_RE.test(email) || email.length > 200) throw new Error('Please enter a valid email')
    if (!message || message.length < 10 || message.length > 4000) {
      throw new Error('Please enter a message between 10 and 4000 characters')
    }

    if (!hasSupabaseAdminEnv()) {
      return NextResponse.json({ ok: true, stored: false, reason: 'supabase_admin_not_configured' })
    }

    const supabase = createSupabaseAdmin()
    const { error } = await supabase.from('contact_tickets').insert({
      name,
      email,
      topic: TOPICS.has(topic) ? topic : 'Other',
      message,
      source: 'website_contact_form',
      status: 'new',
    })

    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true, stored: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to submit message' },
      { status: 400 }
    )
  }
}
