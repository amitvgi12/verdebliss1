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

/**
 * A product may render as a buyable PDP / emit an InStock offer only when it has
 * a real price. With a live catalogue (`hasCatalogue` true — Supabase configured)
 * a priceless product is treated as not-found, so a stale ISR prerender or a
 * price-0 static shell can never render "Price temporarily unavailable" next to a
 * working Add to Cart. Without a catalogue (local dev) static shells pass through
 * so the page stays inspectable.
 */
export function isPublishedProduct(
  product: Product | null,
  hasCatalogue: boolean
): product is Product {
  if (!product) return false
  return !hasCatalogue || hasProductPrice(product)
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
