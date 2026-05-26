'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Check, Heart, Minus, Plus, Share2, ShoppingBag, Truck } from 'lucide-react'
import { C } from '@/constants/theme'

interface ProductPurchaseActionsProps {
  productName: string
  cartQty: number | null
  maxQty: number
  stockOut: boolean
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
  cartQty,
  maxQty,
  stockOut,
  added,
  isWishlisted,
  onAdd,
  onGoToCart,
  onDecreaseCartQty,
  onIncreaseCartQty,
  onWishlist,
}: ProductPurchaseActionsProps) {
  const showCartQty = cartQty !== null && cartQty > 0
  const inCart = showCartQty

  return (
    <>
      <div
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
          disabled={stockOut}
          style={{
            flex: 1,
            minWidth: 0,
            height: 52,
            borderRadius: 12,
            border: 'none',
            cursor: stockOut ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            fontSize: 14,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
            background: stockOut ? C.light : inCart ? C.sage : C.forest,
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
            ) : inCart ? (
              <motion.span
                key="go-to-cart"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <ShoppingBag size={15} /> Go to Cart
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
