/**
 * Loyalty tier rules — single source of truth.
 *
 * Mirrored in supabase/schema.sql (`finalize_commerce_order` and
 * `apply_loyalty_points`). When you change tier thresholds here, also update
 * those Postgres functions. There's a regression test in tests/commerce.test.ts.
 */

export type TierName = 'Green Leaf' | 'Gold Botanist' | 'Platinum Alchemist'

export const TIER_THRESHOLDS = {
  GOLD: 500,
  PLATINUM: 1500,
} as const

export function tierForPoints(points: number): TierName {
  if (points >= TIER_THRESHOLDS.PLATINUM) return 'Platinum Alchemist'
  if (points >= TIER_THRESHOLDS.GOLD) return 'Gold Botanist'
  return 'Green Leaf'
}

export function pointsForSubtotal(subtotal: number): number {
  // 1 point per ₹10 of subtotal (rounded down). Shipping does not earn points.
  return Math.max(0, Math.floor(subtotal / 10))
}
