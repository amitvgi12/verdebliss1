'use client'

import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import type { CheckoutForm } from '../checkout-types'

interface SuccessStateProps {
  form: CheckoutForm
  paymentId: string | null
  paymentMethod: string | null
  pointsToEarn: number
  codVerificationRequired?: boolean
  onContinueShopping: () => void
  onViewAccount: () => void
}

export default function SuccessState({
  form,
  paymentId,
  paymentMethod,
  pointsToEarn,
  codVerificationRequired = false,
  onContinueShopping,
  onViewAccount,
}: SuccessStateProps) {
  const firstName = form.name.split(' ')[0] ?? form.name

  return (
    <div className="checkout-success-shell">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="checkout-success-card"
      >
        <div className="checkout-success-main">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="checkout-success-mark"
          >
            <CheckCircle2 size={58} aria-hidden />
          </motion.div>

          <h1 className="font-serif text-[clamp(1.9rem,3vw,2.35rem)] font-normal text-text">
            Order Confirmed!
          </h1>
          <p className="text-sm leading-relaxed text-muted">
            Thank you, {firstName}! Your botanical ritual is on its way.
          </p>

          <div className="checkout-success-actions">
            <button onClick={onContinueShopping} className="btn-primary checkout-primary-action">
              Continue Shopping
            </button>
            <button onClick={onViewAccount} className="checkout-success-secondary-action">
              View My Account
            </button>
          </div>
        </div>

        <div className="checkout-success-details">
          {paymentId && (
            <div className="checkout-success-meta">
              <div>
                {paymentMethod === 'Cash on Delivery' ? 'Order Ref' : 'Payment ID'}:{' '}
                <strong>{paymentId}</strong>
              </div>
              {paymentMethod && (
                <div>
                  Method: <strong>{paymentMethod}</strong>
                </div>
              )}
            </div>
          )}

          <div className="checkout-success-address">
            <div className="mb-2.5 text-[11px] font-bold tracking-wider text-forest">
              DELIVERING TO
            </div>
            <div className="text-[13px] text-text">{form.name}</div>
            <div className="text-[13px] text-muted">
              {form.line1}
              {form.line2 ? `, ${form.line2}` : ''}
            </div>
            <div className="text-[13px] text-muted">
              {form.city}, {form.state} — {form.pincode}
            </div>
          </div>

          <div className="checkout-success-points">
            <span className="text-xl" aria-hidden>
              🏆
            </span>
            <span className="text-[13px] font-medium text-olive">
              <strong>{pointsToEarn} loyalty points</strong> will be credited after successful
              payment verification.
            </span>
          </div>

          {codVerificationRequired && (
            <div className="checkout-success-verification">
              This COD order has been placed in a verification queue. Our team may confirm
              serviceability and address details before dispatch.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
