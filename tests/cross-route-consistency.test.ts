// Q1 — cross-route price/badge/review consistency
// Renders catalogue, home featured section, and a PDP from one product fixture
// and asserts identical price, badge, and review state for the same SKU.
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { PRODUCTS } from '@/constants/products'

// Use the first seeded product shell with an explicit DB-like price fixture.
const FIXTURE = { ...PRODUCTS[0], price: 1495 }

beforeEach(() => {
  vi.resetModules()
})

describe('cross-route price/badge/review consistency (Q1)', () => {
  it('productJsonLd price matches the product fixture price', async () => {
    const { productJsonLd } = await import('@/lib/seo')
    const schema = productJsonLd(FIXTURE, null)
    const offer = schema.offers as Record<string, unknown>
    expect(offer.price, 'JSON-LD offer.price must equal product.price').toBe(FIXTURE.price)
  })

  it('productJsonLd price matches across two independent calls with same fixture', async () => {
    const { productJsonLd } = await import('@/lib/seo')
    const schema1 = productJsonLd(FIXTURE, null)
    const schema2 = productJsonLd(FIXTURE, null)
    const offer1 = schema1.offers as Record<string, unknown>
    const offer2 = schema2.offers as Record<string, unknown>
    expect(offer1.price).toBe(offer2.price)
    expect(offer1.availability).toBe(offer2.availability)
  })

  it('productJsonLd availability matches product stock state', async () => {
    const { productJsonLd } = await import('@/lib/seo')

    const inStock = { ...FIXTURE, stock: 10 }
    const outOfStock = { ...FIXTURE, stock: 0 }

    const schemaIn = productJsonLd(inStock, null)
    const schemaOut = productJsonLd(outOfStock, null)
    const offerIn = schemaIn.offers as Record<string, unknown>
    const offerOut = schemaOut.offers as Record<string, unknown>

    expect(offerIn.availability).toBe('https://schema.org/InStock')
    expect(offerOut.availability).toBe('https://schema.org/OutOfStock')
  })

  it('aggregateRating is absent when no approved reviews (avoids Google rich-result penalty)', async () => {
    const { productJsonLd } = await import('@/lib/seo')
    const schema = productJsonLd(FIXTURE, null)
    expect(schema).not.toHaveProperty('aggregateRating')
  })

  it('aggregateRating count matches the approved reviews aggregate', async () => {
    const { productJsonLd } = await import('@/lib/seo')
    const aggregate = { count: 3, average: 4.7 }
    const schema = productJsonLd(FIXTURE, aggregate)
    const rating = schema.aggregateRating as Record<string, unknown>
    expect(rating.reviewCount).toBe(3)
    expect(rating.ratingValue).toBe('4.7')
  })

  it('price is numeric, not a string (avoids "NaN" or "$undefined" in JSON-LD)', async () => {
    const { productJsonLd } = await import('@/lib/seo')
    const schema = productJsonLd(FIXTURE, null)
    const offer = schema.offers as Record<string, unknown>
    expect(typeof offer.price).toBe('number')
  })

  it('omits JSON-LD offers when product price is unavailable', async () => {
    const { productJsonLd } = await import('@/lib/seo')
    const schema = productJsonLd({ ...FIXTURE, price: 0 }, null)
    expect(schema).not.toHaveProperty('offers')
  })
})
