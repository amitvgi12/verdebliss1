import { NextResponse } from 'next/server'
import { requireSameOriginRequest } from '@/lib/csrf'
import {
  createSupabaseAdmin,
  getUserFromAuthorizationHeader,
  hasSupabaseAdminEnv,
} from '@/lib/supabase-admin'

const TRACKABLE_STATUSES = ['Processing', 'COD Pending', 'Shipped', 'Out for Delivery', 'Delivered']

const COURIER_TRACKING_BASE: Record<string, string> = {
  Delhivery: 'https://www.delhivery.com/track/package/',
  Ekart: 'https://ekartlogistics.com/shipmenttrack/',
  Shadowfax: 'https://shadowfax.in/track/',
  Xpressbees: 'https://www.xpressbees.com/track/',
  'Ecom Express': 'https://ecomexpress.in/tracking/?awb_field=',
  'Blue Dart': 'https://www.bluedart.com/tracking?trackfor=',
  Shiprocket: 'https://shiprocket.co/tracking/',
  DTDC: 'https://www.dtdc.in/tracking/shipment-details?awbNo=',
}

// Couriers with no external tracking URL — AWB is stored but no "Track on courier" button appears.
// Use "Mock" during development/testing before signing up with a real courier.
const NO_URL_COURIERS = new Set(['Mock'])

export async function PATCH(request: Request) {
  try {
    const csrfFailure = requireSameOriginRequest(request)
    if (csrfFailure) return csrfFailure

    if (!hasSupabaseAdminEnv()) {
      return NextResponse.json({ error: 'Admin not configured' }, { status: 503 })
    }

    const user = await getUserFromAuthorizationHeader(request.headers.get('authorization'))
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

    const admin = createSupabaseAdmin()

    const { data: profile } = await admin
      .from('profiles')
      .select('is_staff')
      .eq('id', user.id)
      .single()

    if (!profile?.is_staff) {
      return NextResponse.json({ error: 'Staff access required' }, { status: 403 })
    }

    const body = await request.json()
    const { orderId, status, tracking_id, courier_partner, estimated_delivery } = body

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    if (status && !TRACKABLE_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${TRACKABLE_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    // Free-text tracking fields are staff-supplied but still bounded so a typo or
    // a malformed value can't be written straight to the order row.
    if (tracking_id !== undefined && (typeof tracking_id !== 'string' || tracking_id.length > 64)) {
      return NextResponse.json({ error: 'Invalid tracking_id' }, { status: 400 })
    }
    if (
      courier_partner !== undefined &&
      (typeof courier_partner !== 'string' || courier_partner.length > 64)
    ) {
      return NextResponse.json({ error: 'Invalid courier_partner' }, { status: 400 })
    }
    if (
      estimated_delivery !== undefined &&
      estimated_delivery !== null &&
      (typeof estimated_delivery !== 'string' || Number.isNaN(Date.parse(estimated_delivery)))
    ) {
      return NextResponse.json({ error: 'Invalid estimated_delivery' }, { status: 400 })
    }

    const { data: order, error: fetchErr } = await admin
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .single()

    if (fetchErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const now = new Date().toISOString()

    const tracking_url =
      tracking_id &&
      courier_partner &&
      COURIER_TRACKING_BASE[courier_partner] &&
      !NO_URL_COURIERS.has(courier_partner)
        ? `${COURIER_TRACKING_BASE[courier_partner]}${tracking_id}`
        : undefined

    const updates: Record<string, unknown> = { updated_at: now }

    if (status) updates.status = status
    if (tracking_id !== undefined) updates.tracking_id = tracking_id
    if (courier_partner !== undefined) updates.courier_partner = courier_partner
    if (tracking_url !== undefined) updates.tracking_url = tracking_url
    if (estimated_delivery !== undefined) updates.estimated_delivery = estimated_delivery

    if (status === 'Shipped' && order.status !== 'Shipped') updates.shipped_at = now
    if (status === 'Out for Delivery' && order.status !== 'Out for Delivery')
      updates.out_for_delivery_at = now
    if (status === 'Delivered' && order.status !== 'Delivered') updates.delivered_at = now

    const { error: updateErr } = await admin.from('orders').update(updates).eq('id', orderId)

    if (updateErr) throw updateErr

    return NextResponse.json({ success: true, tracking_url: tracking_url ?? null })
  } catch (err) {
    // Log the detail server-side; never echo raw DB/internal errors.
    console.error('[admin/orders/track] PATCH', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const csrfFailure = requireSameOriginRequest(request)
    if (csrfFailure) return csrfFailure

    if (!hasSupabaseAdminEnv()) {
      return NextResponse.json({ error: 'Admin not configured' }, { status: 503 })
    }

    const user = await getUserFromAuthorizationHeader(request.headers.get('authorization'))
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

    const admin = createSupabaseAdmin()

    const { data: profile } = await admin
      .from('profiles')
      .select('is_staff')
      .eq('id', user.id)
      .single()

    if (!profile?.is_staff) {
      return NextResponse.json({ error: 'Staff access required' }, { status: 403 })
    }

    return NextResponse.json({
      couriers: [...Object.keys(COURIER_TRACKING_BASE), ...NO_URL_COURIERS],
    })
  } catch (err) {
    console.error('[admin/orders/track] GET', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
