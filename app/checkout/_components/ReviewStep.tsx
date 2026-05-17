'use client'
import { motion } from 'framer-motion'
import { AlertCircle, Loader2, Banknote, Minus, Plus, Trash2 } from 'lucide-react'
import ProductImage from '@/components/ui/ProductImage'
import type { CartItem } from '@/types'
import type { CheckoutForm, CheckoutStatus, PaymentAction } from '../checkout-types'

interface ReviewStepProps {
  form: CheckoutForm
  items: CartItem[]
  grandTotal: number
  codAvailable: boolean
  codMaxTotal: number
  loading: boolean
  paymentAction: PaymentAction
  razorReady: boolean
  status: CheckoutStatus
  checkoutError: string
  onEditAddress: () => void
  onContinueShopping: () => void
  onIncreaseQty: (id: string) => void
  onDecreaseQty: (id: string) => void
  onRemoveItem: (id: string) => void
  onLaunchRazorpay: () => void
  onPlaceCod: () => void
}

export default function ReviewStep({
  form,
  items,
  grandTotal,
  codAvailable,
  codMaxTotal,
  loading,
  paymentAction,
  razorReady,
  status,
  checkoutError,
  onEditAddress,
  onContinueShopping,
  onIncreaseQty,
  onDecreaseQty,
  onRemoveItem,
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
      <div className="checkout-panel checkout-panel--form checkout-review-panel">
        <h2 className="mb-5 font-serif text-[1.35rem] font-normal text-text">Review Your Order</h2>

        {/* Address summary */}
        <div className="checkout-address-card rounded-2xl bg-sagePale">
          <div className="checkout-address-card__layout">
            <div className="min-w-0 flex-1">
              <div className="mb-1 text-xs font-bold tracking-wider text-forest">DELIVERING TO</div>
              <div className="text-[13px] font-medium text-text">{form.name}</div>
              <div className="checkout-address-card__line text-xs text-muted">
                {form.line1}
                {form.line2 ? `, ${form.line2}` : ''}, {form.city}, {form.state} - {form.pincode}
              </div>
              <div className="checkout-address-card__line text-xs text-muted">
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

        <div className="checkout-review-items">
          <div className="checkout-review-items__header">
            <span>ORDER ITEMS</span>
            <span>
              {items.length} item{items.length === 1 ? '' : 's'}
            </span>
          </div>

          <ul className="checkout-review-items__list">
            {items.map((item) => {
              const maxQty = Math.min(item.stock ?? 10, 10)
              const canIncrease = item.qty < maxQty

              return (
                <li key={item.id} className="checkout-review-item">
                  <div className="checkout-review-item__image">
                    <ProductImage product={item} />
                  </div>

                  <div className="checkout-review-item__copy">
                    <div className="checkout-review-item__name">{item.name}</div>
                    <div className="checkout-review-item__price">
                      ₹{item.price.toLocaleString()} each
                    </div>
                  </div>

                  <div
                    className="checkout-review-item__qty"
                    aria-label={`${item.name} quantity in cart`}
                  >
                    <button
                      type="button"
                      onClick={() => onDecreaseQty(item.id)}
                      disabled={item.qty <= 1}
                      aria-label={`Decrease ${item.name} quantity`}
                    >
                      <Minus size={13} />
                    </button>
                    <span>{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => onIncreaseQty(item.id)}
                      disabled={!canIncrease}
                      aria-label={`Increase ${item.name} quantity`}
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <div className="checkout-review-item__total">
                    ₹{(item.price * item.qty).toLocaleString()}
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    className="checkout-review-item__remove"
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {checkoutError && (
        <div
          role="alert"
          className="checkout-unavailable mb-4 rounded-2xl p-4 text-xs leading-relaxed text-terra"
        >
          {checkoutError}
        </div>
      )}

      <div className="checkout-review-actions">
        <button type="button" onClick={onContinueShopping} className="checkout-review-shop-link">
          Continue Shopping
        </button>
      </div>

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
