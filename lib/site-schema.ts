import {
  BUSINESS_COMPLIANCE,
  getBusinessIdentifiers,
  getStructuredPostalAddress,
  hasVerifiedPhone,
} from '@/constants/businessCompliance'

export function organizationJsonLd() {
  const address = getStructuredPostalAddress()
  const identifier = getBusinessIdentifiers()
  const customerService: Record<string, unknown> = {
    '@type': 'ContactPoint',
    email: BUSINESS_COMPLIANCE.emails.support,
    contactType: 'customer service',
    availableLanguage: ['en'],
    hoursAvailable: BUSINESS_COMPLIANCE.helpline.hours,
  }

  if (hasVerifiedPhone()) {
    customerService.telephone = BUSINESS_COMPLIANCE.helpline.display
  }

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BUSINESS_COMPLIANCE.brandName,
    legalName: BUSINESS_COMPLIANCE.legalName,
    url: 'https://www.verdebliss.com',
    logo: 'https://www.verdebliss.com/images/logo.webp',
    description: 'Botanical skincare brand from India.',
    contactPoint: [
      customerService,
      {
        '@type': 'ContactPoint',
        email: BUSINESS_COMPLIANCE.grievanceOfficer.email,
        contactType: 'grievance officer',
      },
    ],
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'IN',
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: 14,
      returnMethod: 'https://schema.org/ReturnByMail',
      returnFees: 'https://schema.org/FreeReturn',
    },
  }

  if (address) data.address = address
  if (identifier.length) data.identifier = identifier

  return data
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: BUSINESS_COMPLIANCE.brandName,
    url: 'https://www.verdebliss.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://www.verdebliss.com/products?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  }
}
