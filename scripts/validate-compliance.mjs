/* global console, process */

const STRICT =
  process.env.LAUNCH_MODE === 'true' ||
  process.env.VERDEBLISS_ENFORCE_COMPLIANCE === 'true' ||
  process.env.VERCEL_ENV === 'production'

if (!STRICT) {
  process.exit(0)
}

const required = [
  'NEXT_PUBLIC_VERDEBLISS_LEGAL_NAME',
  'NEXT_PUBLIC_VERDEBLISS_CIN',
  'NEXT_PUBLIC_VERDEBLISS_GSTIN',
  'NEXT_PUBLIC_VERDEBLISS_REGISTERED_OFFICE_LINE1',
  'NEXT_PUBLIC_VERDEBLISS_REGISTERED_OFFICE_CITY',
  'NEXT_PUBLIC_VERDEBLISS_REGISTERED_OFFICE_STATE',
  'NEXT_PUBLIC_VERDEBLISS_REGISTERED_OFFICE_PINCODE',
  'NEXT_PUBLIC_VERDEBLISS_SUPPORT_PHONE_DISPLAY',
  'NEXT_PUBLIC_VERDEBLISS_SUPPORT_PHONE_HREF',
  'NEXT_PUBLIC_VERDEBLISS_SUPPORT_EMAIL',
  'NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_OFFICER_NAME',
  'NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_EMAIL',
]

const placeholder =
  /\b(DEMO|placeholder|example\.com|Demo House|Lorem|dummy|sample|fake|to be configured|configure me|pending verification|pending appointment|test value)\b/i
const cin = /^[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/
const gstin = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const errors = []

for (const key of required) {
  const value = process.env[key]?.trim() ?? ''
  if (!value) {
    errors.push(`${key} is required`)
    continue
  }
  if (placeholder.test(value)) errors.push(`${key} contains a placeholder or fake value`)
}

const cinValue = process.env.NEXT_PUBLIC_VERDEBLISS_CIN?.trim() ?? ''
const gstinValue = process.env.NEXT_PUBLIC_VERDEBLISS_GSTIN?.trim() ?? ''
const phoneDisplay = process.env.NEXT_PUBLIC_VERDEBLISS_SUPPORT_PHONE_DISPLAY?.trim() ?? ''
const phoneHref = process.env.NEXT_PUBLIC_VERDEBLISS_SUPPORT_PHONE_HREF?.trim() ?? ''
const supportEmail = process.env.NEXT_PUBLIC_VERDEBLISS_SUPPORT_EMAIL?.trim() ?? ''
const grievanceEmail = process.env.NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_EMAIL?.trim() ?? ''

if (!cin.test(cinValue) || /U20231PN2026PTC000001/i.test(cinValue)) {
  errors.push('NEXT_PUBLIC_VERDEBLISS_CIN must be a verified 21-character CIN')
}
if (!gstin.test(gstinValue) || /27ABCDE1234F1Z5/i.test(gstinValue)) {
  errors.push('NEXT_PUBLIC_VERDEBLISS_GSTIN must be a verified 15-character GSTIN')
}
if (!isRealPhone(phoneDisplay) || !isRealPhone(phoneHref)) {
  errors.push('NEXT_PUBLIC_VERDEBLISS_SUPPORT_PHONE_* must be real business phone values')
}
if (!email.test(supportEmail) || /\.(test|example)$/i.test(supportEmail)) {
  errors.push('NEXT_PUBLIC_VERDEBLISS_SUPPORT_EMAIL must be a real support email')
}
if (!email.test(grievanceEmail) || /\.(test|example)$/i.test(grievanceEmail)) {
  errors.push('NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_EMAIL must be a real grievance email')
}
if (
  process.env.ORDER_FROM_EMAIL &&
  /onboarding@resend\.dev|example\.com|\.test/i.test(process.env.ORDER_FROM_EMAIL)
) {
  errors.push('ORDER_FROM_EMAIL must not use a demo sender in production')
}

if (errors.length) {
  console.error('Production compliance validation failed:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

function isRealPhone(value) {
  const digits = value.replace(/\D/g, '')
  if (!digits) return false
  if (/^(\d)\1{7,}$/.test(digits)) return false
  if (['1234567890', '0123456789', '9876543210'].includes(digits)) return false
  if (digits.includes('40002026') || digits.includes('67890123')) return false
  return /^\+?[0-9][0-9\s-]{7,18}$/.test(value)
}
