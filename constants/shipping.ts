/**
 * Shipping constants — single source of truth.
 * Used by checkout, schema markup, and the chat policy block.
 */
export const FREE_SHIPPING_THRESHOLD = 499
export const STANDARD_SHIPPING_COST = 79
export const DELIVERY_DAYS = '2–3 business days'

export function getShippingCost(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_COST
}
