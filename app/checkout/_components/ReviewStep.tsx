'use client'
import { motion } from 'framer-motion'
import { ShieldCheck, AlertCircle, Loader2, Banknote } from 'lucide-react'
import type { CheckoutForm, CheckoutStatus, PaymentAction } from '../checkout-types'

interface ReviewStepProps {
  form: CheckoutForm
  grandTotal: number
  codAvailable: boolean
  codMaxTotal: number
  loading: boolean
  paymentAction: PaymentAction
  razorReady: boolean
  status: CheckoutStatus
  checkoutError: string
  onEditAddress: () => void
  onLaunchRazorpay: () => void
  onPlaceCod: () => void
}

export default function ReviewStep({
  form,
  grandTotal,
  codAvailable,
  codMaxTotal,
  loading,
  paymentAction,
  razorReady,
  status,
  checkoutError,
  onEditAddress,
  onLaunchRazorpay,
  onPlaceCod,
}: ReviewStepProps) {
  return (
    <motion.div
      key="review"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="checkout-panel checkout-panel--form mb-4">
        <h2 className="mb-5 font-serif text-[1.35rem] font-normal text-text">Review Your Order</h2>

        {/* Address summary */}
        <div className="checkout-address-card rounded-2xl bg-sagePale px-4 py-4">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-1 text-xs font-bold tracking-wider text-forest">DELIVERING TO</div>
              <div className="text-[13px] font-medium text-text">{form.name}</div>
              <div className="text-xs text-muted">
                {form.line1}
                {form.line2 ? `, ${form.line2}` : ''}, {form.city}, {form.state} - {form.pincode}
              </div>
              <div className="text-xs text-muted">
                {form.phone} · {form.email}
              </div>
            </div>
            <button
              onClick={onEditAddress}
              className="flex-shrink-0 cursor-pointer border-none bg-transparent text-xs font-semibold text-forest underline"
            >
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Payment note */}
      <div className="checkout-payment-note mb-4 flex items-center gap-2 rounded-2xl bg-sagePale px-4 py-3 text-xs text-forest">
        <ShieldCheck size={14} />
        Pay online with Razorpay, including UPI when enabled for your merchant account.
      </div>

      {checkoutError && (
        <div
          role="alert"
          className="checkout-unavailable mb-4 rounded-2xl p-4 text-xs leading-relaxed text-terra"
        >
          {checkoutError}
        </div>
      )}

      <div className="checkout-payment-stack">
        <button
          onClick={onLaunchRazorpay}
          disabled={loading || !razorReady}
          className={`checkout-primary-action flex w-full items-center justify-center gap-2 border-none px-6 text-[15px] font-semibold text-white transition disabled:cursor-wait ${
            loading && paymentAction === 'razorpay' ? 'bg-sage' : 'bg-forest hover:bg-forestLight'
          }`}
        >
          {loading && paymentAction === 'razorpay' ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Opening Payment Gateway…
            </>
          ) : !razorReady ? (
            'Loading payment gateway…'
          ) : (
            <>Pay Online ₹{grandTotal.toLocaleString()}</>
          )}
        </button>

        <button
          onClick={onPlaceCod}
          disabled={loading || !codAvailable}
          className={`checkout-primary-action flex w-full items-center justify-center gap-2 border px-6 text-sm font-bold transition disabled:cursor-not-allowed ${
            codAvailable
              ? 'border-forest bg-ivory text-forest hover:bg-sagePale'
              : 'cursor-not-allowed border-border bg-[#F1ECE6] text-light'
          }`}
        >
          {loading && paymentAction === 'cod' ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Placing order…
            </>
          ) : (
            <>
              <Banknote size={15} />{' '}
              {codAvailable
                ? 'Cash on Delivery'
                : `COD unavailable above ₹${codMaxTotal.toLocaleString()}`}
            </>
          )}
        </button>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-muted">
        {codAvailable
          ? 'COD orders may be held briefly for phone, pincode, and address verification before dispatch.'
          : `Please use online payment for orders above ₹${codMaxTotal.toLocaleString()}.`}
      </p>

      {status === 'failed' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          role="alert"
          className="mt-2 flex items-center gap-2 rounded-[10px] bg-[#FCEBEB] px-3.5 py-2.5 text-[13px] text-[#A32D2D]"
        >
          <AlertCircle size={14} /> Payment failed. Please try again or use a different payment
          method.
        </motion.div>
      )}
    </motion.div>
  )
}
