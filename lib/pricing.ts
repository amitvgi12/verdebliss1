import type { Product } from '@/types'

export const PRICE_UNAVAILABLE_COPY = 'Price temporarily unavailable'

export interface VerifiablePriceOffer {
  price: number
  mrp: number | null
  discountPercent: number | null
  priceValidUntil: string | null
}

export function hasProductPrice(product?: Pick<Product, 'price'> | null): boolean {
  return normalizeMoney(product?.price) > 0
}

/** True for Vercel/Node production (and Vercel preview, which builds in prod mode). */
export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'
}

/**
 * A product may render as a buyable PDP / emit an InStock offer only when it has
 * a real price. Fail-closed model:
 *  - production: ALWAYS require a real price. No exception — a price-0 static
 *    shell (e.g. a key-less build/runtime missing SUPABASE_SERVICE_ROLE_KEY)
 *    must never render a buyable PDP. Callers `notFound()` instead.
 *  - non-production with a live catalogue (Supabase configured): require a price.
 *  - non-production without a catalogue (local dev): allow price-0 static shells
 *    so the page stays inspectable.
 */
export function isPublishedProduct(
  product: Product | null,
  context: { hasCatalogue: boolean; isProduction: boolean }
): product is Product {
  if (!product) return false
  if (context.isProduction) return hasProductPrice(product)
  if (context.hasCatalogue) return hasProductPrice(product)
  return true
}

export function getVerifiablePriceOffer(product: Product): VerifiablePriceOffer {
  const price = normalizeMoney(product.price)
  const mrp = normalizeOptionalMoney(product.mrp)
  const priceValidUntil = normalizeFutureIso(product.price_valid_until)

  if (price <= 0) {
    return {
      price,
      mrp: null,
      discountPercent: null,
      priceValidUntil: null,
    }
  }

  if (mrp === null || mrp <= price || priceValidUntil === null) {
    return {
      price,
      mrp: null,
      discountPercent: null,
      priceValidUntil: null,
    }
  }

  return {
    price,
    mrp,
    discountPercent: Math.round(((mrp - price) / mrp) * 100),
    priceValidUntil,
  }
}

export function formatPriceValidUntil(value: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(value))
}

function normalizeMoney(value: unknown): number {
  const amount = Number(value)
  return Number.isFinite(amount) && amount > 0 ? amount : 0
}

function normalizeOptionalMoney(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const amount = Number(value)
  return Number.isFinite(amount) && amount > 0 ? amount : null
}

function normalizeFutureIso(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') return null
  const time = Date.parse(value)
  if (!Number.isFinite(time) || time <= Date.now()) return null
  return new Date(time).toISOString()
}
