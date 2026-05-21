import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatPriceValidUntil, getVerifiablePriceOffer } from '@/lib/pricing'
import type { Product } from '@/types'

const baseProduct: Product = {
  id: '3',
  name: 'Green Tea Clarity Toner',
  price: 450,
}

afterEach(() => {
  vi.useRealTimers()
})

describe('verifiable price offers', () => {
  it('does not expose an MRP discount without a valid-until date', () => {
    expect(getVerifiablePriceOffer({ ...baseProduct, mrp: 563 })).toMatchObject({
      price: 450,
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
        mrp: 563,
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
        mrp: 563,
        price_valid_until: '2026-06-30T23:59:59.000Z',
      })
    ).toEqual({
      price: 450,
      mrp: 563,
      discountPercent: 20,
      priceValidUntil: '2026-06-30T23:59:59.000Z',
    })
  })

  it('formats offer expiry in India-friendly copy', () => {
    expect(formatPriceValidUntil('2026-06-30T23:59:59.000Z')).toBe('1 Jul 2026')
  })
})
