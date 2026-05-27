'use client'

import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, Banknote, Edit3, Loader2 } from 'lucide-react'
import TurnstileWidget from '@/components/ui/TurnstileWidget'
import type { CheckoutStatus, PaymentAction } from '../checkout-types'

interface PaymentStepProps {
  grandTotal: number
  codAvailable: boolean
  codMaxTotal: number
  loading: boolean
  paymentAction: PaymentAction
  razorReady: boolean
  status: CheckoutStatus
  checkoutError: string
  turnstileToken: string | null
  turnstileResetKey: number
  turnstileConfigured: boolean
  requiresTurnstile: boolean
  onBackToReview: () => void
  onEditAddress: () => void
  onTurnstileToken: (token: string | null) => void
  onLaunchRazorpay: () => void
  onPlaceCod: () => void
}

export default function PaymentStep({
  grandTotal,
  codAvailable,
  codMaxTotal,
  loading,
  paymentAction,
  razorReady,
  status,
  checkoutError,
  turnstileToken,
  turnstileResetKey,
  turnstileConfigured,
  requiresTurnstile,
  onBackToReview,
  onEditAddress,
  onTurnstileToken,
  onLaunchRazorpay,
  onPlaceCod,
}: PaymentStepProps) {
  const verificationReady = !requiresTurnstile || Boolean(turnstileToken)
  const codNote = codAvailable
    ? 'COD orders may be held briefly for phone, pincode, and address verification before dispatch.'
    : `Please use online payment for orders above ₹${codMaxTotal.toLocaleString()}.`

  return (
    <motion.div
      key="payment"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="checkout-panel checkout-panel--form checkout-payment-panel">
        <div className="checkout-payment-heading">
          <div>
            <h2 className="font-serif text-[1.35rem] font-normal text-text">Payment</h2>
            <p>Choose how you would like to place this order.</p>
          </div>
          <button type="button" onClick={onEditAddress} className="checkout-step-text-link">
            <Edit3 size={14} aria-hidden />
            Edit delivery details
          </button>
        </div>

        {checkoutError && (
          <div role="alert" className="checkout-unavailable">
            <AlertCircle size={16} aria-hidden />
            <div>
              <strong>Checkout needs verification</strong>
              <span>{checkoutError}</span>
            </div>
          </div>
        )}

        {requiresTurnstile && (
          <div
            className={`checkout-turnstile-card ${
              turnstileConfigured ? '' : 'checkout-turnstile-card--missing'
            }`}
          >
            <div>
              <strong>Cloudflare verification</strong>
              <span>
                {turnstileConfigured
                  ? 'Complete this bot check before payment or Cash on Delivery.'
                  : 'Verification is required, but the public site key is missing from this deployment.'}
              </span>
            </div>
            {turnstileConfigured && (
              <TurnstileWidget
                key={turnstileResetKey}
                onToken={onTurnstileToken}
                onExpire={() => onTurnstileToken(null)}
                className="checkout-turnstile-widget"
              />
            )}
            <span className="checkout-turnstile-status">
              {turnstileToken
                ? 'Ready for server check'
                : turnstileConfigured
                  ? 'Verification required'
                  : 'Site key missing'}
            </span>
          </div>
        )}

        <div className="checkout-payment-stack">
          <button
            type="button"
            onClick={onLaunchRazorpay}
            disabled={loading || !razorReady || !verificationReady}
            className={`checkout-primary-action flex w-full items-center justify-center gap-2 border-none px-5 text-[15px] font-semibold text-white transition disabled:cursor-wait ${
              loading && paymentAction === 'razorpay' ? 'bg-sage' : 'bg-forest hover:bg-forestLight'
            }`}
          >
            {loading && paymentAction === 'razorpay' ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Opening Payment Gateway...
              </>
            ) : !razorReady ? (
              'Loading payment gateway...'
            ) : (
              <>Pay Online ₹{grandTotal.toLocaleString()}</>
            )}
          </button>

          <div className="checkout-cod-option">
            <button
              type="button"
              onClick={onPlaceCod}
              disabled={loading || !codAvailable || !verificationReady}
              aria-describedby="checkout-cod-note"
              className={`checkout-primary-action flex w-full items-center justify-center gap-2 border px-5 text-sm font-bold transition disabled:cursor-not-allowed ${
                codAvailable
                  ? 'border-forest bg-ivory text-forest hover:bg-sagePale'
                  : 'cursor-not-allowed border-border bg-[#F1ECE6] text-light'
              }`}
            >
              {loading && paymentAction === 'cod' ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Placing order...
                </>
              ) : (
                <>
                  <Banknote size={15} aria-hidden />{' '}
                  {codAvailable
                    ? 'Cash on Delivery'
                    : `COD unavailable above ₹${codMaxTotal.toLocaleString()}`}
                </>
              )}
            </button>
            <p id="checkout-cod-note" className="checkout-cod-note">
              {codNote}
            </p>
          </div>
        </div>

        {status === 'failed' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            role="alert"
            className="checkout-payment-failed"
          >
            <AlertCircle size={14} aria-hidden /> Payment failed. Please try again or use a
            different payment method.
          </motion.div>
        )}
      </div>

      <div className="checkout-step-actions">
        <button type="button" onClick={onBackToReview} className="checkout-step-secondary">
          <ArrowLeft size={15} aria-hidden />
          Back to Review
        </button>
      </div>
    </motion.div>
  )
}
