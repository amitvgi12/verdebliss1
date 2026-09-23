/* global console, process */

const STRICT =
  process.env.npm_lifecycle_event === 'prebuild' ||
  process.env.NODE_ENV === 'production' ||
  process.env.LAUNCH_MODE === 'true' ||
  process.env.VERDEBLISS_ENFORCE_COMPLIANCE === 'true' ||
  process.env.VERCEL_ENV === 'production'
const strictReasons = [
  process.env.npm_lifecycle_event === 'prebuild' ? 'npm run build' : null,
  process.env.NODE_ENV === 'production' ? 'NODE_ENV=production' : null,
  process.env.LAUNCH_MODE === 'true' ? 'LAUNCH_MODE=true' : null,
  process.env.VERDEBLISS_ENFORCE_COMPLIANCE === 'true'
    ? 'VERDEBLISS_ENFORCE_COMPLIANCE=true'
    : null,
  process.env.VERCEL_ENV === 'production' ? 'VERCEL_ENV=production' : null,
].filter(Boolean)

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
  'NEXT_PUBLIC_VERDEBLISS_SUPPORT_EMAIL',
  'NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_OFFICER_NAME',
  'NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_EMAIL',
]

const placeholder =
  /\b(DEMO|placeholder|example\.com|Demo House|Lorem|dummy|sample|fake|to be configured|configure me|pending verification|pending appointment|test value)\b/i
const knownFakeGrievanceOfficerName = /^(Action Sharma|Demon Sharma)$/i
const cin = /^[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/
const gstin = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const errors = []

if (process.env.LEGAL_DATA_VERIFIED !== 'true') {
  errors.push('LEGAL_DATA_VERIFIED=true is required after documentary legal verification')
}

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
const phoneDisplay =
  process.env.NEXT_PUBLIC_VERDEBLISS_SUPPORT_PHONE_DISPLAY?.trim() ||
  process.env.NEXT_PUBLIC_VERDEBLISS_SUPPORT_PHONE?.trim() ||
  ''
const phoneHrefRaw = process.env.NEXT_PUBLIC_VERDEBLISS_SUPPORT_PHONE_HREF?.trim() ?? ''
const phoneHref = normalizePhoneHref(
  phoneHrefRaw || process.env.NEXT_PUBLIC_VERDEBLISS_SUPPORT_PHONE?.trim() || phoneDisplay
)
const supportEmail = process.env.NEXT_PUBLIC_VERDEBLISS_SUPPORT_EMAIL?.trim() ?? ''
const grievanceEmail = process.env.NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_EMAIL?.trim() ?? ''

if (!cin.test(cinValue) || /U20231PN2026PTC000001/i.test(cinValue)) {
  errors.push('NEXT_PUBLIC_VERDEBLISS_CIN must be a verified 21-character CIN')
}
if (!gstin.test(gstinValue) || /27ABCDE1234F1Z5/i.test(gstinValue)) {
  errors.push('NEXT_PUBLIC_VERDEBLISS_GSTIN must be a verified 15-character GSTIN')
}
if (!isRealPhone(phoneDisplay)) {
  errors.push('NEXT_PUBLIC_VERDEBLISS_SUPPORT_PHONE_DISPLAY must be a real business phone value')
}
if (!isRealPhone(phoneHref)) {
  errors.push(
    'NEXT_PUBLIC_VERDEBLISS_SUPPORT_PHONE_HREF must be a real business phone value, e.g. +912245678901 or tel:+912245678901'
  )
}
const displayLast10 = phoneLast10(phoneDisplay)
const hrefLast10 = phoneLast10(phoneHref)
if (displayLast10 && hrefLast10 && displayLast10 !== hrefLast10) {
  errors.push(
    `PHONE_DISPLAY (…${displayLast10}) and PHONE_HREF (…${hrefLast10}) resolve to different numbers — they must match`
  )
}

const grievanceName = process.env.NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_OFFICER_NAME?.trim() ?? ''
if (grievanceName && /^[\d\s+\-().]+$/.test(grievanceName)) {
  errors.push(
    "NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_OFFICER_NAME must be a person's name, not a phone number"
  )
}
if (knownFakeGrievanceOfficerName.test(grievanceName)) {
  errors.push('NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_OFFICER_NAME contains a fake value')
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

// Non-blocking identity warnings — mirrors gstinIdentityProblems() in
// constants/businessCompliance.ts. Printed on every production build so a
// sample-data GSTIN is visible in the deploy log without failing the deploy.
const legalName = process.env.NEXT_PUBLIC_VERDEBLISS_LEGAL_NAME?.trim() ?? ''
for (const warning of gstinIdentityProblems(gstinValue, legalName)) {
  console.warn(`::warning::Compliance: ${warning}`)
}

if (errors.length) {
  console.error(
    `Production compliance validation failed${
      strictReasons.length ? ` (${strictReasons.join(', ')})` : ''
    }:`
  )
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

function gstinIdentityProblems(value, name) {
  const gst = value.toUpperCase()
  if (!gstin.test(gst)) return []
  const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let sum = 0
  for (let i = 0; i < 14; i += 1) {
    const product = charset.indexOf(gst[i]) * (i % 2 === 0 ? 1 : 2)
    sum += Math.floor(product / 36) + (product % 36)
  }
  const problems = []
  if (charset[(36 - (sum % 36)) % 36] !== gst[14]) {
    problems.push('GSTIN check digit is invalid — verify the number on the GST portal')
  }
  const expected = /\bLLP\b|limited liability partnership/i.test(name)
    ? 'E'
    : /\b(private limited|pvt\.? ltd\.?|limited|ltd\.?)\b/i.test(name)
      ? 'C'
      : null
  if (expected && gst[5] !== expected) {
    problems.push(
      `GSTIN PAN entity type "${gst[5]}" does not match the legal name (expected "${expected}")`
    )
  }
  return problems
}

function extractLast10Digits(digits) {
  return digits.length > 10 ? digits.slice(-10) : digits
}

function isRealPhone(value) {
  const digits = value.replace(/\D/g, '')
  if (!digits) return false
  if (/^(\d)\1{7,}$/.test(digits)) return false
  const last10 = extractLast10Digits(digits)
  const FAKE_LAST10 = ['1234567890', '0123456789', '9876543210']
  if (FAKE_LAST10.includes(last10)) return false
  if (['919876543210', '09876543210'].includes(digits)) return false
  if (digits.includes('40002026') || digits.includes('67890123')) return false
  return /^\+?[0-9][0-9\s-]{7,18}$/.test(value)
}

function phoneLast10(value) {
  const normalized = normalizePhoneHref(value)
  const digits = normalized.replace(/\D/g, '')
  return extractLast10Digits(digits)
}

function normalizePhoneHref(value) {
  const stripped = value.replace(/^tel:/i, '')
  const prefix = stripped.trim().startsWith('+') ? '+' : ''
  const digits = stripped.replace(/\D/g, '')
  return digits ? `${prefix}${digits}` : ''
}
