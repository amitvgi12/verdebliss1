/**
 * products.test.js
 * Tests the static product catalogue, image mapping, and
 * category/skin-type constants.
 */
import { describe, it, expect } from 'vitest'
import {
  PRODUCTS, CATEGORIES, SKIN_TYPES, SORT_OPTIONS, TIERS,
} from '@/constants/products'

describe('PRODUCTS catalogue', () => {
  it('has 8 products', () => {
    expect(PRODUCTS).toHaveLength(8)
  })

  it('every product has required fields', () => {
    PRODUCTS.forEach((p) => {
      expect(p.id,          `${p.name} missing id`).toBeTruthy()
      expect(p.name,        `${p.name} missing name`).toBeTruthy()
      expect(p.price,       `${p.name} missing price`).toBeGreaterThan(0)
      expect(p.category,    `${p.name} missing category`).toBeTruthy()
      expect(p.ingredient,  `${p.name} missing ingredient`).toBeTruthy()
      expect(p.skin_types,  `${p.name} missing skin_types`).toBeInstanceOf(Array)
      expect(p.badges,      `${p.name} missing badges`).toBeInstanceOf(Array)
      expect(p.description, `${p.name} missing description`).toBeTruthy()
    })
  })

  it('rating is between 0 and 5 for all products', () => {
    PRODUCTS.forEach((p) => {
      expect(p.rating).toBeGreaterThanOrEqual(0)
      expect(p.rating).toBeLessThanOrEqual(5)
    })
  })

  it('review_count is a non-negative integer', () => {
    PRODUCTS.forEach((p) => {
      expect(p.review_count).toBeGreaterThanOrEqual(0)
      expect(Number.isInteger(p.review_count)).toBe(true)
    })
  })

  it('all product IDs are unique strings', () => {
    const ids = PRODUCTS.map((p) => p.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('price is a positive number for all products', () => {
    PRODUCTS.forEach((p) => {
      expect(typeof p.price).toBe('number')
      expect(p.price).toBeGreaterThan(0)
    })
  })

  it('Niacinamide Pore Serum is in the Serum category', () => {
    const product = PRODUCTS.find((p) => p.name.includes('Niacinamide'))
    expect(product).toBeDefined()
    expect(product.category).toBe('Serum')
  })

  it('Botanical SPF 50 Shield has the highest review count', () => {
    const maxReviews = Math.max(...PRODUCTS.map((p) => p.review_count))
    const topProduct = PRODUCTS.find((p) => p.review_count === maxReviews)
    expect(topProduct.name).toContain('SPF')
  })
})

describe('CATEGORIES', () => {
  it('includes "All" as the first item', () => {
    expect(CATEGORIES[0]).toBe('All')
  })

  it('includes all expected categories', () => {
    const expected = ['Serum', 'Moisturiser', 'Toner', 'Cleanser', 'SPF', 'Lip Care']
    expected.forEach((c) => expect(CATEGORIES).toContain(c))
  })
})

describe('SKIN_TYPES', () => {
  it('includes "All" as the first item', () => {
    expect(SKIN_TYPES[0]).toBe('All')
  })

  it('contains the four standard skin types', () => {
    expect(SKIN_TYPES).toContain('Dry')
    expect(SKIN_TYPES).toContain('Oily')
    expect(SKIN_TYPES).toContain('Combination')
    expect(SKIN_TYPES).toContain('Sensitive')
  })
})

describe('SORT_OPTIONS', () => {
  it('has at least 3 sort options', () => {
    expect(SORT_OPTIONS.length).toBeGreaterThanOrEqual(3)
  })

  it('includes Bestselling option', () => {
    expect(SORT_OPTIONS).toContain('Bestselling')
  })
})

describe('TIERS', () => {
  it('has 3 loyalty tiers', () => {
    expect(TIERS).toHaveLength(3)
  })

  it('tiers are ordered by ascending min points', () => {
    for (let i = 1; i < TIERS.length; i++) {
      expect(TIERS[i].min).toBeGreaterThan(TIERS[i - 1].min)
    }
  })

  it('the top tier has max: Infinity', () => {
    const top = TIERS[TIERS.length - 1]
    expect(top.max).toBe(Infinity)
  })

  it('each tier has name, color, and emoji', () => {
    TIERS.forEach((t) => {
      expect(t.name).toBeTruthy()
      expect(t.color).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(t.emoji).toBeTruthy()
    })
  })
})
