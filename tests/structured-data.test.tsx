import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { InlineStructuredData } from '@/lib/structured-data'
import { breadcrumbJsonLd, featuredItemListJsonLd, productJsonLd } from '@/lib/seo'
import { organizationJsonLd, websiteJsonLd } from '@/lib/site-schema'
import { PRODUCTS } from '@/constants/products'

/**
 * Audit F1 regression guard: structured data must be delivered as an INLINE
 * data block, never via `<script type="application/ld+json" src>` (whose src is
 * ignored, so crawlers never see the schema).
 */
describe('InlineStructuredData — crawler-parseable JSON-LD delivery (F1)', () => {
  it('emits an inline application/ld+json block with no external src', () => {
    const { container } = render(
      <InlineStructuredData
        data={{ '@context': 'https://schema.org', '@type': 'Thing', name: 'X' }}
      />
    )
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).not.toBeNull()
    expect(script?.getAttribute('src')).toBeNull()
    expect(JSON.parse(script!.textContent!)).toMatchObject({ '@type': 'Thing', name: 'X' })
  })

  it('serialises the homepage Organization + WebSite + featured ItemList payload', () => {
    const featured = PRODUCTS.slice(0, 4).map((p) => ({ ...p, price: 1495 }))
    const { container } = render(
      <InlineStructuredData
        data={[organizationJsonLd(), websiteJsonLd(), featuredItemListJsonLd(featured)]}
      />
    )
    const parsed = JSON.parse(
      container.querySelector('script[type="application/ld+json"]')!.textContent!
    )
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed[0]).toMatchObject({ '@type': 'Organization' })
    expect(parsed[1]).toMatchObject({ '@type': 'WebSite' })
    expect(parsed[2]).toMatchObject({ '@type': 'ItemList' })
    expect(parsed[2].itemListElement).toHaveLength(4)
    expect(parsed[2].itemListElement[0]).toMatchObject({
      '@type': 'ListItem',
      position: 1,
      url: expect.stringContaining('https://www.verdebliss.com/products/'),
    })
  })

  it('serialises the PDP Product + Breadcrumb payload with a valid offer price', () => {
    const priced = { ...PRODUCTS[0], price: 1495 }
    const { container } = render(
      <InlineStructuredData
        data={[
          productJsonLd(priced, null),
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Shop', path: '/products' },
            { name: priced.name, path: `/products/${priced.slug}` },
          ]),
        ]}
      />
    )
    const parsed = JSON.parse(
      container.querySelector('script[type="application/ld+json"]')!.textContent!
    )
    expect(parsed[0]).toMatchObject({
      '@type': 'Product',
      offers: expect.objectContaining({ price: 1495, priceCurrency: 'INR' }),
    })
    expect(parsed[1]).toMatchObject({ '@type': 'BreadcrumbList' })
  })
})
