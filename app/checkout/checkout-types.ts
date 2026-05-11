export interface CheckoutForm {
  name: string
  email: string
  phone: string
  line1: string
  line2: string
  city: string
  state: string
  pincode: string
}

export type CheckoutErrors = Partial<Record<keyof CheckoutForm, string>>

export type CheckoutStatus = null | 'success' | 'failed'

export type PaymentAction = null | 'razorpay' | 'cod'

export interface CheckoutResult {
  paymentId?: string
  orderId?: string
  paymentMethod?: string
  verificationRequired?: boolean
  [key: string]: unknown
}

export interface RazorpaySuccess {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

export interface RazorpayFailure {
  error?: unknown
}
