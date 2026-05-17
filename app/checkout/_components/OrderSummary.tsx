'use client'
import { Truck, ShieldCheck } from 'lucide-react'
import ProductImage from '@/components/ui/ProductImage'
import type { CartItem } from '@/types'
import { FREE_SHIPPING_THRESHOLD } from '@/constants/shipping'

interface OrderSummaryProps {
  items: CartItem[]
  itemCount: number
  total: number
  shipping: number
  grandTotal: number
  pointsToEarn: number
}

export default function OrderSummary({
  items,
  itemCount,
  total,
  shipping,
  grandTotal,
  pointsToEarn,
}: OrderSummaryProps) {
  return (
    <aside className="lg:sticky lg:top-20">
      <div className="checkout-panel checkout-panel--summary">
        <h2 className="mb-5 font-serif text-[1.35rem] font-normal text-text">
          Order Summary{' '}
          <span className="font-sans text-[13px] text-muted">({itemCount} items)</span>
        </h2>

        <ul className="checkout-summary-list m-0 mb-5 flex list-none flex-col p-0">
          {items.map((item) => (
            <li key={item.id} className="checkout-summary-item flex items-center gap-3">
              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl">
                <ProductImage product={item} />
                <span
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-forest text-[9px] font-bold text-white"
                  aria-label={`Quantity ${item.qty}`}
                >
                  {item.qty}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-medium leading-tight text-text">
                  {item.name}
                </div>
              </div>
              <div className="flex-shrink-0 text-[13px] font-semibold text-text">
                ₹{(item.price * item.qty).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>

        <div className="border-t border-border pt-4">
          <div className="mb-1.5 flex justify-between text-[13px] text-muted">
            <span>Subtotal</span>
            <span>₹{total.toLocaleString()}</span>
          </div>
          <div
            className={`mb-3 flex justify-between text-[13px] ${shipping === 0 ? 'text-sage' : 'text-muted'}`}
          >
            <span>Shipping</span>
            <span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-text">
            <span className="font-serif">Total</span>
            <span className="font-serif">₹{grandTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* Loyalty + delivery info */}
        <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
          <div className="flex items-center gap-2 text-[11px] text-olive">
            <span aria-hidden>🏆</span> Earn <strong>{pointsToEarn} points</strong> on this order
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted">
            <Truck size={12} />{' '}
            {shipping === 0
              ? 'Free shipping included'
              : `Add ₹${FREE_SHIPPING_THRESHOLD - total} for free shipping`}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted">
            <ShieldCheck size={12} /> 100% secure payment via Razorpay
          </div>
        </div>
      </div>
    </aside>
  )
}
