import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'

const CIN_RE = /\b[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}\b/g
const GSTIN_RE = /\b\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/g

const IDENTITY_ENV: NodeJS.ProcessEnv = {
  NODE_ENV: 'production',
  NEXT_PUBLIC_VERDEBLISS_LEGAL_NAME: 'VerdeBliss Cosmetics Private Limited',
  NEXT_PUBLIC_VERDEBLISS_CIN: 'U24246MH2020PTC123456',
  NEXT_PUBLIC_VERDEBLISS_GSTIN: '27AAACV1234F1Z5',
  NEXT_PUBLIC_VERDEBLISS_REGISTERED_OFFICE_LINE1: '12 Botanical Park Road',
  NEXT_PUBLIC_VERDEBLISS_REGISTERED_OFFICE_CITY: 'Mumbai',
  NEXT_PUBLIC_VERDEBLISS_REGISTERED_OFFICE_STATE: 'Maharashtra',
  NEXT_PUBLIC_VERDEBLISS_REGISTERED_OFFICE_PINCODE: '400001',
  NEXT_PUBLIC_VERDEBLISS_SUPPORT_PHONE_DISPLAY: '+91 22 4567 8901',
  NEXT_PUBLIC_VERDEBLISS_SUPPORT_PHONE_HREF: '+912245678901',
  NEXT_PUBLIC_VERDEBLISS_SUPPORT_EMAIL: 'hello@verdebliss.com',
  NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_OFFICER_NAME: 'Ananya Rao',
  NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_EMAIL: 'grievance@verdebliss.com',
}

interface IdentityFields {
  grievanceOfficerName: string
  cin: string
  gstin: string
}

describe('cross-page business identity consistency', () => {
  afterEach(() => {
    cleanup()
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it('keeps grievance officer, CIN, and GSTIN aligned across footer, legal, and PDP disclosures', async () => {
    vi.resetModules()
    for (const [key, value] of Object.entries(IDENTITY_ENV)) {
      vi.stubEnv(key, value)
    }

    const [
      { BUSINESS_COMPLIANCE, getSellerDetailsServer },
      { default: Footer },
      { LEGAL_DOCUMENTS },
      { PRODUCTS },
      { getProductCompliance },
      { default: ProductAccordions },
    ] = await Promise.all([
      import('@/constants/businessCompliance'),
      import('@/components/layout/Footer'),
      import('@/constants/legal'),
      import('@/constants/products'),
      import('@/constants/productCompliance'),
      import('@/app/products/[id]/_components/ProductAccordions'),
    ])

    const expected: IdentityFields = {
      grievanceOfficerName: BUSINESS_COMPLIANCE.grievanceOfficer.name,
      cin: BUSINESS_COMPLIANCE.cin,
      gstin: BUSINESS_COMPLIANCE.gstin,
    }

    const footer = render(<Footer />)
    const footerText = visibleText(footer.container)
    expectOnlyIdentity('/ footer', footerText, expected)
    cleanup()

    const privacyText = LEGAL_DOCUMENTS.privacy.sections.map((section) => section.body).join(' ')
    expectOnlyGrievanceOfficer('/privacy-policy legal copy', privacyText, expected)

    const product = PRODUCTS[0]
    const sellerDetails = getSellerDetailsServer()
    const compliance = {
      ...getProductCompliance(product),
      manufacturer: sellerDetails,
      packer: sellerDetails,
    }
    const productDisclosure = render(
      <ProductAccordions
        compliance={compliance}
        openSection="commerce-disclosures"
        onToggle={() => undefined}
      />
    )
    expectOnlyRegisteredIds(
      '/products/[id] seller disclosure',
      visibleText(productDisclosure.container),
      expected
    )
    cleanup()

    const pdp = render(
      <>
        <ProductAccordions
          compliance={compliance}
          openSection="commerce-disclosures"
          onToggle={() => undefined}
        />
        <Footer />
      </>
    )
    const pdpText = visibleText(pdp.container)
    expectOnlyIdentity(`/products/${product.slug ?? product.id}`, pdpText, expected)
  })
})

function visibleText(container: HTMLElement): string {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  const parts: string[] = []
  let node = walker.nextNode()

  while (node) {
    const value = node.textContent?.replace(/\s+/g, ' ').trim()
    if (value) parts.push(value)
    node = walker.nextNode()
  }

  return parts.join(' | ')
}

function expectOnlyIdentity(label: string, text: string, expected: IdentityFields) {
  expectOnlyGrievanceOfficer(label, text, expected)
  expectOnlyRegisteredIds(label, text, expected)
}

function expectOnlyGrievanceOfficer(label: string, text: string, expected: IdentityFields) {
  const names = new Set<string>()

  for (const match of text.matchAll(/Grievance Officer\s*\|?\s*([A-Z][A-Za-z]+ [A-Z][A-Za-z]+)/g)) {
    names.add(match[1])
  }
  for (const match of text.matchAll(/([A-Z][A-Za-z]+ [A-Z][A-Za-z]+),\s*Grievance Officer/g)) {
    names.add(match[1])
  }

  expect([...names], `${label} grievance officer`).toEqual([expected.grievanceOfficerName])
}

function expectOnlyRegisteredIds(label: string, text: string, expected: IdentityFields) {
  expect(uniqueMatches(text, CIN_RE), `${label} CIN`).toEqual([expected.cin])
  expect(uniqueMatches(text, GSTIN_RE), `${label} GSTIN`).toEqual([expected.gstin])
}

function uniqueMatches(text: string, pattern: RegExp): string[] {
  return Array.from(new Set(text.match(pattern) ?? []))
}
