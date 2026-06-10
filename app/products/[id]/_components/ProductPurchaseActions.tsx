'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Heart, Minus, Plus, Share2, ShoppingBag, Truck } from 'lucide-react'
import { C } from '@/constants/theme'

interface ProductPurchaseActionsProps {
  productName: string
  priceLabel?: string | null
  cartQty: number | null
  maxQty: number
  stockOut: boolean
  priceAvailable: boolean
  added: boolean
  isWishlisted: boolean
  onAdd: () => void
  onGoToCart: () => void
  onDecreaseCartQty: () => void
  onIncreaseCartQty: () => void
  onWishlist: () => void
}

export default function ProductPurchaseActions({
  productName,
  priceLabel = null,
  cartQty,
  maxQty,
  stockOut,
  priceAvailable,
  added,
  isWishlisted,
  onAdd,
  onGoToCart,
  onDecreaseCartQty,
  onIncreaseCartQty,
  onWishlist,
}: ProductPurchaseActionsProps) {
  const showCartQty = priceAvailable && cartQty !== null && cartQty > 0
  const inCart = showCartQty
  const primaryDisabled = stockOut || !priceAvailable

  // Sticky mobile bar: appears once the main action row scrolls above the
  // viewport so Add to Cart is always one tap away on long PDPs. Rendering is
  // mobile-only via .pdp-sticky-atc CSS (product-detail.css).
  const actionRowRef = useRef<HTMLDivElement | null>(null)
  const [showSticky, setShowSticky] = useState(false)

  useEffect(() => {
    const row = actionRowRef.current
    if (!row || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        setShowSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0)
      },
      { threshold: 0 }
    )
    observer.observe(row)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <div
        ref={actionRowRef}
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'stretch',
          marginTop: 20,
          marginBottom: 12,
        }}
      >
        {showCartQty && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={onDecreaseCartQty}
              style={qtyBtn}
              aria-label={`Decrease ${productName} quantity`}
              disabled={stockOut}
            >
              <Minus size={13} />
            </button>
            <span
              aria-label={`${productName} quantity in cart`}
              style={{
                width: 28,
                textAlign: 'center',
                fontSize: 14,
                fontWeight: 600,
                color: C.text,
              }}
            >
              {cartQty}
            </span>
            <button
              type="button"
              onClick={onIncreaseCartQty}
              style={qtyBtn}
              aria-label={`Increase ${productName} quantity`}
              disabled={stockOut || cartQty >= maxQty}
            >
              <Plus size={13} />
            </button>
          </div>
        )}

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={inCart ? onGoToCart : onAdd}
          disabled={primaryDisabled}
          aria-label={
            stockOut
              ? `${productName} is sold out`
              : !priceAvailable
                ? `${productName} price temporarily unavailable`
                : inCart
                  ? `View cart — ${productName} is in your cart`
                  : `Add ${productName} to cart`
          }
          style={{
            flex: 1,
            minWidth: 0,
            height: 52,
            borderRadius: 12,
            border: 'none',
            cursor: primaryDisabled ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            fontSize: 14,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
            background: primaryDisabled ? C.light : inCart ? C.sage : C.forest,
            color: 'white',
            transition: 'background 0.25s',
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {stockOut ? (
              <motion.span
                key="sold-out"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <ShoppingBag size={15} /> Sold out
              </motion.span>
            ) : !priceAvailable ? (
              <motion.span
                key="price-unavailable"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <ShoppingBag size={15} /> Price unavailable
              </motion.span>
            ) : inCart ? (
              <motion.span
                key="go-to-cart"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <ShoppingBag size={15} /> View Cart
              </motion.span>
            ) : added ? (
              <motion.span
                key="done"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Check size={15} /> Added!
              </motion.span>
            ) : (
              <motion.span
                key="add"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <ShoppingBag size={15} /> Add to Cart
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={onWishlist}
          aria-label="Save to wishlist"
          style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            cursor: 'pointer',
            border: `1px solid ${C.border}`,
            background: C.ivory,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Heart
            size={18}
            fill={isWishlisted ? C.terra : 'none'}
            color={isWishlisted ? C.terra : C.muted}
          />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.93 }}
          aria-label="Share product"
          style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            cursor: 'pointer',
            border: `1px solid ${C.border}`,
            background: C.ivory,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => navigator.share?.({ title: productName, url: window.location.href })}
        >
          <Share2 size={16} color={C.muted} />
        </motion.button>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: C.goldPale,
          borderRadius: 10,
          padding: '10px 14px',
          fontSize: 12,
          color: C.olive,
          marginBottom: 24,
          fontWeight: 500,
        }}
      >
        <Truck size={13} />
        Free shipping on orders above ₹499 · Ships in 2–3 business days
      </div>

      {/* Mobile-only sticky bar (display gated in product-detail.css).
          Mounted on demand so the duplicate CTA never exists in the
          accessibility tree while the in-page action row is visible. */}
      {showSticky && (
        <div className="pdp-sticky-atc pdp-sticky-atc--visible">
          <div className="pdp-sticky-atc__meta">
            <span className="pdp-sticky-atc__name">{productName}</span>
            {priceLabel && <span className="pdp-sticky-atc__price">{priceLabel}</span>}
          </div>
          <button
            type="button"
            onClick={inCart ? onGoToCart : onAdd}
            disabled={primaryDisabled}
            aria-label={
              stockOut
                ? `${productName} is sold out`
                : !priceAvailable
                  ? `${productName} price temporarily unavailable`
                  : inCart
                    ? `View cart — ${productName} is in your cart`
                    : `Add ${productName} to cart`
            }
            className="pdp-sticky-atc__button"
            style={{
              background: primaryDisabled ? C.light : inCart ? C.sage : C.forest,
            }}
          >
            <ShoppingBag size={15} aria-hidden />
            {stockOut
              ? 'Sold out'
              : !priceAvailable
                ? 'Price unavailable'
                : inCart
                  ? 'View Cart'
                  : added
                    ? 'Added!'
                    : 'Add to Cart'}
          </button>
        </div>
      )}
    </>
  )
}

const qtyBtn = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  width: 40,
  height: 52,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#1C221E',
}
