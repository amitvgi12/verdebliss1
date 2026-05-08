import { NextResponse } from 'next/server'
import {
  createSupabaseAdmin,
  getUserFromAuthorizationHeader,
  hasSupabaseAdminEnv,
} from '@/lib/supabase-admin'

export async function POST(request: Request) {
  try {
    const user = await getUserFromAuthorizationHeader(request.headers.get('authorization'))
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
    if (!hasSupabaseAdminEnv())
      return NextResponse.json({ error: 'Refund service not configured' }, { status: 503 })

    const body = await request.json()
    const reason = String(body?.reason ?? '').trim()
    const orderId = String(body?.orderId ?? '').trim() || null
    if (reason.length < 10 || reason.length > 2000) {
      throw new Error('Please provide a refund reason between 10 and 2000 characters')
    }

    const supabase = createSupabaseAdmin()
    const { error } = await supabase.from('refunds').insert({
      user_id: user.id,
      order_id: orderId,
      reason,
      status: 'requested',
      details: { source: 'website_refund_form' },
    })

    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to request refund' },
      { status: 400 }
    )
  }
}
