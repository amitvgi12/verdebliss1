import { describe, it, expect } from 'vitest'
import { tierForPoints, pointsForSubtotal, TIER_THRESHOLDS } from '@/lib/loyalty'

describe('loyalty tier logic', () => {
  it('Green Leaf below GOLD threshold', () => {
    expect(tierForPoints(0)).toBe('Green Leaf')
    expect(tierForPoints(TIER_THRESHOLDS.GOLD - 1)).toBe('Green Leaf')
  })

  it('Gold Botanist at and above GOLD threshold', () => {
    expect(tierForPoints(TIER_THRESHOLDS.GOLD)).toBe('Gold Botanist')
    expect(tierForPoints(TIER_THRESHOLDS.PLATINUM - 1)).toBe('Gold Botanist')
  })

  it('Platinum Alchemist at and above PLATINUM threshold', () => {
    expect(tierForPoints(TIER_THRESHOLDS.PLATINUM)).toBe('Platinum Alchemist')
    expect(tierForPoints(99_999)).toBe('Platinum Alchemist')
  })

  it('points are 1 per ₹20, floored', () => {
    expect(pointsForSubtotal(0)).toBe(0)
    expect(pointsForSubtotal(19)).toBe(0)
    expect(pointsForSubtotal(20)).toBe(1)
    expect(pointsForSubtotal(99)).toBe(4)
    expect(pointsForSubtotal(1000)).toBe(50)
    // Negative subtotals should clamp to 0
    expect(pointsForSubtotal(-50)).toBe(0)
  })
})
