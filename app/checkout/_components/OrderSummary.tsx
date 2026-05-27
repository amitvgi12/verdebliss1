'use client'
import { Truck, ShieldCheck } from 'lucide-react'
import ProductImage from '@/components/ui/ProductImage'
import type { CartItem } from '@/types'
import { FREE_SHIPPING_THRESHOLD } from '@/constants/shipping'

type SummaryCartItem = CartItem & { priceAvailable?: boolean }

interface OrderSummaryProps {
  items: SummaryCartItem[]
  itemCount: number
  total: number
  shipping: number
  grandTotal: number
  pointsToEarn: number
}

const ONES = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
] as const

const TENS = [
  '',
  '',
  'twenty',
  'thirty',
  'forty',
  'fifty',
  'sixty',
  'seventy',
  'eighty',
  'ninety',
] as const

function wordsBelowHundred(value: number): string {
  if (value < 20) return ONES[value]
  const tens = Math.floor(value / 10)
  const ones = value % 10
  return ones ? `${TENS[tens]}-${ONES[ones]}` : TENS[tens]
}

function wordsBelowThousand(value: number): string {
  const hundreds = Math.floor(value / 100)
  const rest = value % 100
  if (!hundreds) return wordsBelowHundred(rest)
  return rest ? `${ONES[hundreds]} hundred ${wordsBelowHundred(rest)}` : `${ONES[hundreds]} hundred`
}

function rupeesInWords(amount: number): string {
  const whole = Math.round(amount)
  if (whole === 0) return 'Zero rupees only'

  const parts: string[] = []
  const lakh = Math.floor(whole / 100000)
  const thousand = Math.floor((whole % 100000) / 1000)
  const rest = whole % 1000

  if (lakh) parts.push(`${wordsBelowThousand(lakh)} lakh`)
  if (thousand) parts.push(`${wordsBelowThousand(thousand)} thousand`)
  if (rest) parts.push(wordsBelowThousand(rest))

  return `${parts.join(' ')} rupees only`.replace(/^./, (char) => char.toUpperCase())
}

export default function OrderSummary({
  items,
  itemCount,
  total,
  shipping,
  grandTotal,
  pointsToEarn,
}: OrderSummaryProps) {
  const pricesReady = items.every((item) => item.priceAvailable !== false)

  return (
    <aside className="lg:sticky lg:top-20">
      <div className="checkout-panel checkout-panel--summary">
        <h2 className="mb-5 font-serif text-[1.35rem] font-normal text-text">
          Order Summary{' '}
          <span className="font-sans text-[13px] text-muted">
            ({itemCount} item{itemCount === 1 ? '' : 's'})
          </span>
        </h2>

        <ul className="checkout-summary-list m-0 mb-5 flex list-none flex-col p-0">
          {items.map((item) => (
            <li key={item.id} className="checkout-summary-item flex items-center gap-3">
              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl">
                <ProductImage product={item} sizes="48px" />
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
              <div className="checkout-summary-item__amount">
                {item.priceAvailable === false
                  ? 'Refreshing...'
                  : `₹${(item.price * item.qty).toLocaleString('en-IN')}`}
              </div>
            </li>
          ))}
        </ul>

        <div className="border-t border-border pt-4">
          <div className="checkout-summary-row">
            <span>Subtotal</span>
            <span>{pricesReady ? `₹${total.toLocaleString('en-IN')}` : 'Refreshing...'}</span>
          </div>
          <div className={`checkout-summary-row ${shipping === 0 ? 'text-sage' : ''}`}>
            <span>Shipping</span>
            <span>
              {pricesReady
                ? shipping === 0
                  ? 'FREE'
                  : `₹${shipping.toLocaleString('en-IN')}`
                : 'Refreshing...'}
            </span>
          </div>
          <div className="checkout-summary-total">
            <span className="font-serif">Total</span>
            <span>{pricesReady ? `₹${grandTotal.toLocaleString('en-IN')}` : 'Refreshing...'}</span>
          </div>
          {pricesReady && (
            <p className="checkout-summary-total-words">{rupeesInWords(grandTotal)}</p>
          )}
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
