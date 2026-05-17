import { NextRequest, NextResponse } from 'next/server'
import { DELIVERY_DAYS } from '@/constants/shipping'
import { assessCodPincode } from '@/lib/cod-risk'

const PIN_RE = /^\d{6}$/

export function GET(request: NextRequest) {
  const pincode = request.nextUrl.searchParams.get('pincode')?.trim() ?? ''

  if (!PIN_RE.test(pincode)) {
    return NextResponse.json({ error: 'Enter a valid 6-digit PIN code' }, { status: 400 })
  }

  const codDecision = assessCodPincode(pincode)

  return NextResponse.json({
    pincode,
    dispatchWindow: 'Usually dispatched within 1 business day',
    deliveryEstimate: DELIVERY_DAYS,
    prepaidAvailable: true,
    codDecision,
  })
}
