/**
 * Shipping constants — single source of truth.
 * Previously hardcoded as ₹499 in 3 separate files.
 * Audit fix 8.7: centralised here.
 */
export const FREE_SHIPPING_THRESHOLD = 499
export const STANDARD_SHIPPING_COST  = 79
export const DELIVERY_DAYS           = '2–3 business days'

export function getShippingCost(subtotal) {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_COST
}
