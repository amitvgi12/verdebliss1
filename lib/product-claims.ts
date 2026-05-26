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

const BADGE_NORMALISATION: Record<string, string> = {
  vegan: 'Vegan-friendly · pending cert',
  'vegan-friendly': 'Vegan-friendly · pending cert',
  'organic certified': 'Organic botanicals · pending cert',
  'certified organic': 'Organic botanicals · pending cert',
  'organic botanicals': 'Organic botanicals · pending cert',
  'cruelty-free': 'No animal testing · pending cert',
  'cruelty free': 'No animal testing · pending cert',
  'cruelty-free*': 'No animal testing · pending cert',
}

const BADGE_DISCLOSURES: Record<string, string> = {
  'Vegan-friendly · pending cert':
    'Vegan-friendly where formulation permits. Formal certification status is published in the Trust Centre.',
  'Organic botanicals · pending cert':
    'Organic botanical ingredient positioning. Third-party certification is in progress.',
  'No animal testing · pending cert':
    'No animal testing is conducted or commissioned. Formal cruelty-free certification is in progress.',
}

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

export function normalizeProductClaims<T extends Product>(product: T): T {
  return {
    ...product,
    badges: normalizeProductBadges(product.badges),
  }
}

export function normalizeProductClaimList<T extends Product>(products: T[]): T[] {
  return products.map(normalizeProductClaims)
}
