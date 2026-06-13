import type { Product } from '@/types'

// ---------------------------------------------------------------------------
// Forbidden cosmetic claim patterns
// India CDSCO / Consumer Protection rules prohibit claims that imply drug
// action, guarantee safety during pregnancy, or cite unsubstantiated
// environmental certifications.
// ---------------------------------------------------------------------------

export interface ForbiddenClaimViolation {
  label: string
  suggestion: string
}

const FORBIDDEN_CLAIM_PATTERNS: Array<{
  pattern: RegExp
  label: string
  suggestion: string
}> = [
  {
    pattern: /pregnancy[- ]safe/i,
    label: '"pregnancy-safe" therapeutic safety claim',
    suggestion: 'Consult your physician if pregnant, breastfeeding, or under medical care',
  },
  {
    pattern: /suitable\s+for\s+use\s+during\s+pregnancy/i,
    label: '"suitable for use during pregnancy" safety claim',
    suggestion: 'Consult your physician if pregnant, breastfeeding, or under medical care',
  },
  {
    pattern: /\banti[- ]inflammatory\b/i,
    label: '"anti-inflammatory" drug action claim in product description',
    suggestion: 'Helps comfort the appearance of stressed skin',
  },
  {
    pattern: /without\s+absorbing\s+into\s+(?:the\s+)?bloodstream/i,
    label: '"without absorbing into bloodstream" bioavailability claim',
    suggestion:
      'Mineral sunscreen actives included; SPF rating documentation must accompany any sun-protection claim',
  },
  {
    pattern: /reflects?\s+UVA\s*(?:\+|and)\s*UVB/i,
    label: '"reflects UVA+UVB" unsubstantiated SPF mechanism claim',
    suggestion:
      'Mineral sunscreen actives included; SPF rating documentation must accompany any sun-protection claim',
  },
  {
    pattern: /\breef[- ]safe\b/i,
    label: '"reef-safe" unsubstantiated environmental claim',
    suggestion: 'Remove unless independently substantiated by third-party testing',
  },
  {
    pattern: /\btreats?\s+(?:acne|pimples?|inflammation|skin\s+condition)/i,
    label: '"treats acne/inflammation" drug action claim',
    suggestion: 'Supports clearer-looking skin / helps reduce the appearance of congestion',
  },
  {
    pattern: /\bcures?\s+(?:acne|pimples?|skin|eczema|psoriasis)/i,
    label: '"cures" drug claim',
    suggestion: 'Remove — drug action claim not permitted for cosmetics',
  },
  {
    pattern: /\bheals?\s+(?:acne|scars?|skin\s+damage|wounds?)/i,
    label: '"heals acne/scars/skin damage" drug action claim',
    suggestion: 'Helps improve the appearance of — drug action claim not permitted for cosmetics',
  },
]

/**
 * Audit a product description or any free-text field for forbidden cosmetic
 * claim patterns. Returns violations with suggested replacement copy.
 *
 * Call this server-side on DB-sourced descriptions to surface content that
 * needs DB correction. Does NOT modify the text — use the returned suggestions
 * to update the Supabase product rows.
 */
export function auditProductDescription(text: string | null | undefined): {
  ok: boolean
  violations: ForbiddenClaimViolation[]
} {
  if (!text) return { ok: true, violations: [] }
  const violations = FORBIDDEN_CLAIM_PATTERNS.filter(({ pattern }) => pattern.test(text)).map(
    ({ label, suggestion }) => ({ label, suggestion })
  )
  return { ok: violations.length === 0, violations }
}

/**
 * Exported for testing only — the raw patterns list.
 * @internal
 */
export { FORBIDDEN_CLAIM_PATTERNS }

// ---------------------------------------------------------------------------

// Single source of truth for product claim badges. Every claim is one entry
// carrying its stable `key`, the customer-facing `display` label, its
// `disclosure`, and the raw DB `aliases` that normalize into it. The lookup maps
// below are DERIVED from this list, so display copy lives in exactly one place
// and downstream matching keys on the stable `key` (see getProductBadgeKey) —
// never on display substrings, which a copy edit could silently break.
export type ProductBadgeKey = 'vegan' | 'organic' | 'no-animal-testing'

