export interface ComplianceAddress {
  streetAddress: string
  addressLocality: string
  addressRegion: string
  postalCode: string
  addressCountry: 'IN'
}

export interface BusinessCompliance {
  brandName: string
  legalName: string
  cin: string
  gstin: string
  registeredOffice: ComplianceAddress
  principalPlaceOfBusiness: string
  helpline: {
    display: string
    href: string
    hours: string
  }
  emails: {
    support: string
    privacy: string
    returns: string
    reactions: string
    press: string
    orders: string
    grievance: string
  }
  supportEmail: string
  grievanceOfficer: {
    name: string
    designation: string
    email: string
    acknowledgementWindow: string
    resolutionWindow: string
  }
}

export interface BusinessComplianceValidationResult {
  ok: boolean
  errors: string[]
}

const REQUIRED_ENV_KEYS = [
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
] as const

const PLACEHOLDER_PATTERN =
  /\b(DEMO|placeholder|example\.com|Demo House|Lorem|dummy|sample|fake|to be configured|configure me|pending verification|pending appointment|test value)\b/i
const KNOWN_FAKE_CIN = /U20231PN2026PTC000001/i
const KNOWN_FAKE_GSTIN = /27ABCDE1234F1Z5/i
const CIN_RE = /^[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/
const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SUPPORT_PHONE_RE = /^\+?[0-9][0-9\s-]{7,18}$/

function env(key: string, fallback: string): string {
  return process.env[key]?.trim() || fallback
}

function normalizePhoneHref(value: string): string {
  const trimmed = value.trim().replace(/^tel:/i, '')
  const hasInternationalPrefix = trimmed.trim().startsWith('+')
  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return ''
  return `${hasInternationalPrefix ? '+' : ''}${digits}`
}

function isPlaceholderLike(value: string): boolean {
  return (
    PLACEHOLDER_PATTERN.test(value) || KNOWN_FAKE_CIN.test(value) || KNOWN_FAKE_GSTIN.test(value)
  )
}

function isPlaceholderPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  if (!digits) return true
  if (/^(\d)\1{7,}$/.test(digits)) return true
  if (['1234567890', '0123456789', '9876543210'].includes(digits)) return true
  return digits.includes('40002026') || digits.includes('67890123')
}

export const BUSINESS_COMPLIANCE: BusinessCompliance = {
  brandName: 'VerdeBliss',
  legalName: env('NEXT_PUBLIC_VERDEBLISS_LEGAL_NAME', 'VerdeBliss Cosmetics Private Limited'),
  cin: env('NEXT_PUBLIC_VERDEBLISS_CIN', 'CIN pending verification'),
  gstin: env('NEXT_PUBLIC_VERDEBLISS_GSTIN', 'GSTIN pending verification'),
  registeredOffice: {
    streetAddress: env(
      'NEXT_PUBLIC_VERDEBLISS_REGISTERED_OFFICE_LINE1',
      'Registered office pending verification'
    ),
    addressLocality: env('NEXT_PUBLIC_VERDEBLISS_REGISTERED_OFFICE_CITY', ''),
    addressRegion: env('NEXT_PUBLIC_VERDEBLISS_REGISTERED_OFFICE_STATE', ''),
    postalCode: env('NEXT_PUBLIC_VERDEBLISS_REGISTERED_OFFICE_PINCODE', ''),
    addressCountry: 'IN',
  },
  principalPlaceOfBusiness: env(
    'NEXT_PUBLIC_VERDEBLISS_PRINCIPAL_PLACE_OF_BUSINESS',
    'Same as registered office'
  ),
  helpline: {
    display: env(
      'NEXT_PUBLIC_VERDEBLISS_SUPPORT_PHONE_DISPLAY',
      'Support phone pending verification'
    ),
    href: normalizePhoneHref(env('NEXT_PUBLIC_VERDEBLISS_SUPPORT_PHONE_HREF', '')),
    hours: env('NEXT_PUBLIC_VERDEBLISS_SUPPORT_HOURS', '10:00-18:00 IST, Mon-Sat'),
  },
  emails: {
    support: env('NEXT_PUBLIC_VERDEBLISS_SUPPORT_EMAIL', 'hello@verdebliss.com'),
    privacy: env('NEXT_PUBLIC_VERDEBLISS_PRIVACY_EMAIL', 'privacy@verdebliss.com'),
    returns: env('NEXT_PUBLIC_VERDEBLISS_RETURNS_EMAIL', 'returns@verdebliss.com'),
    reactions: env('NEXT_PUBLIC_VERDEBLISS_REACTIONS_EMAIL', 'reactions@verdebliss.com'),
    press: env('NEXT_PUBLIC_VERDEBLISS_PRESS_EMAIL', 'press@verdebliss.com'),
    orders: env('NEXT_PUBLIC_VERDEBLISS_ORDERS_EMAIL', 'orders@verdebliss.com'),
    grievance: env('NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_EMAIL', 'grievance@verdebliss.com'),
  },
  supportEmail: env('NEXT_PUBLIC_VERDEBLISS_SUPPORT_EMAIL', 'hello@verdebliss.com'),
  grievanceOfficer: {
    name: env(
      'NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_OFFICER_NAME',
      'Grievance officer pending appointment'
    ),
    designation: env('NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_OFFICER_DESIGNATION', 'Grievance Officer'),
    email: env('NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_EMAIL', 'grievance@verdebliss.com'),
    acknowledgementWindow: env('NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_ACK_WINDOW', '48 hours'),
    resolutionWindow: env('NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_RESOLUTION_WINDOW', '30 days'),
  },
} as const

