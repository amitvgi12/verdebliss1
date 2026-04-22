/**
 * CartDrawer.jsx
 * Uses selectTotal / selectItemCount / selectPointsToEarn selectors
 * instead of ES getter properties that break after persist rehydration.
 */
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, Award } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCartStore, selectTotal, selectItemCount, selectPointsToEarn } from '@/store/cartStore'
import ProductImage from '@/components/ui/ProductImage'
import { C, FONT } from '@/constants/theme'

export default function CartDrawer() {
  const navigate     = useNavigate()
  const items        = useCartStore((s) => s.items)
  const isOpen       = useCartStore((s) => s.isOpen)
  const closeCart    = useCartStore((s) => s.closeCart)
  const removeItem   = useCartStore((s) => s.removeItem)
  const updateQty    = useCartStore((s) => s.updateQty)
  const total        = useCartStore(selectTotal)
  const itemCount    = useCartStore(selectItemCount)
  const pointsToEarn = useCartStore(selectPointsToEarn)

  const handleCheckout = () => {
    closeCart()
    navigate('/checkout')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeCart}
            style={{ position: 'fixed', inset: 0, background: 'rgba(28,34,30,0.45)', zIndex: 200 }}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
            aria-label="Shopping cart"
            style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 'min(400px, 100vw)', background: C.card, zIndex: 201, display: 'flex', flexDirection: 'column', boxShadow: '-6px 0 40px rgba(0,0,0,0.12)' }}
          >
            {/* Header */}
            <div style={{ padding: '22px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ fontFamily: FONT.serif, fontSize: 22, color: C.text }}>
                Your Cart{' '}
                <span style={{ fontSize: 16, color: C.muted }}>({itemCount})</span>
              </div>
              <button
                onClick={closeCart}
                aria-label="Close cart"
                style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={15} color={C.muted} />
              </button>
            </div>

            {/* Items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
              {items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '72px 0' }}>
                  <div style={{ fontSize: 56, marginBottom: 12 }}>🛍️</div>
                  <div style={{ fontSize: 20, color: C.muted, fontFamily: FONT.serif, marginBottom: 6 }}>Your cart is empty</div>
                  <p style={{ fontSize: 13, color: C.light, marginBottom: 20 }}>Discover your perfect botanical ritual</p>
                  <button
                    onClick={() => { closeCart(); navigate('/products') }}
                    style={{ background: C.forest, color: 'white', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
                  >
                    Browse Products
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', gap: 14, padding: '16px 0', borderBottom: `1px solid ${C.border}` }}>
                    {/* Product image using ProductImage component */}
                    <div style={{ width: 64, height: 64, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                      <ProductImage product={item} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 3, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                      <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>₹{item.price?.toLocaleString()}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={() => updateQty(item.id, -1)} style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${C.border}`, background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Minus size={11} />
                        </button>
                        <span style={{ fontSize: 13, fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${C.border}`, background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Plus size={11} />
                        </button>
                        <button onClick={() => removeItem(item.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
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
              <div style={{ padding: '20px 24px', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
                {/* Loyalty points */}
                <div style={{ background: C.goldPale, borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Award size={13} color={C.gold} />
                  <span style={{ fontSize: 12, color: C.olive, fontWeight: 500 }}>
                    You&apos;ll earn <strong>{pointsToEarn}</strong> loyalty points on this order
                  </span>
                </div>

                {/* Subtotal */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: C.muted }}>Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: FONT.serif }}>
                    ₹{total.toLocaleString()}
                  </span>
                </div>
                {total < 499 && (
                  <div style={{ fontSize: 11, color: C.terra, marginBottom: 4 }}>
                    Add ₹{(499 - total).toLocaleString()} more for free shipping
                  </div>
                )}
                {total >= 499 && (
                  <div style={{ fontSize: 11, color: C.sage, marginBottom: 4 }}>✓ Free shipping unlocked</div>
                )}
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>Taxes calculated at checkout</div>

                {/* Checkout button */}
                <button
                  onClick={handleCheckout}
                  style={{ width: '100%', background: C.forest, color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8, transition: 'background 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = C.forestLight }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = C.forest }}
                >
                  Proceed to Checkout — ₹{total.toLocaleString()}
                </button>
                <button
                  onClick={closeCart}
                  style={{ width: '100%', background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', padding: '6px' }}
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
