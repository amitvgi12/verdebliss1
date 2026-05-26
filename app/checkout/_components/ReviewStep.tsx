'use client'
import { motion } from 'framer-motion'
import { ArrowLeft, CreditCard, Minus, Plus, Trash2 } from 'lucide-react'
import ProductImage from '@/components/ui/ProductImage'
import { MAX_CART_ITEM_QTY } from '@/constants/cart'
import type { CartItem } from '@/types'
import type { CheckoutForm } from '../checkout-types'

interface ReviewStepProps {
  form: CheckoutForm
  items: CartItem[]
  onEditAddress: () => void
  onBackToAddress: () => void
  onContinueToPayment: () => void
  onContinueShopping: () => void
  onIncreaseQty: (id: string) => void
  onDecreaseQty: (id: string) => void
  onRemoveItem: (id: string) => void
}

export default function ReviewStep({
  form,
  items,
  onEditAddress,
  onBackToAddress,
  onContinueToPayment,
  onContinueShopping,
  onIncreaseQty,
  onDecreaseQty,
  onRemoveItem,
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
              type="button"
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
              const maxQty = Math.min(item.stock ?? MAX_CART_ITEM_QTY, MAX_CART_ITEM_QTY)
              const canIncrease = item.qty < maxQty

              return (
                <li key={item.id} className="checkout-review-item">
                  <div className="checkout-review-item__image">
                    <ProductImage product={item} sizes="60px" />
                  </div>

                  <div className="checkout-review-item__copy">
                    <div className="checkout-review-item__name">{item.name}</div>
                    <div className="checkout-review-item__price">
                      ₹{item.price.toLocaleString('en-IN')} each
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
                    ₹{(item.price * item.qty).toLocaleString('en-IN')}
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

      <div className="checkout-review-actions">
        <button type="button" onClick={onContinueShopping} className="checkout-step-text-link">
          Continue Shopping
        </button>

        <div className="checkout-step-actions checkout-step-actions--inline">
          <button type="button" onClick={onBackToAddress} className="checkout-step-secondary">
            <ArrowLeft size={15} aria-hidden />
            Back to Address
          </button>
          <button type="button" onClick={onContinueToPayment} className="checkout-step-primary">
            Continue to Payment
            <CreditCard size={15} aria-hidden />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
