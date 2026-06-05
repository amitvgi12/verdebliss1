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
  /** Dispatch/warehouse city — may differ from the registered office. */
  fulfilmentCity: string
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
  'NEXT_PUBLIC_VERDEBLISS_SUPPORT_EMAIL',
  'NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_OFFICER_NAME',
  'NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_EMAIL',
] as const

const LEGAL_DATA_VERIFIED_ENV_KEY = 'LEGAL_DATA_VERIFIED'
const PLACEHOLDER_PATTERN =
  /\b(DEMO|placeholder|example\.com|Demo House|Lorem|dummy|sample|fake|to be configured|configure me|pending verification|pending appointment|test value)\b/i
const DEFAULT_GRIEVANCE_OFFICER_NAME = 'Ananya Rao'
const KNOWN_FAKE_GRIEVANCE_OFFICER_NAMES = /^(Action Sharma|Demon Sharma)$/i
const KNOWN_FAKE_CIN = /U20231PN2026PTC000001/i
const KNOWN_FAKE_GSTIN = /27ABCDE1234F1Z5/i
const CIN_RE = /^[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/
const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SUPPORT_PHONE_RE = /^\+?[0-9][0-9\s-]{7,18}$/

function readSupportPhoneDisplay(): string {
  return (
    process.env.NEXT_PUBLIC_VERDEBLISS_SUPPORT_PHONE_DISPLAY?.trim() ||
    process.env.NEXT_PUBLIC_VERDEBLISS_SUPPORT_PHONE?.trim() ||
    'Support phone pending verification'
  )
}

function readSupportPhoneHref(display: string): string {
  const explicitHref = process.env.NEXT_PUBLIC_VERDEBLISS_SUPPORT_PHONE_HREF?.trim()
  if (explicitHref) return normalizePhoneHref(explicitHref)

  const legacyPhone = process.env.NEXT_PUBLIC_VERDEBLISS_SUPPORT_PHONE?.trim()
  return normalizePhoneHref(legacyPhone || display)
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

function isFakeGrievanceOfficerName(value: string): boolean {
  return isPlaceholderLike(value) || KNOWN_FAKE_GRIEVANCE_OFFICER_NAMES.test(value.trim())
}

function readGrievanceOfficerName(source: NodeJS.ProcessEnv = process.env): string {
  const configured = source.NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_OFFICER_NAME?.trim()
  if (configured && !isFakeGrievanceOfficerName(configured)) return configured
  return DEFAULT_GRIEVANCE_OFFICER_NAME
}

function extractLast10Digits(digits: string): string {
  return digits.length > 10 ? digits.slice(-10) : digits
}

function isPlaceholderPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  if (!digits) return true
  if (/^(\d)\1{7,}$/.test(digits)) return true
  // Normalize: strip leading country code (91 or 0) to get last 10 digits
  const last10 = extractLast10Digits(digits)
  const FAKE_LAST10 = ['1234567890', '0123456789', '9876543210']
  if (FAKE_LAST10.includes(last10)) return true
  // Also reject the full-length forms (with country code prefix) directly
  if (['919876543210', '09876543210'].includes(digits)) return true
  return digits.includes('40002026') || digits.includes('67890123')
}

function phoneLast10(value: string): string {
  const normalized = normalizePhoneHref(value)
  return extractLast10Digits(normalized.replace(/\D/g, ''))
}

export const BUSINESS_COMPLIANCE: BusinessCompliance = {
  brandName: 'VerdeBliss',
  legalName:
    process.env.NEXT_PUBLIC_VERDEBLISS_LEGAL_NAME?.trim() || 'VerdeBliss Cosmetics Private Limited',
  cin: process.env.NEXT_PUBLIC_VERDEBLISS_CIN?.trim() || 'CIN pending verification',
  gstin: process.env.NEXT_PUBLIC_VERDEBLISS_GSTIN?.trim() || 'GSTIN pending verification',
  registeredOffice: {
    streetAddress:
      process.env.NEXT_PUBLIC_VERDEBLISS_REGISTERED_OFFICE_LINE1?.trim() ||
      'Registered office pending verification',
    addressLocality: process.env.NEXT_PUBLIC_VERDEBLISS_REGISTERED_OFFICE_CITY?.trim() || '',
    addressRegion: process.env.NEXT_PUBLIC_VERDEBLISS_REGISTERED_OFFICE_STATE?.trim() || '',
    postalCode: process.env.NEXT_PUBLIC_VERDEBLISS_REGISTERED_OFFICE_PINCODE?.trim() || '',
    addressCountry: 'IN',
  },
  principalPlaceOfBusiness:
    process.env.NEXT_PUBLIC_VERDEBLISS_PRINCIPAL_PLACE_OF_BUSINESS?.trim() ||
    'Same as registered office',
  fulfilmentCity: process.env.NEXT_PUBLIC_VERDEBLISS_FULFILMENT_CITY?.trim() || 'Dehradun',
  helpline: {
    display: readSupportPhoneDisplay(),
    href: readSupportPhoneHref(readSupportPhoneDisplay()),
    hours: process.env.NEXT_PUBLIC_VERDEBLISS_SUPPORT_HOURS?.trim() || '10:00-18:00 IST, Mon-Sat',
  },
  emails: {
    support: process.env.NEXT_PUBLIC_VERDEBLISS_SUPPORT_EMAIL?.trim() || 'hello@verdebliss.com',
    privacy: process.env.NEXT_PUBLIC_VERDEBLISS_PRIVACY_EMAIL?.trim() || 'privacy@verdebliss.com',
    returns: process.env.NEXT_PUBLIC_VERDEBLISS_RETURNS_EMAIL?.trim() || 'returns@verdebliss.com',
    reactions:
      process.env.NEXT_PUBLIC_VERDEBLISS_REACTIONS_EMAIL?.trim() || 'reactions@verdebliss.com',
    press: process.env.NEXT_PUBLIC_VERDEBLISS_PRESS_EMAIL?.trim() || 'press@verdebliss.com',
    orders: process.env.NEXT_PUBLIC_VERDEBLISS_ORDERS_EMAIL?.trim() || 'orders@verdebliss.com',
    grievance:
      process.env.NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_EMAIL?.trim() || 'grievance@verdebliss.com',
  },
  supportEmail: process.env.NEXT_PUBLIC_VERDEBLISS_SUPPORT_EMAIL?.trim() || 'hello@verdebliss.com',
  grievanceOfficer: {
    name: readGrievanceOfficerName(),
    designation:
      process.env.NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_OFFICER_DESIGNATION?.trim() ||
      'Grievance Officer',
    email: process.env.NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_EMAIL?.trim() || 'grievance@verdebliss.com',
    acknowledgementWindow:
      process.env.NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_ACK_WINDOW?.trim() || '48 hours',
    resolutionWindow:
      process.env.NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_RESOLUTION_WINDOW?.trim() || '30 days',
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
    if (envSource[LEGAL_DATA_VERIFIED_ENV_KEY] !== 'true') {
      errors.push(
        `${LEGAL_DATA_VERIFIED_ENV_KEY}=true is required after documentary legal verification`
      )
    }
    const configuredGrievanceName =
      envSource.NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_OFFICER_NAME?.trim() ?? ''
    if (configuredGrievanceName && isFakeGrievanceOfficerName(configuredGrievanceName)) {
      errors.push('NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_OFFICER_NAME contains a fake value')
    }
    if (!hasVerifiedCin(compliance.cin)) errors.push('CIN must be a verified 21-character CIN')
    if (!hasVerifiedGstin(compliance.gstin))
      errors.push('GSTIN must be a verified 15-character GSTIN')
    if (!hasVerifiedPhone(compliance.helpline.display)) {
      errors.push(
        'NEXT_PUBLIC_VERDEBLISS_SUPPORT_PHONE_DISPLAY must be a real verified business phone number'
      )
    }
    if (!hasVerifiedPhone(compliance.helpline.href)) {
      errors.push(
        'NEXT_PUBLIC_VERDEBLISS_SUPPORT_PHONE_HREF must be a real verified business phone number'
      )
    }
    const displayLast10 = phoneLast10(compliance.helpline.display)
    const hrefLast10 = phoneLast10(compliance.helpline.href)
    if (displayLast10 && hrefLast10 && displayLast10 !== hrefLast10) {
      errors.push(
        `Support phone display (…${displayLast10}) and href (…${hrefLast10}) resolve to different numbers — they must match`
      )
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

  // P1-1: Grievance officer name must be a real person's name
  const goName = compliance.grievanceOfficer.name.trim()
  if (!goName) {
    errors.push('grievanceOfficer.name is required')
  } else if (/^[\d\s+\-().]+$/.test(goName)) {
    // Catches the live case: "+911352000000" or "911352000000" in the name field
    errors.push("grievanceOfficer.name must be a person's name, not a phone number or digits")
  } else if (isFakeGrievanceOfficerName(goName)) {
    errors.push('grievanceOfficer.name contains a placeholder or fake value')
  }

  // P1-2: Address data quality — warn (strict: error) when locality, region, and city are identical
  const { addressLocality, addressRegion } = compliance.registeredOffice
  const tokenCheck = [addressLocality, addressRegion]
    .filter(Boolean)
    .map((s) => s.trim().toLowerCase())
  if (tokenCheck.length >= 2 && new Set(tokenCheck).size === 1) {
    errors.push(
      `Registered office locality and region are identical ("${addressLocality}") — verify the address against official records`
    )
  }

  return { ok: errors.length === 0, errors }
}

/**
 * Server-facing formatting helpers for seller identity. They intentionally read
 * from the same BUSINESS_COMPLIANCE snapshot used by the footer and legal pages
 * so static/ISR routes cannot drift from each other within a deployment.
 */
export function getSellerDetailsServer(compliance = BUSINESS_COMPLIANCE): string {
  const identifiers = [
    hasVerifiedCin(compliance.cin) ? `CIN: ${compliance.cin}` : null,
    hasVerifiedGstin(compliance.gstin) ? `GSTIN: ${compliance.gstin}` : null,
  ].filter(Boolean)

  return [compliance.legalName, formatPostalAddress(compliance.registeredOffice), ...identifiers]
    .filter(Boolean)
    .join(', ')
}

export function getLegalNameServer(compliance = BUSINESS_COMPLIANCE): string {
  return compliance.legalName
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
