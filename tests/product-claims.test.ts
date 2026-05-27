import { describe, expect, it } from 'vitest'
import {
  auditProductDescription,
  normalizeProductBadgeLabel,
  normalizeProductBadges,
} from '@/lib/product-claims'

describe('auditProductDescription — forbidden cosmetic claim detector', () => {
  it('returns ok:true and no violations for clean copy', () => {
    const { ok, violations } = auditProductDescription(
      'A lightweight serum with Bakuchiol to help visibly smooth fine lines.'
    )
    expect(ok).toBe(true)
    expect(violations).toHaveLength(0)
  })

  it('returns ok:true for null and undefined input', () => {
    expect(auditProductDescription(null).ok).toBe(true)
    expect(auditProductDescription(undefined).ok).toBe(true)
  })

  it('flags "pregnancy-safe" (hyphenated)', () => {
    const { ok, violations } = auditProductDescription(
      'This formula is pregnancy-safe and gentle for daily use.'
    )
    expect(ok).toBe(false)
    expect(violations.some((v) => /pregnancy-safe/.test(v.label))).toBe(true)
  })

  it('flags "pregnancy safe" (space-separated)', () => {
    const { ok, violations } = auditProductDescription('Certified pregnancy safe formula.')
    expect(ok).toBe(false)
    expect(violations.some((v) => /pregnancy-safe/.test(v.label))).toBe(true)
  })

  it('flags "suitable for use during pregnancy"', () => {
    const { ok, violations } = auditProductDescription(
      'Suitable for use during pregnancy and breastfeeding.'
    )
    expect(ok).toBe(false)
    expect(violations.some((v) => /suitable for use during pregnancy/.test(v.label))).toBe(true)
  })

  it('flags "anti-inflammatory" drug action claim', () => {
    const { ok, violations } = auditProductDescription(
      'Our serum delivers powerful anti-inflammatory benefits.'
    )
    expect(ok).toBe(false)
    expect(violations.some((v) => /anti-inflammatory/.test(v.label))).toBe(true)
  })

  it('flags "anti inflammatory" (space-separated)', () => {
    const { ok, violations } = auditProductDescription('Known for anti inflammatory action.')
    expect(ok).toBe(false)
    expect(violations.some((v) => /anti-inflammatory/.test(v.label))).toBe(true)
  })

  it('flags "without absorbing into bloodstream"', () => {
    const { ok, violations } = auditProductDescription(
      'Reflects UV rays without absorbing into bloodstream.'
    )
    expect(ok).toBe(false)
    expect(violations.some((v) => /bloodstream/.test(v.label))).toBe(true)
  })

  it('flags "without absorbing into the bloodstream" (with article)', () => {
    const { ok, violations } = auditProductDescription(
      'Mineral filter works without absorbing into the bloodstream.'
    )
    expect(ok).toBe(false)
    expect(violations.some((v) => /bloodstream/.test(v.label))).toBe(true)
  })

  it('flags "reflects UVA + UVB"', () => {
    const { ok, violations } = auditProductDescription('Reflects UVA + UVB rays.')
    expect(ok).toBe(false)
    expect(violations.some((v) => /UVA\+UVB/.test(v.label))).toBe(true)
  })

  it('flags "reflects UVA and UVB"', () => {
    const { ok, violations } = auditProductDescription('Reflects UVA and UVB.')
    expect(ok).toBe(false)
    expect(violations.some((v) => /UVA\+UVB/.test(v.label))).toBe(true)
  })

  it('flags "reef-safe"', () => {
    const { ok, violations } = auditProductDescription('100% reef-safe mineral formula.')
    expect(ok).toBe(false)
    expect(violations.some((v) => /reef-safe/.test(v.label))).toBe(true)
  })

  it('flags "reef safe" (space-separated)', () => {
    const { ok, violations } = auditProductDescription('Reef safe and biodegradable.')
    expect(ok).toBe(false)
    expect(violations.some((v) => /reef-safe/.test(v.label))).toBe(true)
  })

  it('flags "treats acne"', () => {
    const { ok, violations } = auditProductDescription('Treats acne and reduces breakouts.')
    expect(ok).toBe(false)
    expect(violations.some((v) => /treats acne/.test(v.label))).toBe(true)
  })

  it('flags "treat inflammation"', () => {
    const { ok, violations } = auditProductDescription('Helps treat inflammation effectively.')
    expect(ok).toBe(false)
    expect(violations.some((v) => /treats acne/.test(v.label))).toBe(true)
  })

  it('flags "cures acne"', () => {
    const { ok, violations } = auditProductDescription('Cures acne within 7 days.')
    expect(ok).toBe(false)
    expect(violations.some((v) => /cures/.test(v.label))).toBe(true)
  })

  it('flags "heals scars"', () => {
    const { ok, violations } = auditProductDescription('Heals scars and improves skin texture.')
    expect(ok).toBe(false)
    expect(violations.some((v) => /heals/.test(v.label))).toBe(true)
  })

  it('does not flag advisory copy "consult your physician if pregnant"', () => {
    const { ok } = auditProductDescription(
      'Consult your physician if pregnant, breastfeeding, or under medical care.'
    )
    expect(ok).toBe(true)
  })

  it('does not flag "avoid during pregnancy" ingredient warning', () => {
    const { ok } = auditProductDescription(
      'Contains Salicylic Acid — avoid during pregnancy. Speak with your healthcare provider.'
    )
    expect(ok).toBe(true)
  })

  it('returns a non-empty suggestion for every violation', () => {
    const { violations } = auditProductDescription(
      'pregnancy-safe, anti-inflammatory, reef-safe, treats acne, reflects UVA + UVB'
    )
    for (const v of violations) {
      expect(v.suggestion.length).toBeGreaterThan(0)
    }
  })
})

describe('product claim normalization', () => {
  it('converts hard certification labels into Trust Centre-safe positioning labels', () => {
    expect(normalizeProductBadgeLabel('Vegan')).toBe('Vegan-friendly · evidence review')
    expect(normalizeProductBadgeLabel('Organic Certified')).toBe(
      'Organic botanicals · evidence review'
    )
    expect(normalizeProductBadgeLabel('Cruelty-Free')).toBe('No animal testing · audit underway')
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
      'Vegan-friendly · evidence review',
      'Organic botanicals · evidence review',
      'No animal testing · audit underway',
    ])
  })
})
