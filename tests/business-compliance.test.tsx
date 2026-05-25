import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Footer from '@/components/layout/Footer'
import { CONTACT_CHANNELS } from '@/app/contact/ContactClient'
import {
  BUSINESS_COMPLIANCE,
  formatPostalAddress,
  getBusinessIdentifiers,
  getStructuredPostalAddress,
  shouldEnforceProductionCompliance,
  validateBusinessCompliance,
  type BusinessCompliance,
} from '@/constants/businessCompliance'
import { organizationJsonLd } from '@/lib/site-schema'

const DEMO_MARKERS = /DEMO|Demo House|\(Demo\)|U20231PN2026PTC000001|27ABCDE1234F1Z5|example\.com/i

afterEach(() => {
  vi.resetModules()
  vi.unstubAllEnvs()
})

const VALID_COMPLIANCE: BusinessCompliance = {
  brandName: 'VerdeBliss',
  legalName: 'VerdeBliss Cosmetics Private Limited',
  cin: 'U24246MH2020PTC123456',
  gstin: '27AAACV1234F1Z5',
  registeredOffice: {
    streetAddress: '12 Botanical Park Road',
    addressLocality: 'Mumbai',
    addressRegion: 'Maharashtra',
    postalCode: '400001',
    addressCountry: 'IN',
  },
  principalPlaceOfBusiness: '12 Botanical Park Road, Mumbai, Maharashtra 400001',
  helpline: {
    display: '+91 22 4567 8901',
    href: '+912245678901',
    hours: '10:00-18:00 IST, Mon-Sat',
  },
  emails: {
    support: 'hello@verdebliss.com',
    privacy: 'privacy@verdebliss.com',
    returns: 'returns@verdebliss.com',
    reactions: 'reactions@verdebliss.com',
    press: 'press@verdebliss.com',
    orders: 'orders@verdebliss.com',
    grievance: 'grievance@verdebliss.com',
  },
  supportEmail: 'hello@verdebliss.com',
  grievanceOfficer: {
    name: 'Ananya Rao',
    designation: 'Grievance Officer',
    email: 'grievance@verdebliss.com',
    acknowledgementWindow: '48 hours',
    resolutionWindow: '30 days',
  },
}

describe('business compliance source of truth', () => {
  it('does not keep old demo legal values in the active compliance object', () => {
    expect(findDemoMarkerPaths(BUSINESS_COMPLIANCE)).toEqual([])
  })

  it('blocks fake compliance values in strict production validation', () => {
    const result = validateBusinessCompliance(
      {
        ...VALID_COMPLIANCE,
        cin: 'U20231PN2026PTC000001-DEMO',
        gstin: '27ABCDE1234F1Z5-DEMO',
        registeredOffice: {
          ...VALID_COMPLIANCE.registeredOffice,
          streetAddress: 'Demo House, Survey No. 101',
        },
        helpline: { ...VALID_COMPLIANCE.helpline, display: '+91 20 4000 2026' },
        grievanceOfficer: { ...VALID_COMPLIANCE.grievanceOfficer, name: 'Kavya Menon (Demo)' },
      },
      { strict: true, env: fullProductionEnv() }
    )

    expect(result.ok).toBe(false)
    expect(result.errors.join('\n')).toMatch(/placeholder|fake|phone|CIN|GSTIN/i)
  })

  it('accepts complete verified production compliance values', () => {
    expect(
      validateBusinessCompliance(VALID_COMPLIANCE, { strict: true, env: fullProductionEnv() })
    ).toMatchObject({ ok: true, errors: [] })
  })

  it('treats any production runtime as a strict compliance environment', () => {
    expect(shouldEnforceProductionCompliance({ NODE_ENV: 'production' })).toBe(true)
    expect(shouldEnforceProductionCompliance({ NODE_ENV: 'development' })).toBe(false)
  })

  it('normalizes tel: phone href values from environment configuration', async () => {
    vi.stubEnv('NEXT_PUBLIC_VERDEBLISS_SUPPORT_PHONE_HREF', 'tel:+91 22 4567 8901')

    const { BUSINESS_COMPLIANCE: configured } = await import('@/constants/businessCompliance')

    expect(configured.helpline.href).toBe('+912245678901')
  })

  it('omits unverified identifiers and addresses from Organization JSON-LD', () => {
    const unverified = {
      ...VALID_COMPLIANCE,
      cin: 'CIN pending verification',
      gstin: 'GSTIN pending verification',
      registeredOffice: {
        ...VALID_COMPLIANCE.registeredOffice,
        streetAddress: 'Registered office pending verification',
      },
    }
    expect(getBusinessIdentifiers(unverified)).toEqual([])
    expect(getStructuredPostalAddress(unverified)).toBeNull()
    expect(JSON.stringify(organizationJsonLd())).not.toMatch(DEMO_MARKERS)
    expect(JSON.stringify(organizationJsonLd())).not.toMatch(/pending verification/i)
  })

  it('renders footer support and legal values from the compliance constant', () => {
    const { container } = render(<Footer />)

    expect(
      screen.getAllByText(BUSINESS_COMPLIANCE.legalName, { exact: false }).length
    ).toBeGreaterThan(0)
    expect(screen.getByText(formatPostalAddress(), { exact: false })).toBeInTheDocument()
    expect(container.textContent).toContain(BUSINESS_COMPLIANCE.emails.support)
    expect(redactComplianceValues(container.textContent ?? '', BUSINESS_COMPLIANCE)).not.toMatch(
      DEMO_MARKERS
    )
  })

  it('contact channels use the same compliance source', () => {
    expect(CONTACT_CHANNELS.map((channel) => channel.value)).toEqual(
      expect.arrayContaining([
        BUSINESS_COMPLIANCE.emails.support,
        BUSINESS_COMPLIANCE.helpline.display,
        formatPostalAddress(),
      ])
    )
  })
})