interface BadgeClaim {
  key: ProductBadgeKey
  display: string
  disclosure: string
  /** Raw DB vocabulary (lowercased) that normalizes into this claim. */
  aliases: string[]
}

const BADGE_CLAIMS: BadgeClaim[] = [
  {
    key: 'vegan',
    display: 'Vegan-friendly · evidence review',
    disclosure:
      'Vegan-friendly where formulation permits. Evidence status is published in the Trust Centre.',
    aliases: ['vegan', 'vegan-friendly'],
  },
  {
    key: 'organic',
    display: 'Organic botanicals · evidence review',
    disclosure: 'Organic botanical ingredient positioning. Evidence file is in review.',
    aliases: ['organic certified', 'certified organic', 'organic botanicals'],
  },
  {
    key: 'no-animal-testing',
    display: 'No animal testing · audit underway',
    disclosure:
      'No animal testing is conducted or commissioned. Third-party audit status is published in the Trust Centre.',
    aliases: ['cruelty-free', 'cruelty free', 'cruelty-free*'],
  },
]

// raw alias (lowercased) -> normalized display label
const BADGE_NORMALISATION: Record<string, string> = Object.fromEntries(
  BADGE_CLAIMS.flatMap((claim) => claim.aliases.map((alias) => [alias, claim.display]))
)

// normalized display label -> disclosure copy
const BADGE_DISCLOSURES: Record<string, string> = Object.fromEntries(
  BADGE_CLAIMS.map((claim) => [claim.display, claim.disclosure])
)

// any recognized form — raw alias OR normalized display label (lowercased) -> stable key
const BADGE_KEY_BY_LABEL: Record<string, ProductBadgeKey> = Object.fromEntries(
  BADGE_CLAIMS.flatMap((claim) => [
    ...claim.aliases.map((alias) => [alias, claim.key] as const),
    [claim.display.toLowerCase(), claim.key] as const,
  ])
)

export function normalizeProductBadgeLabel(label: string): string | null {
  const key = label.trim().toLowerCase()
  if (!key) return null
  return BADGE_NORMALISATION[key] ?? label.trim()
}

export function normalizeProductBadges(badges: string[] | null | undefined): string[] {
  const seen = new Set<string>()
  const normalized: string[] = []

  for (const badge of badges ?? []) {
    const label = normalizeProductBadgeLabel(badge)
    if (!label || seen.has(label)) continue
    seen.add(label)
    normalized.push(label)
  }

  return normalized
}

export function getProductBadgeDisclosure(label: string): string | undefined {
  return BADGE_DISCLOSURES[normalizeProductBadgeLabel(label) ?? label]
}

/**
 * Resolve any badge string — raw DB vocabulary ('Cruelty-free*') or a normalized
 * display label ('No animal testing · audit underway') — to its stable key, or
 * null if it is not a recognized claim. Match on this key, never on display copy,
 * so a label edit cannot silently break which products show which claim.
 */
export function getProductBadgeKey(label: string): ProductBadgeKey | null {
  return BADGE_KEY_BY_LABEL[label.trim().toLowerCase()] ?? null
}

/** The set of stable claim keys present on a product's badges. */
export function getProductBadgeKeys(badges: string[] | null | undefined): Set<ProductBadgeKey> {
  const keys = new Set<ProductBadgeKey>()
  for (const badge of badges ?? []) {
    const key = getProductBadgeKey(badge)
    if (key) keys.add(key)
  }
  return keys
}

export function normalizeProductClaims<T extends Product>(product: T): T {
  return {
    ...product,
    badges: normalizeProductBadges(product.badges),
  }
}

export function normalizeProductClaimList<T extends Product>(products: T[]): T[] {
  return products.map(normalizeProductClaims)
}
