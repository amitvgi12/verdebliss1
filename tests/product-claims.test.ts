import { describe, expect, it } from 'vitest'
import { normalizeProductBadgeLabel, normalizeProductBadges } from '@/lib/product-claims'

describe('product claim normalization', () => {
  it('converts hard certification labels into Trust Centre-safe positioning labels', () => {
    expect(normalizeProductBadgeLabel('Vegan')).toBe('Vegan-friendly · pending cert')
    expect(normalizeProductBadgeLabel('Organic Certified')).toBe(
      'Organic botanicals · pending cert'
    )
    expect(normalizeProductBadgeLabel('Cruelty-Free')).toBe('No animal testing · pending cert')
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
    ).toEqual([
      'Vegan-friendly · pending cert',
      'Organic botanicals · pending cert',
      'No animal testing · pending cert',
    ])
  })
})
