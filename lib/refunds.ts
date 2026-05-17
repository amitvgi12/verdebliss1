export const REFUND_WINDOW_DAYS = 14
export const OPEN_REFUND_STATUSES = ['requested', 'reviewing', 'approved'] as const
export const REFUND_ELIGIBLE_PAYMENT_STATUSES = ['paid', 'cod_pending'] as const
export const REFUND_INELIGIBLE_ORDER_STATUSES = ['Cancelled', 'Refunded'] as const

export interface RefundOrderLike {
  status?: string | null
  payment_status?: string | null
  created_at?: string | null
}

export function getRefundIneligibilityReason(
  order: RefundOrderLike,
  now = Date.now()
): string | null {
  if (!REFUND_ELIGIBLE_PAYMENT_STATUSES.includes(order.payment_status as 'paid' | 'cod_pending')) {
    return 'Refunds can be requested only for paid or confirmed COD orders'
  }

  if (REFUND_INELIGIBLE_ORDER_STATUSES.includes(order.status as 'Cancelled' | 'Refunded')) {
    return 'This order is not eligible for a new refund request'
  }

  const createdAt = new Date(String(order.created_at)).getTime()
  const ageDays = (now - createdAt) / (24 * 60 * 60 * 1000)
  if (Number.isFinite(ageDays) && ageDays > REFUND_WINDOW_DAYS) {
    return `Refund window expired. Requests are accepted within ${REFUND_WINDOW_DAYS} days.`
  }

  return null
}
