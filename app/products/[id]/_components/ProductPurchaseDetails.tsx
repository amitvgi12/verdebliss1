'use client'

import Link from 'next/link'
import {
  BadgeCheck,
  Banknote,
  CreditCard,
  MapPin,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  WalletCards,
} from 'lucide-react'
import { COD_MAX_TOTAL } from '@/constants/checkout'

export interface DeliveryEstimate {
  pincode: string
  dispatchWindow: string
  deliveryEstimate: string
  prepaidAvailable: boolean
  codDecision: 'allow' | 'manual_review' | 'block'
}

type StockTone = 'in' | 'low' | 'out' | null

interface ProductPurchaseDetailsProps {
  stockTone: StockTone
  stockCount: number | null
  deliveryPin: string
  deliveryError: string
  deliveryResult: DeliveryEstimate | null
  checkingDelivery: boolean
  onDeliveryPinChange: (value: string) => void
  onDeliveryCheck: () => void
  onOpenCart: () => void
}

export default function ProductPurchaseDetails({
  stockTone,
  stockCount,
  deliveryPin,
  deliveryError,
  deliveryResult,
  checkingDelivery,
  onDeliveryPinChange,
  onDeliveryCheck,
  onOpenCart,
}: ProductPurchaseDetailsProps) {
  return (
    <section className="product-conversion" aria-label="Purchase details">
      <div className="product-conversion__signals">
        {stockTone && (
          <div className={`product-conversion__signal product-conversion__signal--${stockTone}`}>
            <BadgeCheck size={15} />
            <span>
              {stockTone === 'out'
                ? 'Out of stock'
                : stockTone === 'low'
                  ? `Low stock: ${stockCount} left`
                  : 'In stock'}
            </span>
          </div>
        )}
        <div className="product-conversion__signal">
          <WalletCards size={15} />
          <span>Prepaid available</span>
        </div>
        <div className="product-conversion__signal">
          <Banknote size={15} />
          <span>COD up to ₹{COD_MAX_TOTAL.toLocaleString()}</span>
        </div>
        <Link href="/returns-refunds" className="product-conversion__signal">
          <PackageCheck size={15} />
          <span>14-day returns</span>
        </Link>
      </div>

      <div className="product-conversion__delivery">
        <div>
          <p>Check delivery</p>
          <span>ETA and COD status by PIN code</span>
        </div>
        <div className="product-conversion__delivery-form">
          <label className="sr-only" htmlFor="delivery-pincode">
            PIN code
          </label>
          <input
            id="delivery-pincode"
            value={deliveryPin}
            onChange={(event) =>
              onDeliveryPinChange(event.target.value.replace(/\D/g, '').slice(0, 6))
            }
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="Enter PIN code"
          />
          <button type="button" onClick={onDeliveryCheck} disabled={checkingDelivery}>
            {checkingDelivery ? 'Checking...' : 'Check'}
          </button>
        </div>
        {deliveryError && <small className="product-conversion__error">{deliveryError}</small>}
        {deliveryResult && (
          <div className="product-conversion__delivery-result" aria-live="polite">
            <strong>
              <MapPin size={14} />
              {deliveryResult.deliveryEstimate} after dispatch
            </strong>
            <span>
              {deliveryResult.dispatchWindow}. {codCopy(deliveryResult.codDecision)}
            </span>
          </div>
        )}
      </div>

      <div className="product-conversion__payments" aria-label="Payment options">
        <span>
          <Smartphone size={15} /> UPI
        </span>
        <span>
          <CreditCard size={15} /> Cards
        </span>
        <span>
          <WalletCards size={15} /> Wallets
        </span>
        <span>
          <ShieldCheck size={15} /> Secure checkout
        </span>
      </div>

      <div className="product-conversion__aftercare">
        <strong>What happens after purchase</strong>
        <p>
          Confirmation is sent immediately. Orders are usually dispatched within 1 business day,
          then tracking is shared once the parcel is handed to the courier.
        </p>
      </div>

      <button type="button" className="product-conversion__cart-link" onClick={onOpenCart}>
        <ShoppingBag size={15} /> Open mini cart
      </button>
    </section>
  )
}

function codCopy(decision: DeliveryEstimate['codDecision']) {
  if (decision === 'block') return 'COD is not available for this PIN code.'
  if (decision === 'manual_review') return 'COD may need manual review at checkout.'
  return 'COD is generally available after checkout verification.'
}
