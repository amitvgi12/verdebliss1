import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  formatPriceValidUntil,
  getVerifiablePriceOffer,
  hasProductPrice,
  isProductionRuntime,
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

describe('isPublishedProduct (production fail-closed guard)', () => {
  const zero = { ...baseProduct, price: 0 }

  it('rejects a missing product in every context', () => {
    expect(isPublishedProduct(null, { hasCatalogue: true, isProduction: true })).toBe(false)
    expect(isPublishedProduct(null, { hasCatalogue: false, isProduction: false })).toBe(false)
  })

  it('requires a real price in production regardless of catalogue/env (no fail-open)', () => {
    expect(isPublishedProduct(zero, { hasCatalogue: true, isProduction: true })).toBe(false)
    // The key case: even with no catalogue (missing SUPABASE_SERVICE_ROLE_KEY),
    // production must NOT pass a price-0 shell.
    expect(isPublishedProduct(zero, { hasCatalogue: false, isProduction: true })).toBe(false)
    expect(isPublishedProduct(baseProduct, { hasCatalogue: false, isProduction: true })).toBe(true)
  })

  it('requires a price in non-production when a live catalogue is configured', () => {
    expect(isPublishedProduct(zero, { hasCatalogue: true, isProduction: false })).toBe(false)
    expect(isPublishedProduct(baseProduct, { hasCatalogue: true, isProduction: false })).toBe(true)
  })

  it('allows price-0 static shells only in local dev (no catalogue, not production)', () => {
    expect(isPublishedProduct(zero, { hasCatalogue: false, isProduction: false })).toBe(true)
  })
})

describe('isProductionRuntime', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('is true when NODE_ENV or VERCEL_ENV is production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    expect(isProductionRuntime()).toBe(true)
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(isProductionRuntime()).toBe(true)
  })

  it('is false in local dev (no production signal)', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('VERCEL_ENV', 'preview')
    expect(isProductionRuntime()).toBe(false)
  })
})
