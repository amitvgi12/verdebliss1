/**
 * Order status transitions — one source of truth for the customer cancel
 * route, the staff tracking route, and the account UI (client + server safe).
 *
 * Side-effects of a transition that must hold for every writer (COD paid on
 * delivery, loyalty credit/reversal, delivered_at) live in the database
 * trigger `apply_order_lifecycle`, not here.
 *
 * Published policy (/returns-refunds): orders can be cancelled from My Account
 * before delivery; COD orders are cancelled immediately only "where fulfilment
 * has not completed"; prepaid orders move to cancellation review.
 */

export const ORDER_STATUS = {
  processing: 'Processing',
  codPending: 'COD Pending',
  codReview: 'COD Verification Required',
  shipped: 'Shipped',
  outForDelivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancellationRequested: 'Cancellation Requested',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
} as const

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]

/** Money has been taken (or is held) online — refunds go through review. */
const ONLINE_PAYMENT_STATUSES = new Set(['paid', 'authorized'])
/** Statuses that may be dispatched: prepaid captured, or COD cleared for delivery. */
const DISPATCHABLE_PAYMENT_STATUSES = new Set(['paid', 'cod_pending'])

const PRE_DISPATCH = new Set<string>([
  ORDER_STATUS.processing,
  ORDER_STATUS.codPending,
  ORDER_STATUS.codReview,
])
const IN_TRANSIT = new Set<string>([ORDER_STATUS.shipped, ORDER_STATUS.outForDelivery])

const STAFF_TRANSITIONS: Record<string, readonly string[]> = {
  [ORDER_STATUS.processing]: [ORDER_STATUS.shipped],
  [ORDER_STATUS.codReview]: [ORDER_STATUS.codPending],
  [ORDER_STATUS.codPending]: [ORDER_STATUS.shipped],
  [ORDER_STATUS.shipped]: [ORDER_STATUS.outForDelivery, ORDER_STATUS.delivered],
  [ORDER_STATUS.outForDelivery]: [ORDER_STATUS.delivered],
  // Customer asked to cancel but dispatch could not be stopped.
  [ORDER_STATUS.cancellationRequested]: [
    ORDER_STATUS.shipped,
    ORDER_STATUS.outForDelivery,
    ORDER_STATUS.delivered,
  ],
}

const SHIPPING_STATUSES = new Set<string>([
  ORDER_STATUS.shipped,
  ORDER_STATUS.outForDelivery,
  ORDER_STATUS.delivered,
])

function clean(value: string | null | undefined): string {
  return String(value ?? '').trim()
}

export function isOnlinePayment(paymentStatus: string | null | undefined): boolean {
  return ONLINE_PAYMENT_STATUSES.has(clean(paymentStatus).toLowerCase())
}

export type CustomerCancellation =
  | { allowed: false; reason: string }
  | {
      allowed: true
      nextStatus: typeof ORDER_STATUS.cancelled | typeof ORDER_STATUS.cancellationRequested
      /** Return stock now — only when nothing has left the warehouse. */
      restock: boolean
      /** Mark the COD order's payment as cancelled (no cash will be collected). */
      cancelPayment: boolean
      /** Open a refund request (money was taken or is held online). */
      queueRefund: boolean
    }

export function decideCustomerCancellation(order: {
  status?: string | null
  payment_status?: string | null
}): CustomerCancellation {
  const status = clean(order.status)

  if (status === ORDER_STATUS.delivered) {
    return {
      allowed: false,
      reason: 'Delivered orders cannot be cancelled. Please use the refund request flow.',
    }
  }
  if (status === ORDER_STATUS.cancelled || status === ORDER_STATUS.cancellationRequested) {
    return {
      allowed: false,
      reason: 'This order is already cancelled or cancellation is in progress.',
    }
  }
  if (status === ORDER_STATUS.refunded) {
    return { allowed: false, reason: 'This order has already been refunded.' }
  }
  if (!PRE_DISPATCH.has(status) && !IN_TRANSIT.has(status)) {
    return {
      allowed: false,
      reason: 'This order cannot be cancelled online. Please contact support.',
    }
  }

  if (isOnlinePayment(order.payment_status)) {
    return {
      allowed: true,
      nextStatus: ORDER_STATUS.cancellationRequested,
      restock: false,
      cancelPayment: false,
      queueRefund: true,
    }
  }

  // COD: cancel outright only while fulfilment has not started. Once the
  // parcel has left, stock is physically in transit — restocking now would
  // sell inventory we do not have. Staff close it out when the RTO lands.
  if (IN_TRANSIT.has(status)) {
    return {
      allowed: true,
      nextStatus: ORDER_STATUS.cancellationRequested,
      restock: false,
      cancelPayment: false,
      queueRefund: false,
    }
  }

  return {
    allowed: true,
    nextStatus: ORDER_STATUS.cancelled,
    restock: true,
    cancelPayment: true,
    queueRefund: false,
  }
}

export function canCustomerCancel(order: {
  status?: string | null
  payment_status?: string | null
}): boolean {
  return decideCustomerCancellation(order).allowed
}

export type StaffStatusChange =
  | { allowed: false; reason: string }
  | { allowed: true; paymentStatus?: string }

export function decideStaffStatusChange(
  order: { status?: string | null; payment_status?: string | null },
  target: string
): StaffStatusChange {
  const from = clean(order.status)
  if (from === target) return { allowed: true }

  const allowed = STAFF_TRANSITIONS[from] ?? []
  if (!allowed.includes(target)) {
    return {
      allowed: false,
      reason: `Cannot move an order from "${from || 'unknown'}" to "${target}".`,
    }
  }

  const paymentStatus = clean(order.payment_status).toLowerCase()

  // Verifying a flagged COD order clears it for dispatch.
  if (from === ORDER_STATUS.codReview && target === ORDER_STATUS.codPending) {
    return { allowed: true, paymentStatus: 'cod_pending' }
  }

  // Never dispatch an order whose money is not secured: an 'authorized'
  // Razorpay payment can still be reversed until the capture lands.
  if (SHIPPING_STATUSES.has(target) && !DISPATCHABLE_PAYMENT_STATUSES.has(paymentStatus)) {
    return {
      allowed: false,
      reason: `Payment status "${paymentStatus || 'unknown'}" is not cleared for dispatch.`,
    }
  }

  return { allowed: true }
}
