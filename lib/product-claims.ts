import type { Product } from '@/types'

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
