// Q3 — build fails on placeholder/fake compliance values, not silently substitutes
// Exercises validateBusinessCompliance with known-bad inputs to ensure the
// validator catches CIN/GSTIN/grievance placeholders before a production build.
import { describe, expect, it } from 'vitest'
import { validateBusinessCompliance } from '@/constants/businessCompliance'
import type { BusinessCompliance } from '@/constants/businessCompliance'

// Minimal env that satisfies all REQUIRED_ENV_KEYS checks in strict mode.
// Values use real formats but are not real production credentials.
// Cast needed: validateBusinessCompliance accepts NodeJS.ProcessEnv but we only
// want to specify the keys it actually reads — the cast is safe here.
const MOCK_ENV = {
  NEXT_PUBLIC_VERDEBLISS_LEGAL_NAME: 'VerdeBliss Cosmetics Private Limited',
  NEXT_PUBLIC_VERDEBLISS_CIN: 'U20211PN2021PTC123456',
  NEXT_PUBLIC_VERDEBLISS_GSTIN: '27AABCU9603R1ZX',
  NEXT_PUBLIC_VERDEBLISS_REGISTERED_OFFICE_LINE1: '101 Green Park Road',
  NEXT_PUBLIC_VERDEBLISS_REGISTERED_OFFICE_CITY: 'Pune',
  NEXT_PUBLIC_VERDEBLISS_REGISTERED_OFFICE_STATE: 'Maharashtra',
  NEXT_PUBLIC_VERDEBLISS_REGISTERED_OFFICE_PINCODE: '411014',
  NEXT_PUBLIC_VERDEBLISS_SUPPORT_PHONE_DISPLAY: '+91 80123 45678',
  NEXT_PUBLIC_VERDEBLISS_SUPPORT_EMAIL: 'support@verdebliss.com',
  NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_OFFICER_NAME: 'Priya Sharma',
  NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_EMAIL: 'grievance@verdebliss.com',
} as unknown as NodeJS.ProcessEnv

const VALID_BASE: BusinessCompliance = {
  brandName: 'VerdeBliss',
  legalName: 'VerdeBliss Cosmetics Private Limited',
  cin: 'U20211PN2021PTC123456',
  gstin: '27AABCU9603R1ZX',
  registeredOffice: {
    streetAddress: '101 Green Park Road',
    addressLocality: 'Pune',
    addressRegion: 'Maharashtra',
    postalCode: '411014',
    addressCountry: 'IN',
  },
  helpline: {
    display: '+91 80123 45678',
    href: '+918012345678',
    hours: '10:00-18:00 IST, Mon-Sat',
  },
  emails: {
    support: 'support@verdebliss.com',
    privacy: 'privacy@verdebliss.com',
    returns: 'returns@verdebliss.com',
    reactions: 'reactions@verdebliss.com',
    press: 'press@verdebliss.com',
    orders: 'orders@verdebliss.com',
    grievance: 'grievance@verdebliss.com',
  },
  principalPlaceOfBusiness: '101 Green Park Road, Pune',
  fulfilmentCity: 'Pune',
  supportEmail: 'support@verdebliss.com',
  grievanceOfficer: {
    name: 'Priya Sharma',
    designation: 'Grievance Officer',
    email: 'grievance@verdebliss.com',
    acknowledgementWindow: '48 hours',
    resolutionWindow: '30 days',
  },
}

function withOverride(override: Partial<BusinessCompliance>): BusinessCompliance {
  return { ...VALID_BASE, ...override }
}

describe('compliance validator — placeholder rejection (Q3)', () => {
  it('accepts a fully valid compliance object', () => {
    const result = validateBusinessCompliance(VALID_BASE, { strict: true, env: MOCK_ENV })
    expect(result.ok, result.errors?.join(', ')).toBe(true)
  })

  it('rejects known fake CIN (U20231PN2026PTC000001)', () => {
    const result = validateBusinessCompliance(withOverride({ cin: 'U20231PN2026PTC000001' }), {
      strict: true,
      env: MOCK_ENV,
    })
    expect(result.ok).toBe(false)
    expect(result.errors.join(' ')).toMatch(/CIN/)
  })

  it('rejects known fake GSTIN (27ABCDE1234F1Z5)', () => {
    const result = validateBusinessCompliance(withOverride({ gstin: '27ABCDE1234F1Z5' }), {
      strict: true,
      env: MOCK_ENV,
    })
    expect(result.ok).toBe(false)
    expect(result.errors.join(' ')).toMatch(/GSTIN/)
  })

  it('rejects placeholder-word CIN ("CIN pending verification")', () => {
    const result = validateBusinessCompliance(withOverride({ cin: 'CIN pending verification' }), {
      strict: true,
      env: MOCK_ENV,
    })
    expect(result.ok).toBe(false)
  })

  it('rejects placeholder-word GSTIN ("GSTIN pending verification")', () => {
    const result = validateBusinessCompliance(
      withOverride({ gstin: 'GSTIN pending verification' }),
      { strict: true, env: MOCK_ENV }
    )
    expect(result.ok).toBe(false)
  })

  it('rejects known-blocked grievance officer name ("Action Sharma")', () => {
    const mockEnvWithFakeName = {
      ...MOCK_ENV,
      NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_OFFICER_NAME: 'Action Sharma',
    }
    const result = validateBusinessCompliance(
      withOverride({ grievanceOfficer: { ...VALID_BASE.grievanceOfficer, name: 'Action Sharma' } }),
      { strict: true, env: mockEnvWithFakeName }
    )
    expect(result.ok).toBe(false)
    expect(result.errors.join(' ')).toMatch(/grievance.*name|GRIEVANCE_OFFICER_NAME/i)
  })

  it('rejects example.com grievance email', () => {
    const result = validateBusinessCompliance(
      withOverride({
        grievanceOfficer: { ...VALID_BASE.grievanceOfficer, email: 'grievance@example.com' },
      }),
      { strict: false }
    )
    expect(result.ok).toBe(false)
    expect(result.errors.join(' ')).toMatch(/email/)
  })

  it('rejects a phone number used as grievance officer name', () => {
    const result = validateBusinessCompliance(
      withOverride({ grievanceOfficer: { ...VALID_BASE.grievanceOfficer, name: '+911352000000' } }),
      { strict: false }
    )
    expect(result.ok).toBe(false)
    expect(result.errors.join(' ')).toMatch(/name/)
  })
})
