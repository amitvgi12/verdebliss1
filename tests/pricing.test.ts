import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  formatPriceValidUntil,
  getVerifiablePriceOffer,
  hasProductPrice,
  isPublishedProduct,
} from '@/lib/pricing'
import type { Product } from '@/types'

const baseProduct: Product = {
  id: '3',
  name: 'Green Tea Clarity Toner',
  price: 795,
}

afterEach(() => {
  vi.useRealTimers()
})

describe('verifiable price offers', () => {
  it('treats zero or invalid prices as unavailable', () => {
    expect(hasProductPrice({ ...baseProduct, price: 0 })).toBe(false)
    expect(getVerifiablePriceOffer({ ...baseProduct, price: 0, mrp: 994 })).toEqual({
      price: 0,
      mrp: null,
      discountPercent: null,
      priceValidUntil: null,
    })
  })

  it('does not expose an MRP discount without a valid-until date', () => {
    expect(getVerifiablePriceOffer({ ...baseProduct, mrp: 994 })).toMatchObject({
      price: 795,
      mrp: null,
      discountPercent: null,
      priceValidUntil: null,
    })
  })

  it('does not expose an expired MRP discount', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-21T00:00:00.000Z'))

    expect(
      getVerifiablePriceOffer({
        ...baseProduct,
        mrp: 994,
        price_valid_until: '2026-05-01T00:00:00.000Z',
      })
    ).toMatchObject({
      mrp: null,
      discountPercent: null,
      priceValidUntil: null,
    })
  })

  it('exposes a discount only when MRP and valid-until are both present', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-21T00:00:00.000Z'))

    expect(
      getVerifiablePriceOffer({
        ...baseProduct,
        mrp: 994,
        price_valid_until: '2026-06-30T23:59:59.000Z',
      })
    ).toEqual({
      price: 795,
      mrp: 994,
      discountPercent: 20,
      priceValidUntil: '2026-06-30T23:59:59.000Z',
    })
  })

  it('formats offer expiry in India-friendly copy', () => {
    expect(formatPriceValidUntil('2026-06-30T23:59:59.000Z')).toBe('1 Jul 2026')
  })
})

describe('isPublishedProduct (PDP fail-closed guard)', () => {
  // Regression guard for the live PDP bug: a price-0 product (stale prerender or
  // static shell) must not render a buyable PDP / emit an InStock offer when a
  // live catalogue is present.
  it('rejects a missing product regardless of catalogue', () => {
    expect(isPublishedProduct(null, true)).toBe(false)
    expect(isPublishedProduct(null, false)).toBe(false)
  })

  it('rejects a priceless product when a live catalogue is present', () => {
    expect(isPublishedProduct({ ...baseProduct, price: 0 }, true)).toBe(false)
  })

  it('accepts a priced product when a live catalogue is present', () => {
    expect(isPublishedProduct(baseProduct, true)).toBe(true)
  })

  it('lets price-0 static shells through in dev (no live catalogue)', () => {
    expect(isPublishedProduct({ ...baseProduct, price: 0 }, false)).toBe(true)
  })
})
