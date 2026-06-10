'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Heart, Minus, Plus, ArrowLeftRight } from 'lucide-react'
import ProductImage from '@/components/ui/ProductImage'
import Stars from '@/components/ui/Stars'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useCompareStore, MAX_COMPARE_PRODUCTS } from '@/store/compareStore'
import { PRICE_UNAVAILABLE_COPY, getVerifiablePriceOffer, hasProductPrice } from '@/lib/pricing'
import { formatApprovedReviewCount } from '@/lib/review-copy'
import { productPath } from '@/lib/seo'
import type { Product } from '@/types'

export default function ProductCard({
  product: p,
  priority = false,
}: {
  product: Product
  priority?: boolean
}) {
  const addItem = useCartStore((s) => s.addItem)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQty = useCartStore((s) => s.updateQty)
  const cartItem = useCartStore((s) => s.items.find((item) => item.id === p.id))
  const { toggle, has } = useWishlistStore()
  const { toggle: compareToggle, products: compareProducts } = useCompareStore()
  const inCompare = compareProducts.some((cp) => cp.id === p.id)
  const compareDisabled = !inCompare && compareProducts.length >= MAX_COMPARE_PRODUCTS

  const priceOffer = getVerifiablePriceOffer(p)
  const price = priceOffer.price
  const mrp = priceOffer.mrp
  const priceAvailable = hasProductPrice(p)
  const href = productPath(p)
  const inWishlist = has(p.id)
  const stockOut = p.stock === 0
  const canAddToCart = !stockOut && priceAvailable
  const hasApprovedReviews = p.rating != null && (p.review_count ?? 0) > 0

  const decreaseQty = () => {
    if (!cartItem) return
    if (cartItem.qty <= 1) removeItem(p.id)
    else updateQty(p.id, -1)
  }

  const increaseQty = () => {
    if (canAddToCart) updateQty(p.id, 1)
  }

  return (
    <motion.article whileTap={{ scale: 0.985 }} className="vb-product-card">
      <div className="vb-product-card__media">
        <Link
          href={href}
          aria-label={
            priceAvailable
              ? `View ${p.name}, ₹${price.toLocaleString()}`
              : `View ${p.name}, ${PRICE_UNAVAILABLE_COPY.toLowerCase()}`
          }
        >
          {/* Grid is 2-col on mobile (~45vw per card incl. gaps) and capped at
              ~280px columns on desktop — keep this hint tight so the optimizer
              serves the smallest sufficient srcset candidate. */}
          <ProductImage
            product={p}
            priority={priority}
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 33vw, 280px"
          />
        </Link>

        <button
          type="button"
          aria-label={inWishlist ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`}
          onClick={() => toggle(p.id)}
          className="vb-product-card__wishlist"
        >
          <Heart
            size={18}
            fill={inWishlist ? 'var(--color-terra)' : 'none'}
            color={inWishlist ? 'var(--color-terra)' : 'var(--color-muted)'}
          />
        </button>

        {(stockOut || !priceAvailable) && (
          <div className="vb-product-card__badges">
            <ProductBadge label={stockOut ? 'SOLD OUT' : 'PRICE UNAVAILABLE'} tone="danger" />
          </div>
        )}
      </div>

      <div className="vb-product-card__body">
        <div className="vb-product-card__category">{p.category}</div>

        {(p.compliance_flags ?? []).includes('age_restricted_12plus') && (
          <div className="vb-product-card__claim-row">
            <span
              className="vb-product-card__claim"
              title="Contains 0.5% salicylic acid (BHA). Recommended for ages 12+."
            >
              Contains BHA · 12+
            </span>
          </div>
        )}

        <Link href={href} className="vb-product-card__title">
          {p.name}
        </Link>

        {hasApprovedReviews ? (
          <div className="vb-product-card__rating">
            <Stars rating={p.rating} size={11} />
            <span className="vb-product-card__review-count">
              {p.rating?.toFixed(1)} · {formatApprovedReviewCount(p.review_count)}
            </span>
          </div>
        ) : (
          <div className="vb-product-card__review-state">Reviews open after purchase</div>
        )}

        <p className="vb-product-card__subcopy">{p.description}</p>

        <div className="vb-product-card__ritual" aria-label="Product highlights">
          <span>{p.ingredient ?? 'Botanical active'}</span>
          <span>{(p.skin_types ?? ['All Types']).slice(0, 2).join(' / ')}</span>
        </div>

        <div className="vb-product-card__price-row">
          {priceAvailable ? (
            <>
              <div className="vb-product-card__prices">
                <span className="vb-product-card__price">₹{price.toLocaleString()}</span>
                {mrp && (
                  <span
                    className="vb-product-card__mrp"
                    aria-label={`MRP ₹${mrp.toLocaleString()}`}
                  >
                    MRP ₹{mrp.toLocaleString()}
                  </span>
                )}
              </div>
              <span className="vb-product-card__tax-note">Inclusive of all taxes</span>
            </>
          ) : (
            <span className="vb-product-card__price-unavailable">{PRICE_UNAVAILABLE_COPY}</span>
          )}
        </div>

        {cartItem && priceAvailable ? (
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
            aria-label={
              stockOut
                ? `${p.name} sold out`
                : priceAvailable
                  ? `Add ${p.name} to cart`
                  : `${p.name} price temporarily unavailable`
            }
            disabled={!canAddToCart}
            onClick={() => {
              if (canAddToCart) addItem(p)
            }}
            className="vb-product-card__add"
          >
            {stockOut ? 'Sold Out' : priceAvailable ? 'Add to Cart' : 'Unavailable'}
          </button>
        )}

        <Link
          href={href}
          className="vb-product-card__details"
          aria-label={`Read more about ${p.name}`}
        >
          View details <ArrowRight size={13} />
        </Link>

        <button
          type="button"
          onClick={() => compareToggle(p)}
          disabled={compareDisabled}
          aria-pressed={inCompare}
          aria-label={
            inCompare
              ? `Remove ${p.name} from comparison`
              : compareDisabled
                ? `Comparison full — remove a product first`
                : `Add ${p.name} to comparison`
          }
          className={`vb-product-card__compare${inCompare ? ' vb-product-card__compare--active' : ''}`}
        >
          <ArrowLeftRight size={12} />
          {inCompare ? 'Remove' : 'Compare'}
        </button>
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
