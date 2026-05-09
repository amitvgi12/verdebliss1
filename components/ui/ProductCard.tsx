'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, Minus, Plus } from 'lucide-react'
import ProductImage from '@/components/ui/ProductImage'
import Stars from '@/components/ui/Stars'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useAuthStore } from '@/store/authStore'
import { C, FONT } from '@/constants/theme'
import { productPath } from '@/lib/seo'
import type { Product } from '@/types'

export default function ProductCard({ product: p }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQty = useCartStore((s) => s.updateQty)
  const cartItem = useCartStore((s) => s.items.find((item) => item.id === p.id))
  const { toggle, has } = useWishlistStore()
  const user = useAuthStore((s) => s.user)

  const mrp = Math.round((p.price ?? 0) * 1.2)
  const discount = Math.round(((mrp - (p.price ?? 0)) / mrp) * 100)
  const href = productPath(p)

  const decreaseQty = () => {
    if (!cartItem) return
    if (cartItem.qty <= 1) removeItem(p.id)
    else updateQty(p.id, -1)
  }

  const increaseQty = () => {
    if (p.stock !== 0) updateQty(p.id, 1)
  }

  return (
    <motion.article
      whileTap={{ scale: 0.98 }}
      style={{
        background: C.card,
        borderRadius: 16,
        overflow: 'hidden',
        border: `1px solid ${C.border}`,
        borderTop: `2px solid ${C.gold}`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          aspectRatio: '1/1',
          background: C.ivory,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Link href={href} aria-label={`View ${p.name}, ₹${p.price?.toLocaleString()}`}>
          <ProductImage product={p} />
        </Link>
        <button
          type="button"
          aria-label={has(p.id) ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`}
          onClick={() => toggle(p.id, user?.id)}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'rgba(255,255,255,0.9)',
            border: 'none',
            borderRadius: '50%',
            width: 40,
            height: 40,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Heart
            size={18}
            fill={has(p.id) ? C.terra : 'none'}
            color={has(p.id) ? C.terra : C.muted}
          />
        </button>
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
          {p.stock === 0 && <ProductBadge label="SOLD OUT" background="#B91C1C" />}
          {p.ingredient === 'Green Tea' && (
            <ProductBadge
              label="12+ ONLY"
              background="#B45309"
              title="Contains BHA — not for under 12 / pregnancy"
            />
          )}
          {(p.badges ?? []).slice(0, 2).map((b) => (
            <ProductBadge key={b} label={b.toUpperCase()} background="rgba(45,74,50,0.85)" />
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 14px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
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

        <Link
          href={href}
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: C.text,
            lineHeight: 1.3,
            fontFamily: FONT.serif,
            marginBottom: 6,
            flex: 1,
            textDecoration: 'none',
          }}
        >
          {p.name}
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Stars rating={p.rating} size={11} />
          <span style={{ fontSize: 11, color: C.muted }}>({p.review_count})</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
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
              style={{
                display: 'grid',
                gridTemplateColumns: '40px 32px 40px',
                alignItems: 'center',
                border: `1px solid ${C.forest}`,
                borderRadius: 10,
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
                <Minus size={14} />
              </button>
              <span style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: C.forest }}>
                {cartItem.qty}
              </span>
              <button
                type="button"
                aria-label={`Increase ${p.name} quantity`}
                onClick={increaseQty}
                style={qtyButtonStyle}
              >
                <Plus size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              aria-label={p.stock === 0 ? `${p.name} sold out` : `Add ${p.name} to cart`}
              disabled={p.stock === 0}
              onClick={() => {
                if (p.stock !== 0) addItem(p)
              }}
              style={{
                background: p.stock === 0 ? C.light : C.forest,
                color: 'white',
                border: 'none',
                borderRadius: 10,
                minHeight: 40,
                padding: '8px 14px',
                fontSize: 12,
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
    </motion.article>
  )
}

function ProductBadge({
  label,
  background,
  title,
}: {
  label: string
  background: string
  title?: string
}) {
  return (
    <span
      title={title}
      style={{
        fontSize: 8,
        fontWeight: 700,
        padding: '2px 7px',
        borderRadius: 99,
        background,
        color: 'white',
        letterSpacing: '0.06em',
      }}
    >
      {label}
    </span>
  )
}

const qtyButtonStyle = {
  width: 40,
  height: 40,
  border: 'none',
  background: 'none',
  color: C.forest,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
}
