/**
 * Pre-launch commerce disclosure data.
 *
 * Replace every DEMO value before accepting real consumer orders. Keep this as
 * the single source of truth for footer disclosures and Organization JSON-LD so
 * launch-time legal details cannot drift between surfaces.
 */
export const BUSINESS_COMPLIANCE = {
  legalName: 'VerdeBliss Cosmetics Private Limited',
  cin: 'U20231PN2026PTC000001-DEMO',
  gstin: '27ABCDE1234F1Z5-DEMO',
  registeredOffice: {
    streetAddress: 'Demo House, Survey No. 101, Kharadi',
    addressLocality: 'Pune',
    addressRegion: 'Maharashtra',
    postalCode: '411014',
    addressCountry: 'IN',
  },
  principalPlaceOfBusiness: 'Same as registered office',
  helpline: {
    display: '+91 20 4000 2026',
    href: '+912040002026',
    hours: '10:00-18:00 IST, Mon-Sat',
  },
  supportEmail: 'hello@verdebliss.com',
  grievanceOfficer: {
    name: 'Kavya Menon (Demo)',
    designation: 'Grievance Officer',
    email: 'grievance@verdebliss.com',
    acknowledgementWindow: '48 hours',
    resolutionWindow: '30 days',
  },
} as const

export function formatPostalAddress(address = BUSINESS_COMPLIANCE.registeredOffice) {
  return [
    address.streetAddress,
    address.addressLocality,
    address.addressRegion,
    address.postalCode,
    'India',
  ].join(', ')
}
