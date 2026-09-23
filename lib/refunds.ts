export const REFUND_WINDOW_DAYS = 14
export const OPEN_REFUND_STATUSES = ['requested', 'reviewing', 'approved'] as const
export const REFUND_ELIGIBLE_PAYMENT_STATUSES = ['paid', 'cod_pending'] as const
export const REFUND_INELIGIBLE_ORDER_STATUSES = [
  'Cancelled',
  'Refunded',
  // Already in review through the cancellation flow.
  'Cancellation Requested',
] as const

const DAY_MS = 24 * 60 * 60 * 1000

export interface RefundOrderLike {
  status?: string | null
  payment_status?: string | null
  created_at?: string | null
  delivered_at?: string | null
}

/**
 * When the return window starts. The published policy (FAQ, /returns-refunds)
 * is "within 14 days of delivery", so the clock starts at delivery — counting
 * from the order date silently shortened every customer's window by the
 * transit time.
 *
 *  - delivered_at when recorded
 *  - a Delivered order from before delivery tracking (no timestamp): the order
 *    date, the conservative fallback
 *  - not delivered yet: the window has not started (null)
 */
export function refundWindowStart(order: RefundOrderLike): number | null {
  const delivered = Date.parse(String(order.delivered_at ?? ''))
  if (Number.isFinite(delivered)) return delivered
  if (String(order.status ?? '').trim() === 'Delivered') {
    const created = Date.parse(String(order.created_at ?? ''))
    return Number.isFinite(created) ? created : null
  }
  return null
}

export function getRefundIneligibilityReason(
  order: RefundOrderLike,
  now = Date.now()
): string | null {
  if (!REFUND_ELIGIBLE_PAYMENT_STATUSES.includes(order.payment_status as 'paid' | 'cod_pending')) {
    return 'Refunds can be requested only for paid or confirmed COD orders'
  }

  if (
    REFUND_INELIGIBLE_ORDER_STATUSES.includes(
      order.status as (typeof REFUND_INELIGIBLE_ORDER_STATUSES)[number]
    )
  ) {
    return 'This order is not eligible for a new refund request'
  }

  const windowStart = refundWindowStart(order)
  if (windowStart !== null && (now - windowStart) / DAY_MS > REFUND_WINDOW_DAYS) {
    return `Refund window expired. Requests are accepted within ${REFUND_WINDOW_DAYS} days of delivery.`
  }

  return null
}
