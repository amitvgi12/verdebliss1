import { describe, expect, it } from 'vitest'
import { validateBusinessCompliance } from '@/constants/businessCompliance'
import type { BusinessCompliance } from '@/constants/businessCompliance'

const BASE: BusinessCompliance = {
  brandName: 'VerdeBliss',
  legalName: 'VerdeBliss Cosmetics Private Limited',
  cin: 'U47722UT2026PTC021460',
  gstin: '05MODEE5678F1Z5',
  registeredOffice: {
    streetAddress: 'Nilaya Heights, 12 Rajpur Road',
    addressLocality: 'Dehradun',
    addressRegion: 'Uttarakhand',
    postalCode: '248001',
    addressCountry: 'IN',
  },
  principalPlaceOfBusiness: 'Same as registered office',
  fulfilmentCity: 'Dehradun',
  helpline: {
    display: '+91 135 2045 678',
    href: '+911352045678',
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
    name: 'Ananya Sharma',
    designation: 'Grievance Officer',
    email: 'grievance@verdebliss.com',
    acknowledgementWindow: '48 hours',
    resolutionWindow: '30 days',
  },
}

// fix(P0-2): phone placeholder normalization
describe('P0-2 — phone placeholder normalization', () => {
  it('rejects bare fake number 9876543210 in strict validation', () => {
    const c = { ...BASE, helpline: { ...BASE.helpline, display: '9876543210', href: '9876543210' } }
    const { ok, errors } = validateBusinessCompliance(c, {
      strict: true,
      env: { NODE_ENV: 'production' },
    })
    expect(ok).toBe(false)
    expect(errors.some((e) => /DISPLAY/.test(e))).toBe(true)
  })

  it('rejects +91-prefixed fake number +919876543210 in strict validation', () => {
    const c = {
      ...BASE,
      helpline: { ...BASE.helpline, display: '+91 98765 43210', href: '+919876543210' },
    }
    const { ok, errors } = validateBusinessCompliance(c, {
      strict: true,
      env: { NODE_ENV: 'production' },
    })
    expect(ok).toBe(false)
    expect(errors.some((e) => /HREF/.test(e) || /DISPLAY/.test(e))).toBe(true)
  })

  it('rejects display≠href mismatch even when both numbers individually look real', () => {
    const c = {
      ...BASE,
      helpline: {
        ...BASE.helpline,
        display: '+91 135 2045 678', // resolves to ...2045678
        href: '+911352046789', // resolves to ...2046789 — different
      },
    }
    const { ok, errors } = validateBusinessCompliance(c, {
      strict: true,
      env: { NODE_ENV: 'production' },
    })
    expect(ok).toBe(false)
    expect(errors.some((e) => /different numbers/.test(e))).toBe(true)
  })

  it('does not flag "different numbers" when display and href resolve to the same number', () => {
    // Use strict:false to avoid env-key errors that also contain "PHONE" in their text
    const { errors } = validateBusinessCompliance(BASE, { strict: false })
    expect(errors.some((e) => /different numbers/.test(e))).toBe(false)
  })
})

// fix(P1-1): grievance officer name validation
describe('P1-1 — grievance officer name validation', () => {
  it('rejects a name that is all digits (phone number in name field)', () => {
    // The live site had "+911352000000" in the name field — strip non-digits to detect
    const c = {
      ...BASE,
      grievanceOfficer: { ...BASE.grievanceOfficer, name: '911352000000' },
    }
    const { errors } = validateBusinessCompliance(c, { strict: false })
    expect(errors.some((e) => /grievanceOfficer\.name/.test(e))).toBe(true)
  })

  it('rejects a name containing a placeholder keyword', () => {
    const c = {
      ...BASE,
      grievanceOfficer: { ...BASE.grievanceOfficer, name: 'Kavya Menon (Demo)' },
    }
    const { errors } = validateBusinessCompliance(c, { strict: false })
    expect(errors.some((e) => /grievanceOfficer\.name/.test(e))).toBe(true)
  })

  it('rejects known fake live grievance officer names', () => {
    for (const name of ['Action Sharma', 'Demon Sharma']) {
      const c = {
        ...BASE,
        grievanceOfficer: { ...BASE.grievanceOfficer, name },
      }
      const { errors } = validateBusinessCompliance(c, { strict: false })
      expect(errors.some((e) => /grievanceOfficer\.name/.test(e))).toBe(true)
    }
  })

  it('rejects an empty grievance officer name in strict mode', () => {
    const c = {
      ...BASE,
      grievanceOfficer: { ...BASE.grievanceOfficer, name: '   ' },
    }
    const { errors } = validateBusinessCompliance(c, {
      strict: true,
      env: { NODE_ENV: 'production' },
    })
    expect(errors.some((e) => /grievanceOfficer\.name/.test(e))).toBe(true)
  })

  it('passes a real named grievance officer', () => {
    const { errors } = validateBusinessCompliance(BASE, { strict: false })
    const nameErrors = errors.filter((e) => /grievanceOfficer\.name/.test(e))
    expect(nameErrors).toHaveLength(0)
  })
})

// fix(P1-2): address data quality
describe('P1-2 — address data quality', () => {
  it('flags when locality and region are identical (Dehradun,Dehradun)', () => {
    const c = {
      ...BASE,
      registeredOffice: {
        ...BASE.registeredOffice,
        addressLocality: 'Dehradun',
        addressRegion: 'Dehradun',
      },
    }
    const { errors } = validateBusinessCompliance(c, { strict: false })
    expect(errors.some((e) => /locality and region are identical/i.test(e))).toBe(true)
  })

  it('passes when locality and region are different', () => {
    const { errors } = validateBusinessCompliance(BASE, { strict: false })
    const addrErrors = errors.filter((e) => /locality and region are identical/i.test(e))
    expect(addrErrors).toHaveLength(0)
  })
})
