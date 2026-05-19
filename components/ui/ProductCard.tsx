'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Heart, Minus, Plus } from 'lucide-react'
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
  const mrp = typeof p.mrp === 'number' && p.mrp > price ? p.mrp : null
  const href = productPath(p)
  const inWishlist = has(p.id)
  const stockOut = p.stock === 0
  const hasApprovedReviews = p.rating != null && (p.review_count ?? 0) > 0

  const decreaseQty = () => {
    if (!cartItem) return
    if (cartItem.qty <= 1) removeItem(p.id)
    else updateQty(p.id, -1)
  }

  const increaseQty = () => {
    if (!stockOut) updateQty(p.id, 1)
  }

  return (
    <motion.article whileTap={{ scale: 0.985 }} className="vb-product-card">
      <div className="vb-product-card__media">
        <Link href={href} aria-label={`View ${p.name}, ₹${price.toLocaleString()}`}>
          <ProductImage
            product={p}
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 42vw, 280px"
          />
        </Link>

        <button
          type="button"
          aria-label={inWishlist ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`}
          onClick={() => toggle(p.id, user?.id)}
          className="vb-product-card__wishlist"
        >
          <Heart
            size={18}
            fill={inWishlist ? 'var(--color-terra)' : 'none'}
            color={inWishlist ? 'var(--color-terra)' : 'var(--color-muted)'}
          />
        </button>

        <div className="vb-product-card__badges">
          {stockOut && <ProductBadge label="SOLD OUT" tone="danger" />}
          {(p.compliance_flags ?? []).includes('age_restricted_12plus') && (
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

      <div className="vb-product-card__body">
        <div className="vb-product-card__category">{p.category}</div>

        <Link href={href} className="vb-product-card__title">
          {p.name}
        </Link>

        {hasApprovedReviews ? (
          <div className="vb-product-card__rating">
            <Stars rating={p.rating} size={11} />
            <span className="vb-product-card__review-count">({p.review_count})</span>
          </div>
        ) : (
          <div className="vb-product-card__review-state">Verified reviews after purchase</div>
        )}

        <p className="vb-product-card__subcopy">{p.description}</p>

        <div className="vb-product-card__ritual" aria-label="Product highlights">
          <span>{p.ingredient ?? 'Botanical active'}</span>
          <span>{(p.skin_types ?? ['All Types']).slice(0, 2).join(' / ')}</span>
        </div>

        <div className="vb-product-card__price-row">
          <div className="vb-product-card__prices">
            <span className="vb-product-card__price">₹{price.toLocaleString()}</span>
            {mrp && (
              <span
                className="vb-product-card__mrp"
                aria-label={`Original price ₹${mrp.toLocaleString()}`}
              >
                ₹{mrp.toLocaleString()}
              </span>
            )}
          </div>
          <span className="vb-product-card__tax-note">Inclusive of all taxes</span>
        </div>

        {cartItem ? (
          <div aria-label={`${p.name} quantity in cart`} className="vb-product-card__qty">
            <button
              type="button"
              aria-label={`Decrease ${p.name} quantity`}
              onClick={decreaseQty}
              className="vb-product-card__qty-btn"
            >
              <Minus size={14} />
            </button>
            <span className="vb-product-card__qty-value">{cartItem.qty}</span>
            <button
              type="button"
              aria-label={`Increase ${p.name} quantity`}
              onClick={increaseQty}
              className="vb-product-card__qty-btn"
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
            className="vb-product-card__add"
          >
            {stockOut ? 'Sold Out' : 'Add to ritual'}
          </button>
        )}

        <Link
          href={href}
          className="vb-product-card__details"
          aria-label={`Read more about ${p.name}`}
        >
          View details <ArrowRight size={13} />
        </Link>
      </div>
    </motion.article>
  )
}

const TONE_CLASSES = {
  danger: 'bg-[#B91C1C]',
  warning: 'bg-[#B45309]',
  forest: 'bg-forest/90',
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
    <span title={title} className={`vb-product-card__badge ${TONE_CLASSES[tone]}`}>
      {label}
    </span>
  )
}
