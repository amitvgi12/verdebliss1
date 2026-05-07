'use client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Heart, Minus, Plus } from 'lucide-react'
import ProductImage from '@/components/ui/ProductImage'
import Stars from '@/components/ui/Stars'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useAuthStore } from '@/store/authStore'
import { C, FONT } from '@/constants/theme'

export default function ProductCard({ product: p }) {
  const router = useRouter()
  const addItem = useCartStore((s) => s.addItem)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQty = useCartStore((s) => s.updateQty)
  const cartItem = useCartStore((s) => s.items.find((item) => item.id === p.id))
  const { toggle, has } = useWishlistStore()
  const user = useAuthStore((s) => s.user)

  const mrp = Math.round((p.price ?? 0) * 1.2)
  const discount = Math.round(((mrp - p.price) / mrp) * 100)

  const goToProduct = () => router.push(`/products/${p.id}`)
  const stopCardNavigation = (e) => {
    e.stopPropagation()
  }

  const decreaseQty = (e) => {
    e.stopPropagation()
    if (!cartItem) return
    if (cartItem.qty <= 1) removeItem(p.id)
    else updateQty(p.id, -1)
  }

  const increaseQty = (e) => {
    e.stopPropagation()
    if (p.stock !== 0) updateQty(p.id, 1)
  }

  return (
    /* AUDIT FIX 6.7: role=button + tabIndex + onKeyDown for keyboard nav */
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={`View ${p.name}, ₹${p.price?.toLocaleString()}`}
      onClick={goToProduct}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          goToProduct()
        }
      }}
      whileTap={{ scale: 0.98 }}
      style={{
        background: C.card,
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        border: `1px solid ${C.border}`,
        borderTop: `2px solid ${C.gold}`,
        display: 'flex',
        flexDirection: 'column',
        outline: 'none', // focus-visible handled globally in globals.css
      }}
    >
      {/* Image */}
      <div
        style={{
          aspectRatio: '1/1',
          background: C.ivory,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <ProductImage product={p} />
        {/* Wishlist button */}
        <button
          aria-label={has(p.id) ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`}
          onClick={(e) => {
            e.stopPropagation()
            toggle(p.id, user?.id)
          }}
          onKeyDown={stopCardNavigation}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'rgba(255,255,255,0.9)',
            border: 'none',
            borderRadius: '50%',
            width: 32,
            height: 32,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Heart
            size={16}
            fill={has(p.id) ? C.terra : 'none'}
            color={has(p.id) ? C.terra : C.muted}
          />
        </button>
        {/* Badges */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            display: 'flex',
            gap: 4,
            flexWrap: 'wrap',
          }}
        >
          {p.stock === 0 && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: 99,
                background: '#B91C1C',
                color: 'white',
                letterSpacing: '0.06em',
              }}
            >
              SOLD OUT
            </span>
          )}
          {p.ingredient === 'Green Tea' && (
            <span
              title="Contains BHA — not for under 12 / pregnancy"
              style={{
                fontSize: 8,
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 99,
                background: '#B45309',
                color: 'white',
                letterSpacing: '0.06em',
              }}
            >
              12+ ONLY
            </span>
          )}
          {(p.badges ?? []).slice(0, 2).map((b) => (
            <span
              key={b}
              style={{
                fontSize: 8,
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 99,
                background: 'rgba(45,74,50,0.85)',
                color: 'white',
                letterSpacing: '0.06em',
              }}
            >
              {b.toUpperCase()}
            </span>
          ))}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '14px 14px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Category chip */}
        <div
          style={{
            display: 'inline-flex',
            width: 'fit-content',
            fontSize: 9,
            color: C.goldText,
            fontWeight: 700,
            letterSpacing: '0.10em',
            background: C.goldPale,
            padding: '2px 8px',
            borderRadius: 4,
            marginBottom: 6,
          }}
        >
          {p.category?.toUpperCase()}
        </div>

        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: C.text,
            lineHeight: 1.3,
            fontFamily: FONT.serif,
            marginBottom: 6,
            flex: 1,
          }}
        >
          {p.name}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Stars rating={p.rating} size={11} />
          <span style={{ fontSize: 11, color: C.muted }}>({p.review_count})</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: C.text, fontFamily: FONT.serif }}>
              ₹{(p.price ?? 0).toLocaleString()}
            </span>
            <span style={{ fontSize: 12, color: C.light, textDecoration: 'line-through' }}>
              ₹{mrp.toLocaleString()}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.terra }}>-{discount}%</span>
          </div>
          {cartItem ? (
            <div
              aria-label={`${p.name} quantity in cart`}
              onClick={stopCardNavigation}
              onKeyDown={stopCardNavigation}
              style={{
                display: 'grid',
                gridTemplateColumns: '28px 28px 28px',
                alignItems: 'center',
                border: `1px solid ${C.forest}`,
                borderRadius: 8,
                overflow: 'hidden',
                background: C.ivory,
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                aria-label={`Decrease ${p.name} quantity`}
                onClick={decreaseQty}
                style={qtyButtonStyle}
              >
                <Minus size={12} />
              </button>
              <span
                style={{
                  textAlign: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.forest,
                  lineHeight: '28px',
                }}
              >
                {cartItem.qty}
              </span>
              <button
                type="button"
                aria-label={`Increase ${p.name} quantity`}
                onClick={increaseQty}
                style={qtyButtonStyle}
              >
                <Plus size={12} />
              </button>
            </div>
          ) : (
            <button
              aria-label={p.stock === 0 ? `${p.name} sold out` : `Add ${p.name} to cart`}
              disabled={p.stock === 0}
              onClick={(e) => {
                e.stopPropagation()
                if (p.stock !== 0) addItem(p)
              }}
              onKeyDown={stopCardNavigation}
              style={{
                background: p.stock === 0 ? C.light : C.forest,
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 11,
                fontWeight: 600,
                cursor: p.stock === 0 ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {p.stock === 0 ? 'Sold Out' : 'Add'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

const qtyButtonStyle = {
  width: 28,
  height: 28,
  border: 'none',
  background: 'none',
  color: C.forest,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
}
