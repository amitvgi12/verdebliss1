'use client'
import { motion } from 'framer-motion'
import { ShieldCheck, AlertCircle, Loader2, Banknote } from 'lucide-react'
import ProductImage from '@/components/ui/ProductImage'
import type { CartItem } from '@/types'
import type { CheckoutForm, CheckoutStatus, PaymentAction } from '../checkout-types'

interface ReviewStepProps {
  form: CheckoutForm
  items: CartItem[]
  total: number
  shipping: number
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
  items,
  total,
  shipping,
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
      <div className="mb-4 rounded-[20px] border border-border bg-card p-7">
        <h2 className="mb-5 font-serif text-xl font-normal text-text">Review Your Order</h2>

        {/* Address summary */}
        <div className="mb-5 rounded-xl bg-sagePale px-4 py-3.5">
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

        {/* Items */}
        <ul className="m-0 list-none p-0">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3 border-b border-border py-3 last:border-b-0">
              <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg">
                <ProductImage product={item} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium leading-tight text-text">{item.name}</div>
                <div className="text-xs text-muted">Qty: {item.qty}</div>
              </div>
              <div className="flex-shrink-0 font-serif text-sm font-semibold text-text">
                ₹{(item.price * item.qty).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>

        {/* Totals */}
        <div className="mt-4 pt-4">
          <div className="mb-1.5 flex justify-between text-[13px] text-muted">
            <span>Subtotal</span>
            <span>₹{total.toLocaleString()}</span>
          </div>
          <div className="mb-2 flex justify-between text-[13px]">
            <span className="text-muted">Shipping</span>
            <span className={shipping === 0 ? 'text-sage' : 'text-text'}>
              {shipping === 0 ? 'FREE' : `₹${shipping}`}
            </span>
          </div>
          <div className="flex justify-between border-t border-border pt-2.5 text-[17px] font-bold text-text">
            <span className="font-serif">Total</span>
            <span className="font-serif">₹{grandTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Payment note */}
      <div className="mb-4 flex items-center gap-2 rounded-[10px] bg-sagePale px-3.5 py-2.5 text-xs text-forest">
        <ShieldCheck size={14} />
        Pay online with Razorpay, including UPI when enabled for your merchant account.
      </div>

      {checkoutError && (
        <div
          role="alert"
          className="mb-3 rounded-[10px] border border-terra bg-[#FFF7F2] p-3 text-xs leading-relaxed text-terra"
        >
          {checkoutError}
        </div>
      )}

      <button
        onClick={onLaunchRazorpay}
        disabled={loading || !razorReady}
        className={`mb-2 flex w-full items-center justify-center gap-2 rounded-xl border-none px-6 py-3.5 text-[15px] font-semibold text-white transition disabled:cursor-wait ${
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
        className={`flex w-full items-center justify-center gap-2 rounded-xl border px-6 py-3 text-sm font-bold transition disabled:cursor-not-allowed ${
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

      <p className="mt-2 text-[11px] leading-relaxed text-muted">
        {codAvailable
          ? 'COD orders are confirmed now and payable when your package arrives.'
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
