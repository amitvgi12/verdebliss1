'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, Minus, Plus } from 'lucide-react'
import ProductImage from '@/components/ui/ProductImage'
import Stars from '@/components/ui/Stars'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useAuthStore } from '@/store/authStore'
import { productPath } from '@/lib/seo'
import type { Product } from '@/types'

export default function ProductCard({ product: p }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQty = useCartStore((s) => s.updateQty)
  const cartItem = useCartStore((s) => s.items.find((item) => item.id === p.id))
  const { toggle, has } = useWishlistStore()
  const user = useAuthStore((s) => s.user)

  const price = p.price ?? 0
  const mrp = Math.round(price * 1.2)
  const discount = mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0
  const href = productPath(p)
  const inWishlist = has(p.id)
  const stockOut = p.stock === 0

  const decreaseQty = () => {
    if (!cartItem) return
    if (cartItem.qty <= 1) removeItem(p.id)
    else updateQty(p.id, -1)
  }

  const increaseQty = () => {
    if (!stockOut) updateQty(p.id, 1)
  }

  return (
    <motion.article
      whileTap={{ scale: 0.98 }}
      className="flex flex-col overflow-hidden rounded-2xl border border-border border-t-2 border-t-gold bg-card"
    >
      <div className="relative aspect-square overflow-hidden bg-ivory">
        <Link href={href} aria-label={`View ${p.name}, ₹${price.toLocaleString()}`}>
          <ProductImage product={p} />
        </Link>
        <button
          type="button"
          aria-label={inWishlist ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`}
          onClick={() => toggle(p.id, user?.id)}
          className="absolute right-2 top-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-none bg-white/90"
        >
          <Heart
            size={18}
            fill={inWishlist ? 'var(--color-terra)' : 'none'}
            color={inWishlist ? 'var(--color-terra)' : 'var(--color-muted)'}
          />
        </button>
        <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
          {stockOut && <ProductBadge label="SOLD OUT" tone="danger" />}
          {p.ingredient === 'Green Tea' && (
            <ProductBadge
              label="12+ ONLY"
              tone="warning"
              title="Contains BHA — not for under 12 / pregnancy"
            />
          )}
          {(p.badges ?? []).slice(0, 2).map((b) => (
            <ProductBadge key={b} label={b.toUpperCase()} tone="forest" />
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3.5 pb-4">
        <div className="mb-1.5 inline-flex w-fit rounded bg-goldPale px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-goldText">
          {p.category}
        </div>

        <Link
          href={href}
          className="mb-1.5 flex-1 font-serif text-sm font-medium leading-snug text-text no-underline"
        >
          {p.name}
        </Link>

        <div className="mb-2.5 flex items-center gap-1.5">
          <Stars rating={p.rating} size={11} />
          <span className="text-[11px] text-muted">({p.review_count})</span>
        </div>

        <div className="flex items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-baseline gap-1.5">
            <span className="font-serif text-base font-bold text-text">
              ₹{price.toLocaleString()}
            </span>
            <span className="text-xs text-light line-through">₹{mrp.toLocaleString()}</span>
            {discount > 0 && <span className="text-[10px] font-bold text-terra">-{discount}%</span>}
          </div>
          {cartItem ? (
            <div
              aria-label={`${p.name} quantity in cart`}
              className="grid flex-shrink-0 grid-cols-[40px_32px_40px] items-center overflow-hidden rounded-[10px] border border-forest bg-ivory"
            >
              <button
                type="button"
                aria-label={`Decrease ${p.name} quantity`}
                onClick={decreaseQty}
                className="flex h-10 w-10 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-forest"
              >
                <Minus size={14} />
              </button>
              <span className="text-center text-xs font-bold text-forest">{cartItem.qty}</span>
              <button
                type="button"
                aria-label={`Increase ${p.name} quantity`}
                onClick={increaseQty}
                className="flex h-10 w-10 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-forest"
              >
                <Plus size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              aria-label={stockOut ? `${p.name} sold out` : `Add ${p.name} to cart`}
              disabled={stockOut}
              onClick={() => {
                if (!stockOut) addItem(p)
              }}
              className={`min-h-10 cursor-pointer rounded-[10px] border-none px-3.5 py-2 text-xs font-semibold text-white ${
                stockOut ? 'cursor-not-allowed bg-light' : 'bg-forest hover:bg-forestLight'
              }`}
            >
              {stockOut ? 'Sold Out' : 'Add'}
            </button>
          )}
        </div>
      </div>
    </motion.article>
  )
}

const TONE_CLASSES = {
  danger: 'bg-[#B91C1C]',
  warning: 'bg-[#B45309]',
  forest: 'bg-forest/85',
} as const

function ProductBadge({
  label,
  tone,
  title,
}: {
  label: string
  tone: keyof typeof TONE_CLASSES
  title?: string
}) {
  return (
    <span
      title={title}
      className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold tracking-wider text-white ${TONE_CLASSES[tone]}`}
    >
      {label}
    </span>
  )
}
