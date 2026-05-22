import { describe, expect, it } from 'vitest'
import { normalizeProductBadgeLabel, normalizeProductBadges } from '@/lib/product-claims'

describe('product claim normalization', () => {
  it('converts hard certification labels into Trust Centre-safe positioning labels', () => {
    expect(normalizeProductBadgeLabel('Vegan')).toBe('Vegan-friendly')
    expect(normalizeProductBadgeLabel('Organic Certified')).toBe('Organic botanicals')
    expect(normalizeProductBadgeLabel('Cruelty-Free')).toBe('Cruelty-free*')
  })

  it('deduplicates equivalent badge labels from stale DB rows', () => {
    expect(
      normalizeProductBadges([
        'Vegan',
        'Vegan-Friendly',
        'Organic Certified',
        'Organic Botanicals',
        'Cruelty-Free',
      ])
    ).toEqual(['Vegan-friendly', 'Organic botanicals', 'Cruelty-free*'])
  })
})
