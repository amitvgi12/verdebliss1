'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, Award } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FREE_SHIPPING_THRESHOLD } from '@/constants/shipping'
import { useCartStore, selectTotal, selectItemCount, selectPointsToEarn } from '@/store/cartStore'
import ProductImage from '@/components/ui/ProductImage'
import { C, FONT } from '@/constants/theme'

export default function CartDrawer() {
  const router = useRouter()
  const items = useCartStore((s) => s.items)
  const isOpen = useCartStore((s) => s.isOpen)
  const closeCart = useCartStore((s) => s.closeCart)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQty = useCartStore((s) => s.updateQty)
  const total = useCartStore(selectTotal)
  const itemCount = useCartStore(selectItemCount)
  const pointsToEarn = useCartStore(selectPointsToEarn)

  const shippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total)
  const shippingProgress = Math.min(100, (total / FREE_SHIPPING_THRESHOLD) * 100)

  const handleCheckout = () => {
    closeCart()
    router.push('/checkout')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            style={{ position: 'fixed', inset: 0, background: 'rgba(28,34,30,0.45)', zIndex: 200 }}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-heading"
            style={{
              position: 'fixed',
              right: 0,
              top: 0,
              bottom: 0,
              width: 'min(420px, 100vw)',
              background: C.card,
              zIndex: 201,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-6px 0 40px rgba(0,0,0,0.12)',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '20px 28px',
                borderBottom: `1px solid ${C.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <div
                id="cart-heading"
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: C.muted,
                }}
              >
                CART
                {itemCount > 0 && (
                  <span
                    style={{
                      marginLeft: 8,
                      background: C.forest,
                      color: 'white',
                      borderRadius: 999,
                      padding: '2px 7px',
                      fontSize: 9,
                      fontWeight: 900,
                    }}
                  >
                    {itemCount}
                  </span>
                )}
              </div>
              <button
                onClick={closeCart}
                aria-label="Close cart"
                style={{
                  background: 'none',
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={15} color={C.muted} />
              </button>
            </div>

            {/* Shipping progress bar — shown when cart has items */}
            {items.length > 0 && (
              <div
                role="status"
                aria-live="polite"
                style={{
                  padding: '12px 28px 14px',
                  borderBottom: `1px solid ${C.border}`,
                  flexShrink: 0,
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    color: shippingRemaining === 0 ? C.olive : C.muted,
                    marginBottom: 8,
                  }}
                >
                  {shippingRemaining > 0 ? (
                    <>
                      Add{' '}
                      <strong style={{ color: C.forest }}>
                        ₹{shippingRemaining.toLocaleString()}
                      </strong>{' '}
                      more for free shipping
                    </>
                  ) : (
                    <strong style={{ color: C.olive }}>
                      Free shipping unlocked — ships on us.
                    </strong>
                  )}
                </p>
                <div
                  style={{
                    height: 3,
                    borderRadius: 999,
                    background: C.border,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${shippingProgress}%`,
                      background:
                        shippingRemaining === 0
                          ? C.sage
                          : `linear-gradient(90deg, ${C.gold}, ${C.terra})`,
                      borderRadius: 999,
                      transition: 'width 300ms ease-out',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px' }}>
              {items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '72px 0' }}>
                  <div style={{ fontSize: 52, marginBottom: 12 }}>🛍️</div>
                  <div
                    style={{
                      fontSize: 20,
                      color: C.muted,
                      fontFamily: FONT.serif,
                      marginBottom: 6,
                    }}
                  >
                    Your cart is empty
                  </div>
                  <p style={{ fontSize: 13, color: C.light, marginBottom: 20 }}>
                    Discover your perfect botanical ritual
                  </p>
                  <button
                    onClick={() => {
                      closeCart()
                      router.push('/products')
                    }}
                    style={{
                      background: C.forest,
                      color: 'white',
                      border: 'none',
                      borderRadius: 10,
                      padding: '10px 24px',
                      fontSize: 13,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontWeight: 500,
                    }}
                  >
                    Browse Products
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      gap: 14,
                      padding: '18px 0',
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    <div
                      style={{
                        width: 68,
                        height: 68,
                        borderRadius: 12,
                        overflow: 'hidden',
                        flexShrink: 0,
                        border: `1px solid ${C.border}`,
                      }}
                    >
                      <ProductImage product={item} sizes="68px" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: C.text,
                          marginBottom: 3,
                          lineHeight: 1.3,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.name}
                      </div>
                      <div style={{ fontSize: 13, color: C.muted, marginBottom: 10 }}>
                        ₹{item.price?.toLocaleString()}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          aria-label={`Decrease ${item.name} quantity`}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 7,
                            border: `1px solid ${C.border}`,
                            background: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Minus size={11} />
                        </button>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            minWidth: 20,
                            textAlign: 'center',
                          }}
                        >
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          aria-label={`Increase ${item.name} quantity`}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 7,
                            border: `1px solid ${C.border}`,
                            background: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Plus size={11} />
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove ${item.name} from cart`}
                          style={{
                            marginLeft: 'auto',
                            background: 'none',
                            border: 'none',
                            color: C.muted,
                            cursor: 'pointer',
                            fontSize: 12,
                            fontFamily: 'inherit',
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div
                style={{ padding: '20px 28px', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}
              >
                {/* Loyalty points */}
                <div
                  style={{
                    background: C.goldPale,
                    borderRadius: 10,
                    padding: '10px 14px',
                    marginBottom: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Award size={13} color={C.gold} />
                  <span style={{ fontSize: 12, color: C.olive, fontWeight: 500 }}>
                    You&apos;ll earn <strong>{pointsToEarn}</strong> loyalty points on this order
                  </span>
                </div>

                {/* Subtotal */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontSize: 13, color: C.muted }}>
                    Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})
                  </span>
                  <span
                    style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: FONT.serif }}
                  >
                    ₹{total.toLocaleString()}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>
                  Taxes calculated at checkout
                </div>

                {/* Checkout button */}
                <button
                  onClick={handleCheckout}
                  style={{
                    width: '100%',
                    background: C.forest,
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    padding: '14px',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    marginBottom: 8,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = C.forestLight
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = C.forest
                  }}
                >
                  Proceed to Checkout — ₹{total.toLocaleString()}
                </button>
                <button
                  onClick={() => {
                    closeCart()
                    router.push('/products')
                  }}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    color: C.muted,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    padding: '6px',
                  }}
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