export function shouldEnforceProductionCompliance(
  source: NodeJS.ProcessEnv = process.env
): boolean {
  return (
    source.NODE_ENV === 'production' ||
    source.LAUNCH_MODE === 'true' ||
    source.VERDEBLISS_ENFORCE_COMPLIANCE === 'true' ||
    source.VERCEL_ENV === 'production'
  )
}

export function formatPostalAddress(address = BUSINESS_COMPLIANCE.registeredOffice) {
  const country = address.addressCountry === 'IN' ? 'India' : address.addressCountry
  return [
    address.streetAddress,
    address.addressLocality,
    address.addressRegion,
    address.postalCode,
    country,
  ]
    .filter(Boolean)
    .join(', ')
}

export function hasVerifiedCin(value = BUSINESS_COMPLIANCE.cin): boolean {
  return CIN_RE.test(value) && !isPlaceholderLike(value)
}

export function hasVerifiedGstin(value = BUSINESS_COMPLIANCE.gstin): boolean {
  return GSTIN_RE.test(value) && !isPlaceholderLike(value)
}

export function hasVerifiedPhone(value = BUSINESS_COMPLIANCE.helpline.display): boolean {
  return SUPPORT_PHONE_RE.test(value) && !isPlaceholderLike(value) && !isPlaceholderPhone(value)
}

export function isVerifiedComplianceValue(value: string): boolean {
  return Boolean(value.trim()) && !isPlaceholderLike(value)
}

export function getBusinessIdentifiers(compliance = BUSINESS_COMPLIANCE) {
  return [
    hasVerifiedCin(compliance.cin)
      ? { '@type': 'PropertyValue', name: 'CIN', value: compliance.cin }
      : null,
    hasVerifiedGstin(compliance.gstin)
      ? { '@type': 'PropertyValue', name: 'GSTIN', value: compliance.gstin }
      : null,
  ].filter(Boolean)
}

export function getStructuredPostalAddress(compliance = BUSINESS_COMPLIANCE) {
  const { registeredOffice } = compliance
  const required = [
    registeredOffice.streetAddress,
    registeredOffice.addressLocality,
    registeredOffice.addressRegion,
    registeredOffice.postalCode,
  ]
  if (!required.every(isVerifiedComplianceValue)) return null
  return {
    '@type': 'PostalAddress',
    ...registeredOffice,
  }
}

export function validateBusinessCompliance(
  compliance: BusinessCompliance,
  options: { strict?: boolean; env?: NodeJS.ProcessEnv } = {}
): BusinessComplianceValidationResult {
  const strict = options.strict ?? shouldEnforceProductionCompliance(options.env)
  const errors: string[] = []
  const values = flattenComplianceValues(compliance)

  for (const [path, value] of values) {
    if (!value.trim()) {
      if (strict) errors.push(`${path} is required`)
      continue
    }
    if (isPlaceholderLike(value)) errors.push(`${path} contains a placeholder or fake value`)
  }

  if (strict) {
    const envSource = options.env ?? process.env
    for (const key of REQUIRED_ENV_KEYS) {
      if (!envSource[key]) errors.push(`${key} is required`)
    }
    if (!hasVerifiedCin(compliance.cin)) errors.push('CIN must be a verified 21-character CIN')
    if (!hasVerifiedGstin(compliance.gstin))
      errors.push('GSTIN must be a verified 15-character GSTIN')
    if (
      !hasVerifiedPhone(compliance.helpline.display) ||
      isPlaceholderPhone(compliance.helpline.href)
    ) {
      errors.push('Support phone must be a real verified business phone number')
    }
  }

  for (const [path, email] of Object.entries(compliance.emails)) {
    if (!EMAIL_RE.test(email) || /\.(test|example)$/i.test(email)) {
      errors.push(`emails.${path} must be a real branded email address`)
    }
  }
  if (!EMAIL_RE.test(compliance.grievanceOfficer.email)) {
    errors.push('grievanceOfficer.email must be a valid email address')
  }

  return { ok: errors.length === 0, errors }
}

export function assertProductionBusinessCompliance(): void {
  if (!shouldEnforceProductionCompliance()) return

  const result = validateBusinessCompliance(BUSINESS_COMPLIANCE, { strict: true })
  if (result.ok) return

  throw new Error(
    [
      'Production compliance details are incomplete or contain placeholder values.',
      ...result.errors.map((error) => `- ${error}`),
    ].join('\n')
  )
}

function flattenComplianceValues(
  compliance: BusinessCompliance,
  prefix = 'BUSINESS_COMPLIANCE'
): Array<[string, string]> {
  const out: Array<[string, string]> = []

  function visit(value: unknown, path: string) {
    if (typeof value === 'string') {
      out.push([path, value])
      return
    }
    if (!value || typeof value !== 'object') return
    for (const [key, nested] of Object.entries(value)) {
      visit(nested, `${path}.${key}`)
    }
  }

  visit(compliance, prefix)
  return out
}
