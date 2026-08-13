import { COD_MAX_TOTAL } from '@/constants/checkout'
import type { CartTotals, CheckoutAddress, NormalizedCartItem } from '@/lib/commerce'

export type CodRiskDecision = 'allow' | 'manual_review' | 'block'

export interface CodRiskAssessment {
  decision: CodRiskDecision
  allowed: boolean
  reason?: string
  flags: string[]
}

function csvEnv(name: string, fallback = ''): string[] {
  return (process.env[name] ?? fallback)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function hasLowEntropyPhone(phone: string): boolean {
  if (/^(\d)\1{9}$/.test(phone)) return true
  return ['1234567890', '0123456789', '9876543210'].includes(phone)
}

function usesReviewPincodePrefix(pincode: string): boolean {
  // Keep this conservative: these prefixes are not blocked, only routed to
  // manual verification because COD serviceability can vary by courier partner.
  const reviewPrefixes = csvEnv('COD_REVIEW_PIN_PREFIXES', '194,68255,744,795,796,797,798,799')
  return reviewPrefixes.some((prefix) => pincode.startsWith(prefix))
}

export function assessCodPincode(pincode: string): CodRiskDecision {
  const blockedPincodes = new Set(csvEnv('COD_BLOCKED_PINCODES'))
  if (blockedPincodes.has(pincode)) return 'block'
  if (usesReviewPincodePrefix(pincode)) return 'manual_review'
  return 'allow'
}

export interface CodVelocityCounts {
  recent_orders: number
  open_orders: number
  failed_orders: number
}

/**
 * History-aware half of the COD decision. `assessCodRisk` is pure and can only
 * judge a single order in isolation; RTO abuse looks normal one order at a
 * time and only becomes visible across a buyer's history.
 *
 * Thresholds are env-tunable so ops can tighten them without a deploy.
 */
export function assessCodVelocity(counts: CodVelocityCounts): CodRiskAssessment {
  const flags: string[] = []
  const maxOpen = numericEnv('COD_MAX_OPEN_ORDERS', 3)
  const maxRecent = numericEnv('COD_MAX_RECENT_ORDERS', 6)
  const maxFailed = numericEnv('COD_MAX_FAILED_ORDERS', 2)

  // A history of refused/returned deliveries is the strongest RTO signal there
  // is — block rather than merely review.
  if (counts.failed_orders >= maxFailed) {
    return {
      decision: 'block',
      allowed: false,
      reason:
        'Cash on Delivery is unavailable for this contact due to previous undelivered orders. Please use online payment.',
      flags: ['cod_prior_failed_deliveries'],
    }
  }

  if (counts.open_orders >= maxOpen) flags.push('cod_open_order_limit')
  if (counts.recent_orders >= maxRecent) flags.push('cod_high_recent_volume')

  return flags.length
    ? { decision: 'manual_review', allowed: true, flags }
    : { decision: 'allow', allowed: true, flags }
}

function numericEnv(name: string, fallback: number): number {
  const parsed = Number(process.env[name])
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

/** Merge the stateless and history-aware assessments, taking the strictest. */
export function mergeCodAssessments(
  base: CodRiskAssessment,
  velocity: CodRiskAssessment
): CodRiskAssessment {
  if (!base.allowed) return base
  if (!velocity.allowed) return velocity

  const flags = [...new Set([...base.flags, ...velocity.flags])]
  const decision: CodRiskDecision =
    base.decision === 'manual_review' || velocity.decision === 'manual_review'
      ? 'manual_review'
      : 'allow'

  return { decision, allowed: true, flags }
}

export function assessCodRisk(
  address: CheckoutAddress,
  totals: CartTotals,
  items: NormalizedCartItem[]
): CodRiskAssessment {
  const flags: string[] = []
  const blockedPincodes = new Set(csvEnv('COD_BLOCKED_PINCODES'))
  const blockedStates = new Set(csvEnv('COD_BLOCKED_STATES').map((state) => state.toLowerCase()))
  const line1Words = address.line1.split(/\s+/).filter(Boolean)
  const totalQuantity = items.reduce((sum, item) => sum + item.qty, 0)

  if (totals.total > COD_MAX_TOTAL) {
    return {
      decision: 'block',
      allowed: false,
      reason: `Cash on Delivery is available only up to ₹${COD_MAX_TOTAL}.`,
      flags: ['cod_total_above_limit'],
    }
  }

  if (blockedPincodes.has(address.pincode)) {
    return {
      decision: 'block',
      allowed: false,
      reason: 'Cash on Delivery is not currently available for this PIN code.',
      flags: ['blocked_pincode'],
    }
  }

  if (blockedStates.has(address.state.toLowerCase())) {
    return {
      decision: 'block',
      allowed: false,
      reason: 'Cash on Delivery is not currently available for this state.',
      flags: ['blocked_state'],
    }
  }

  if (hasLowEntropyPhone(address.phone)) {
    return {
      decision: 'block',
      allowed: false,
      reason: 'Please enter a valid phone number for Cash on Delivery verification.',
      flags: ['low_entropy_phone'],
    }
  }

  if (usesReviewPincodePrefix(address.pincode)) flags.push('cod_serviceability_review')
  if (line1Words.length < 3 || address.line1.length < 14) flags.push('short_address_line')
  if (totalQuantity >= 6) flags.push('high_cod_item_quantity')

  return flags.length
    ? { decision: 'manual_review', allowed: true, flags }
    : { decision: 'allow', allowed: true, flags }
}