function fullProductionEnv(): NodeJS.ProcessEnv {
  return {
    NODE_ENV: 'production',
    NEXT_PUBLIC_VERDEBLISS_LEGAL_NAME: VALID_COMPLIANCE.legalName,
    NEXT_PUBLIC_VERDEBLISS_CIN: VALID_COMPLIANCE.cin,
    NEXT_PUBLIC_VERDEBLISS_GSTIN: VALID_COMPLIANCE.gstin,
    NEXT_PUBLIC_VERDEBLISS_REGISTERED_OFFICE_LINE1: VALID_COMPLIANCE.registeredOffice.streetAddress,
    NEXT_PUBLIC_VERDEBLISS_REGISTERED_OFFICE_CITY:
      VALID_COMPLIANCE.registeredOffice.addressLocality,
    NEXT_PUBLIC_VERDEBLISS_REGISTERED_OFFICE_STATE: VALID_COMPLIANCE.registeredOffice.addressRegion,
    NEXT_PUBLIC_VERDEBLISS_REGISTERED_OFFICE_PINCODE: VALID_COMPLIANCE.registeredOffice.postalCode,
    NEXT_PUBLIC_VERDEBLISS_SUPPORT_PHONE_DISPLAY: VALID_COMPLIANCE.helpline.display,
    NEXT_PUBLIC_VERDEBLISS_SUPPORT_PHONE_HREF: VALID_COMPLIANCE.helpline.href,
    NEXT_PUBLIC_VERDEBLISS_SUPPORT_EMAIL: VALID_COMPLIANCE.emails.support,
    NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_OFFICER_NAME: VALID_COMPLIANCE.grievanceOfficer.name,
    NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_EMAIL: VALID_COMPLIANCE.grievanceOfficer.email,
  }
}

function findDemoMarkerPaths(value: unknown, prefix = 'BUSINESS_COMPLIANCE'): string[] {
  const paths: string[] = []

  function visit(current: unknown, path: string) {
    if (typeof current === 'string') {
      if (DEMO_MARKERS.test(current)) paths.push(path)
      return
    }
    if (!current || typeof current !== 'object') return

    for (const [key, nested] of Object.entries(current)) {
      visit(nested, `${path}.${key}`)
    }
  }

  visit(value, prefix)
  return paths
}

function redactComplianceValues(text: string, compliance: BusinessCompliance): string {
  let redacted = text
  for (const value of flattenComplianceStrings(compliance)) {
    if (!value) continue
    redacted = redacted.split(value).join('[compliance-value]')
  }
  return redacted
}

function flattenComplianceStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (!value || typeof value !== 'object') return []
  return Object.values(value).flatMap(flattenComplianceStrings)
}
