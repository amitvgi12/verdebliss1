import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { PRODUCTS } from '@/constants/products'
import { getProductCompliance } from '@/constants/productCompliance'
import { productJsonLd } from '@/app/products/[id]/page'
import ProductAccordions from '@/app/products/[id]/_components/ProductAccordions'

describe('PDP compliance and schema', () => {
  it('does not emit fake aggregate ratings when no approved reviews exist', () => {
    const schema = productJsonLd(PRODUCTS[0], null)
    expect(schema).not.toHaveProperty('aggregateRating')
    expect(schema).toMatchObject({
      brand: { '@type': 'Brand', name: 'VerdeBliss' },
      sku: PRODUCTS[0].id,
      offers: expect.objectContaining({
        '@type': 'Offer',
        priceCurrency: 'INR',
        seller: expect.objectContaining({ name: 'VerdeBliss' }),
        hasMerchantReturnPolicy: expect.objectContaining({ merchantReturnDays: 14 }),
      }),
    })
  })

  it('includes approved review aggregate only when present', () => {
    const schema = productJsonLd(PRODUCTS[0], { count: 2, average: 4.5 })
    expect(schema.aggregateRating).toEqual({
      '@type': 'AggregateRating',
      ratingValue: '4.5',
      reviewCount: 2,
    })
  })

  it('renders how-to usage steps without duplicated visual numbering text', () => {
    const product = PRODUCTS[0]
    render(
      <ProductAccordions
        compliance={getProductCompliance(product)}
        openSection="how_to_use"
        onToggle={() => undefined}
      />
    )

    const usage = screen.getByRole('list')
    const items = within(usage).getAllByRole('listitem')
    expect(items).toHaveLength(4)
    expect(items.map((item) => item.textContent?.trim())).toEqual([
      'Cleanse and gently tone your face.',
      'Apply the amount recommended on the product packaging.',
      'Press gently into skin, avoiding the eye area.',
      'Follow with moisturiser and SPF in the morning.',
    ])
  })
})
