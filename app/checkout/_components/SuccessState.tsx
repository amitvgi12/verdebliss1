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
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[480px] rounded-3xl border border-border bg-card px-10 py-12 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          <CheckCircle2 size={64} className="mx-auto mb-6 text-forest" aria-hidden />
        </motion.div>

        <h1 className="mb-3 font-serif text-[32px] font-normal text-text">Order Confirmed!</h1>
        <p className="mb-2 text-sm leading-relaxed text-muted">
          Thank you, {firstName}! Your botanical ritual is on its way.
        </p>

        {paymentId && (
          <div className="mb-6 rounded-[10px] bg-goldPale px-4 py-2.5 text-xs text-olive">
            {paymentMethod === 'Cash on Delivery' ? 'Order Ref' : 'Payment ID'}:{' '}
            <strong>{paymentId}</strong>
            {paymentMethod && (
              <div className="mt-1">
                Method: <strong>{paymentMethod}</strong>
              </div>
            )}
          </div>
        )}

        <div className="mb-6 rounded-xl bg-sagePale p-4 text-left">
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

        <div className="mb-7 flex items-center gap-2.5 rounded-xl bg-goldPale px-4 py-3.5">
          <span className="text-xl" aria-hidden>
            🏆
          </span>
          <span className="text-[13px] font-medium text-olive">
            <strong>{pointsToEarn} loyalty points</strong> will be credited after successful payment
            verification.
          </span>
        </div>

        {codVerificationRequired && (
          <div className="mb-7 rounded-xl border border-[#E4CFA7] bg-[#FFF8E8] px-4 py-3 text-left text-[12px] leading-relaxed text-olive">
            This COD order has been placed in a verification queue. Our team may confirm
            serviceability and address details before dispatch.
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <button
            onClick={onContinueShopping}
            className="cursor-pointer rounded-xl border-none bg-forest px-3 py-3 text-sm font-semibold text-white"
          >
            Continue Shopping
          </button>
          <button
            onClick={onViewAccount}
            className="cursor-pointer rounded-xl border border-border bg-transparent px-3 py-3 text-sm text-muted hover:bg-bg"
          >
            View My Account
          </button>
        </div>
      </motion.div>
    </div>
  )
}
