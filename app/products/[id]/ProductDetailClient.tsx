'use client'
/**
 * ProductDetail.jsx — By Nature–style product page
 *
 * Audit fixes applied (Section 11):
 *   11.2 — Full INCI ingredient list in descending concentration
 *   11.3 — Allergen warnings + patch test notice
 *   11.4 — Certification badges with external verification links
 *   11.9 — Product-level FTC disclaimer
 *   11.10 — PAO (Period After Opening) indicator
 */

import Link from 'next/link'
import { useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  ShoppingBag,
  Check,
  Award,
  ArrowLeft,
  ChevronRight,
  Plus,
  Minus,
  Share2,
  Truck,
  AlertTriangle,
  BadgeCheck,
  Banknote,
  CreditCard,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Smartphone,
  WalletCards,
} from 'lucide-react'
import Stars from '@/components/ui/Stars'
import ProductImage from '@/components/ui/ProductImage'
import ProductCard from '@/components/ui/ProductCard'
import { useProduct, useProducts } from '@/hooks/useProducts'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useAuthStore } from '@/store/authStore'
import { useIsMobile } from '@/hooks/useIsMobile'
import ReviewSection from '@/components/features/reviews/ReviewSection'
import { C, FONT } from '@/constants/theme'
import { PRODUCT_COMPLIANCE } from '@/constants/productCompliance'
import type { ApprovedReview, ReviewAggregate } from '@/lib/products-server'
import type { Product } from '@/types'
import { COD_MAX_TOTAL } from '@/constants/checkout'

import PAOSymbol from './_components/PAOSymbol'
import Accordion from './_components/Accordion'

/* ── Per-ingredient INCI fallback ─────────────────────────────── */
const HOW_TO_USE = [
  'Cleanse and gently tone your face.',
  'Apply 3–4 drops to fingertips.',
  'Press gently into skin, avoiding the eye area.',
  'Follow with moisturiser and SPF in the morning.',
]

const BENEFITS = [
  {
    icon: '💧',
    title: 'Deep Hydration',
    desc: "Helps support skin's moisture retention for visibly plumper skin.",
  },
  {
    icon: '✨',
    title: 'Visible Radiance',
    desc: 'Skin appears brighter and more even-toned with regular use.',
  },
  {
    icon: '🛡️',
    title: 'Barrier Support',
    desc: 'Helps reinforce the appearance of a healthy skin barrier.',
  },
]

/* ── Certification data with external verification links ──────── */
const CERTIFICATIONS = [
  {
    label: 'Cruelty-Free',
    emoji: '🐰',
    url: 'https://www.leapingbunny.org/',
    org: 'Leaping Bunny',
  },
  {
    label: 'Vegan',
    emoji: '🌱',
    url: 'https://www.peta.org/living/personal-care-fashion/beauty-without-bunnies/',
    org: 'PETA',
  },
  { label: 'Derma-Tested', emoji: '🏥', url: null, org: 'In-house Tested' },
  { label: 'Eco Packaging', emoji: '♻️', url: null, org: 'FSC-Certified Packaging' },
]

export default function ProductDetailClient({
  id,
  initialProduct,
  initialReviews = [],
  initialReviewAggregate = null,
}: {
  id: string
  initialProduct?: Product | null
  initialReviews?: ApprovedReview[]
  initialReviewAggregate?: ReviewAggregate | null
}) {
  // id passed as prop
  const router = useRouter()
  const isMobile = useIsMobile()

  const { product: serverProduct, loading } = useProduct(initialProduct ? undefined : id)
  const p = initialProduct ?? serverProduct
  const isLoading = !initialProduct && loading
  const { products: all } = useProducts({})
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)
  const { toggle, has } = useWishlistStore()
  const user = useAuthStore((s) => s.user)

  const [added, setAdded] = useState(false)
  const [qty, setQty] = useState(1)
  const [openSection, setSection] = useState('ingredients')
  const [deliveryPin, setDeliveryPin] = useState('')
  const [deliveryResult, setDeliveryResult] = useState<DeliveryEstimate | null>(null)
  const [deliveryError, setDeliveryError] = useState('')
  const [checkingDelivery, setCheckingDelivery] = useState(false)

  /* ── Dynamic SEO with Product JSON-LD ─── */

  const handleAdd = () => {
    if (!p) return
    const qtyToAdd = Math.min(qty, maxQty)
    if (stockOut || qtyToAdd < 1) return
    for (let i = 0; i < qtyToAdd; i++) addItem(p)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const handleDeliveryCheck = async () => {
    const pincode = deliveryPin.trim()
    if (!/^\d{6}$/.test(pincode)) {
      setDeliveryResult(null)
      setDeliveryError('Enter a valid 6-digit PIN code')
      return
    }

    setCheckingDelivery(true)
    setDeliveryError('')
    try {
      const response = await fetch(`/api/delivery-estimate?pincode=${encodeURIComponent(pincode)}`)
      const data = (await response.json()) as DeliveryEstimate | { error?: string }
      if (!response.ok) throw new Error('error' in data ? data.error : 'Unable to check delivery')
      setDeliveryResult(data as DeliveryEstimate)
    } catch (error) {
      setDeliveryResult(null)
      setDeliveryError(error instanceof Error ? error.message : 'Unable to check delivery')
    } finally {
      setCheckingDelivery(false)
    }
  }

  const toggleAcc = (secId: string) => setSection((prev) => (prev === secId ? '' : secId))

  if (isLoading)
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: C.muted,
        }}
      >
        Loading…
      </div>
    )
  if (!p)
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: '0 24px',
        }}
      >
        <div style={{ fontSize: 48 }}>🌿</div>
        <div style={{ fontFamily: FONT.serif, fontSize: 22, color: C.muted }}>
          Product not found
        </div>
        <button
          onClick={() => router.push('/products')}
          style={{
            background: C.forest,
            color: 'white',
            border: 'none',
            borderRadius: 10,
            padding: '10px 24px',
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontWeight: 600,
          }}
        >
          Back to Shop
        </button>
      </div>
    )

  const compliance =
    PRODUCT_COMPLIANCE[p.id] ??
    (p.slug ? PRODUCT_COMPLIANCE[p.slug] : undefined) ??
    PRODUCT_COMPLIANCE[id] ??
    null
  const related = all.filter((r) => r.id !== p.id && r.category === p.category).slice(0, 4)
  const mrp = Math.round((p.price ?? 0) * 1.25)
  const discount = Math.round(((mrp - (p.price ?? 0)) / mrp) * 100)
  const loyalPts = Math.floor((p.price ?? 0) / 10)
  const catLabel = (p.category ?? 'Skincare').toUpperCase()
  const stockCount = typeof p.stock === 'number' ? p.stock : null
  const stockOut = stockCount === 0
  const maxQty = Math.min(stockCount ?? 10, 10)
  const stockTone =
    stockCount == null ? null : stockCount <= 0 ? 'out' : stockCount <= 5 ? 'low' : 'in'
  const amRoutine = buildRoutine(all, p, 'AM')
  const pmRoutine = buildRoutine(all, p, 'PM')
  const featuredRoutine = p.category === 'SPF' || p.category === 'Cleanser' ? amRoutine : pmRoutine
  const featuredBundle = uniqueProducts(featuredRoutine.products).filter(
    (product) => product.stock !== 0
  )
  const featuredBundleTotal = featuredBundle.reduce((sum, product) => sum + product.price, 0)

  const sectionPad = isMobile ? '20px 16px 48px' : '32px 24px 64px'
  const gridStyle: CSSProperties = isMobile
    ? { display: 'flex', flexDirection: 'column', gap: 0 }
    : { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }

  /* Applicable certs based on product badges */
  const prodCerts = CERTIFICATIONS.filter((c) => {
    if (c.label === 'Derma-Tested') return true
    if (c.label === 'Eco Packaging') return true
    return (p.badges ?? []).some((b: string) =>
      b.toLowerCase().includes(c.label.toLowerCase().split('-')[0] ?? '')
    )
  })

  return (
    <div className="min-h-screen bg-bg">
      {/* Breadcrumb */}
      <div className="overflow-x-hidden border-b border-border bg-bg">
        <div className="site-container">
          <nav
            aria-label="Breadcrumb"
            className="flex h-10 items-center gap-1 overflow-hidden text-xs text-muted"
          >
            <button
              onClick={() => router.push('/')}
              className="cursor-pointer border-none bg-transparent text-muted hover:text-text"
            >
              Home
            </button>
            <ChevronRight size={11} className="flex-shrink-0" />
            <button
              onClick={() => router.push('/products')}
              className="cursor-pointer border-none bg-transparent text-muted hover:text-text"
            >
              Shop
            </button>
            <ChevronRight size={11} className="flex-shrink-0" />
            <span className="min-w-0 truncate font-medium text-text">{p.name}</span>
          </nav>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: sectionPad }}>
        <button
          onClick={() => router.push('/products')}
          style={{
            background: 'none',
            border: 'none',
            color: C.muted,
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontFamily: 'inherit',
            fontWeight: 500,
            marginBottom: isMobile ? 16 : 28,
            padding: 0,
          }}
        >
          <ArrowLeft size={13} /> Back to Products
        </button>

        <div style={gridStyle}>
          {/* ── LEFT: image ─────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: isMobile ? 0 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45 }}
            style={isMobile ? {} : { position: 'sticky', top: 80 }}
          >
            <div
              style={{
                borderRadius: isMobile ? 16 : 24,
                overflow: 'hidden',
                aspectRatio: '1 / 1',
                width: '100%',
                position: 'relative',
                boxShadow: '0 8px 40px rgba(0,0,0,0.07)',
                marginBottom: isMobile ? 20 : 0,
              }}
            >
              <div style={{ position: 'absolute', inset: 0 }}>
                <ProductImage product={p} />
              </div>
            </div>

            {/* 11.10 PAO indicator below image */}
            {compliance.pao && (
              <div
                style={{
                  marginTop: 16,
                  padding: '12px 16px',
                  background: C.goldPale,
                  borderRadius: 12,
                  border: `1px solid ${C.border}`,
                }}
              >
                <PAOSymbol months={compliance.pao} />
                <p style={{ fontSize: 10, color: C.muted, marginTop: 8, lineHeight: 1.5 }}>
                  Store in a cool, dry place away from direct sunlight. Best before date printed on
                  packaging.
                </p>
              </div>
            )}

            {/* 11.4 Certification badges with external verification links */}
            <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {prodCerts.map((cert) =>
                cert.url ? (
                  <a
                    key={cert.label}
                    href={cert.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Verified by ${cert.org}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      padding: '5px 12px',
                      borderRadius: 99,
                      border: `1px solid ${C.border}`,
                      color: C.olive,
                      background: C.sagePale,
                      textDecoration: 'none',
                      textTransform: 'uppercase',
                    }}
                  >
                    {cert.emoji} {cert.label} ↗
                  </a>
                ) : (
                  <span
                    key={cert.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      padding: '5px 12px',
                      borderRadius: 99,
                      border: `1px solid ${C.border}`,
                      color: C.muted,
                      textTransform: 'uppercase',
                    }}
                  >
                    {cert.emoji} {cert.label}
                  </span>
                )
              )}
            </div>
          </motion.div>

          {/* ── RIGHT: info ─────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: isMobile ? 0 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: isMobile ? 0 : 0.08 }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.14em',
                color: C.gold,
                marginBottom: 10,
              }}
            >
              {catLabel} · 30ml
            </div>

            <h1
              style={{
                fontFamily: FONT.serif,
                fontSize: isMobile ? 'clamp(24px,7vw,34px)' : 'clamp(28px,3.5vw,42px)',
                fontWeight: 400,
                color: C.text,
                lineHeight: 1.15,
                marginBottom: 14,
                letterSpacing: '-0.01em',
              }}
            >
              {p.name}
            </h1>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
                flexWrap: 'wrap',
              }}
            >
              {initialReviewAggregate && initialReviewAggregate.count > 0 ? (
                <>
                  <Stars rating={initialReviewAggregate.average} size={14} />
                  <span style={{ fontSize: 13, color: C.muted }}>
                    {initialReviewAggregate.average.toFixed(1)} ({initialReviewAggregate.count}{' '}
                    approved review
                    {initialReviewAggregate.count === 1 ? '' : 's'})
                  </span>
                </>
              ) : (
                <span style={{ fontSize: 13, color: C.muted }}>No approved reviews yet</span>
              )}
            </div>

            <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.85, marginBottom: 20 }}>
              {p.description}
            </p>

            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}
            >
              <div style={infoCard}>
                <div style={infoLabel}>KEY INGREDIENT</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{p.ingredient}</div>
              </div>
              <div style={infoCard}>
                <div style={infoLabel}>IDEAL FOR</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {(p.skin_types ?? []).map((s: string) => (
                    <span
                      key={s}
                      style={{
                        background: C.sagePale,
                        color: C.forest,
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontWeight: 500,
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${C.border}`, marginBottom: 20 }} />

            <div style={{ marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontFamily: FONT.serif,
                    fontSize: isMobile ? 28 : 34,
                    fontWeight: 600,
                    color: C.text,
                  }}
                >
                  ₹{(p.price ?? 0).toLocaleString()}
                </span>
                <span style={{ fontSize: 14, color: C.light, textDecoration: 'line-through' }}>
                  ₹{mrp.toLocaleString()}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    background: C.gold,
                    color: 'white',
                    padding: '3px 10px',
                    borderRadius: 99,
                  }}
                >
                  {discount}% OFF
                </span>
              </div>
              <div style={{ marginTop: 4, fontSize: 12, color: C.muted }}>
                MRP inclusive of all taxes
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: C.gold,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  marginTop: 6,
                }}
              >
                <Award size={12} /> Earn {loyalPts} loyalty points with this purchase
              </div>
            </div>

            {/* Qty + Add to Cart + Wishlist + Share */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'stretch',
                marginTop: 20,
                marginBottom: 12,
              }}
            >
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
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  style={qtyBtn}
                  aria-label="Decrease quantity"
                  disabled={stockOut}
                >
                  <Minus size={13} />
                </button>
                <span
                  style={{
                    width: 28,
                    textAlign: 'center',
                    fontSize: 14,
                    fontWeight: 600,
                    color: C.text,
                  }}
                >
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  style={qtyBtn}
                  aria-label="Increase quantity"
                  disabled={stockOut || qty >= maxQty}
                >
                  <Plus size={13} />
                </button>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAdd}
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
                  background: stockOut ? C.light : added ? C.sage : C.forest,
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
                  ) : added ? (
                    <motion.span
                      key="done"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Check size={15} /> Added to cart!
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
                onClick={() => toggle(p.id, user?.id)}
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
                  fill={has(p.id) ? C.terra : 'none'}
                  color={has(p.id) ? C.terra : C.muted}
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
                onClick={() => navigator.share?.({ title: p.name, url: window.location.href })}
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

            <section className="product-conversion" aria-label="Purchase details">
              <div className="product-conversion__signals">
                {stockTone && (
                  <div
                    className={`product-conversion__signal product-conversion__signal--${stockTone}`}
                  >
                    <BadgeCheck size={15} />
                    <span>
                      {stockTone === 'out'
                        ? 'Out of stock'
                        : stockTone === 'low'
                          ? `Low stock: ${stockCount} left`
                          : 'In stock'}
                    </span>
                  </div>
                )}
                <div className="product-conversion__signal">
                  <WalletCards size={15} />
                  <span>Prepaid available</span>
                </div>
                <div className="product-conversion__signal">
                  <Banknote size={15} />
                  <span>COD up to ₹{COD_MAX_TOTAL.toLocaleString()}</span>
                </div>
                <Link href="/returns-refunds" className="product-conversion__signal">
                  <PackageCheck size={15} />
                  <span>14-day returns</span>
                </Link>
              </div>

              <div className="product-conversion__delivery">
                <div>
                  <p>Check delivery</p>
                  <span>ETA and COD status by PIN code</span>
                </div>
                <div className="product-conversion__delivery-form">
                  <label className="sr-only" htmlFor="delivery-pincode">
                    PIN code
                  </label>
                  <input
                    id="delivery-pincode"
                    value={deliveryPin}
                    onChange={(event) =>
                      setDeliveryPin(event.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    inputMode="numeric"
                    autoComplete="postal-code"
                    placeholder="Enter PIN code"
                  />
                  <button type="button" onClick={handleDeliveryCheck} disabled={checkingDelivery}>
                    {checkingDelivery ? 'Checking...' : 'Check'}
                  </button>
                </div>
                {deliveryError && (
                  <small className="product-conversion__error">{deliveryError}</small>
                )}
                {deliveryResult && (
                  <div className="product-conversion__delivery-result" aria-live="polite">
                    <strong>
                      <MapPin size={14} />
                      {deliveryResult.deliveryEstimate} after dispatch
                    </strong>
                    <span>
                      {deliveryResult.dispatchWindow}. {codCopy(deliveryResult.codDecision)}
                    </span>
                  </div>
                )}
              </div>

              <div className="product-conversion__payments" aria-label="Payment options">
                <span>
                  <Smartphone size={15} /> UPI
                </span>
                <span>
                  <CreditCard size={15} /> Cards
                </span>
                <span>
                  <WalletCards size={15} /> Wallets
                </span>
                <span>
                  <ShieldCheck size={15} /> Secure checkout
                </span>
              </div>

              <div className="product-conversion__aftercare">
                <strong>What happens after purchase</strong>
                <p>
                  Confirmation is sent immediately. Orders are usually dispatched within 1 business
                  day, then tracking is shared once the parcel is handed to the courier.
                </p>
              </div>

              <button type="button" className="product-conversion__cart-link" onClick={openCart}>
                <ShoppingBag size={15} /> Open mini cart
              </button>
            </section>

            {/* ── Accordions ─────────────────────────── */}
            <div style={{ borderTop: `1px solid ${C.border}` }}>
              {/* 11.2 INCI Ingredients */}
              <Accordion
                id="ingredients"
                label="Full Ingredients (INCI)"
                open={openSection === 'ingredients'}
                onToggle={() => toggleAcc('ingredients')}
              >
                <div style={{ paddingBottom: 20 }}>
                  {compliance.inci ? (
                    <>
                      <p
                        style={{ fontSize: 12, color: C.muted, lineHeight: 1.75, marginBottom: 10 }}
                      >
                        Listed in descending order of concentration (INCI standard):
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          color: C.text,
                          lineHeight: 1.8,
                          fontStyle: 'italic',
                          background: C.ivory,
                          borderRadius: 8,
                          padding: '10px 12px',
                        }}
                      >
                        {compliance.inci}
                      </p>
                    </>
                  ) : (
                    <p style={{ fontSize: 12, color: C.muted }}>
                      Full ingredient list available on product packaging.
                    </p>
                  )}
                  {compliance.freeFrom && (
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {compliance.freeFrom.map((f) => (
                        <span
                          key={f}
                          style={{
                            fontSize: 10,
                            padding: '3px 9px',
                            borderRadius: 99,
                            background: C.sagePale,
                            color: C.forest,
                            fontWeight: 600,
                          }}
                        >
                          ✓ {f}-Free
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Accordion>

              <Accordion
                id="commerce-disclosures"
                label="Product & Seller Details"
                open={openSection === 'commerce-disclosures'}
                onToggle={() => toggleAcc('commerce-disclosures')}
              >
                <dl className="product-compliance-list">
                  <div>
                    <dt>Country of origin</dt>
                    <dd>{compliance.countryOfOrigin}</dd>
                  </div>
                  <div>
                    <dt>Manufacturer</dt>
                    <dd>{compliance.manufacturer}</dd>
                  </div>
                  <div>
                    <dt>Packer</dt>
                    <dd>{compliance.packer}</dd>
                  </div>
                  <div>
                    <dt>Importer</dt>
                    <dd>{compliance.importer ?? 'Not applicable - manufactured in India'}</dd>
                  </div>
                  {compliance.cdSCoImportLicence && (
                    <div>
                      <dt>CDSCO import licence</dt>
                      <dd>{compliance.cdSCoImportLicence}</dd>
                    </div>
                  )}
                </dl>
              </Accordion>

              {/* 11.3 Allergen warnings */}
              <Accordion
                id="allergens"
                label="Allergen & Safety Info"
                open={openSection === 'allergens'}
                onToggle={() => toggleAcc('allergens')}
              >
                <div
                  style={{ paddingBottom: 20, display: 'flex', flexDirection: 'column', gap: 10 }}
                >
                  {compliance.allergens && (
                    <div
                      style={{
                        background: '#FFF8E7',
                        border: '1px solid #F0D68A',
                        borderRadius: 10,
                        padding: '12px 14px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#8B6914',
                          marginBottom: 5,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        <AlertTriangle size={12} /> Allergen Information
                      </div>
                      <p style={{ fontSize: 12, color: '#665200', lineHeight: 1.7 }}>
                        {compliance.allergens}
                      </p>
                    </div>
                  )}
                  {compliance.patchTest && (
                    <div
                      style={{
                        background: C.ivory,
                        borderRadius: 10,
                        padding: '12px 14px',
                        border: `1px solid ${C.border}`,
                      }}
                    >
                      <div
                        style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 4 }}
                      >
                        🧪 Patch Test Recommended
                      </div>
                      <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                        Apply a small amount to the inner forearm 24 hours before first full use.
                        Discontinue use if redness, itching, or irritation occurs. Consult a
                        dermatologist if you have reactive skin.
                      </p>
                    </div>
                  )}
                  {compliance.agingNote && (
                    <div
                      style={{
                        background: C.terraPale,
                        borderRadius: 10,
                        padding: '12px 14px',
                        border: `1px solid ${C.border}`,
                      }}
                    >
                      <div
                        style={{ fontSize: 11, fontWeight: 700, color: C.terra, marginBottom: 4 }}
                      >
                        ℹ️ Age Guidance
                      </div>
                      <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                        {compliance.agingNote}
                      </p>
                    </div>
                  )}
                  <div
                    style={{
                      background: C.ivory,
                      borderRadius: 10,
                      padding: '12px 14px',
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                      <strong>For external use only.</strong> Avoid contact with eyes. If contact
                      occurs, rinse thoroughly with water. Keep out of reach of children. Store in a
                      cool, dry place.
                    </p>
                  </div>
                </div>
              </Accordion>

              <Accordion
                id="how_to_use"
                label="How To Use"
                open={openSection === 'how_to_use'}
                onToggle={() => toggleAcc('how_to_use')}
              >
                <ol
                  style={{
                    paddingBottom: 20,
                    listStyle: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  {HOW_TO_USE.map((step, i) => (
                    <li
                      key={i}
                      style={{
                        display: 'flex',
                        gap: 12,
                        fontSize: 13,
                        color: C.muted,
                        alignItems: 'flex-start',
                      }}
                    >
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: C.sagePale,
                          color: C.forest,
                          fontSize: 10,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: 1,
                        }}
                      >
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </Accordion>

              <Accordion
                id="benefits"
                label="Key Benefits"
                open={openSection === 'benefits'}
                onToggle={() => toggleAcc('benefits')}
              >
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 20 }}
                >
                  {BENEFITS.map((b) => (
                    <div
                      key={b.title}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}
                    >
                      <span style={{ fontSize: 20, lineHeight: 1 }}>{b.icon}</span>
                      <div>
                        <div
                          style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}
                        >
                          {b.title}
                        </div>
                        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                          {b.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Accordion>
            </div>

            {/* 11.9 FTC Disclaimer */}
            <div
              style={{ marginTop: 20, padding: '12px 14px', borderTop: `1px solid ${C.border}` }}
            >
              <p style={{ fontSize: 10, color: C.light, lineHeight: 1.7, fontStyle: 'italic' }}>
                *These statements have not been evaluated by the Central Drugs Standard Control
                Organisation (CDSCO) or the Food and Drug Administration (FDA). This product is not
                intended to diagnose, treat, cure, or prevent any disease. Results may vary based on
                individual skin type and usage. Individual results are not guaranteed. For external
                use only. Discontinue use if irritation occurs and consult a dermatologist.
              </p>
            </div>
          </motion.div>
        </div>

        {/* You might also like */}
        {(amRoutine.products.length > 0 || pmRoutine.products.length > 0) && (
          <section className="ritual-recommendations" aria-label="Recommended routines">
            <div className="ritual-bundle">
              <div>
                <p>Recommended ritual bundle</p>
                <h2>{featuredRoutine.label}</h2>
                <span>{featuredRoutine.description}</span>
              </div>
              <div className="ritual-bundle__items">
                {featuredBundle.map((product) => (
                  <div key={product.id} className="ritual-bundle__item">
                    <ProductImage product={product} />
                    <span>{product.name}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                disabled={!featuredBundle.length}
                onClick={() => {
                  featuredBundle.forEach(addItem)
                  openCart()
                }}
              >
                Add {featuredRoutine.shortLabel} bundle · ₹{featuredBundleTotal.toLocaleString()}
              </button>
            </div>

            <div className="ritual-routine-grid">
              <RoutinePreview routine={amRoutine} />
              <RoutinePreview routine={pmRoutine} />
            </div>
          </section>
        )}

        {related.length > 0 && (
          <div
            style={{
              marginTop: isMobile ? 48 : 80,
              borderTop: `1px solid ${C.border}`,
              paddingTop: isMobile ? 32 : 48,
            }}
          >
            <h3
              style={{
                fontFamily: FONT.serif,
                fontSize: isMobile ? 24 : 30,
                fontWeight: 400,
                color: C.text,
                marginBottom: 24,
              }}
            >
              You might also like
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: isMobile ? 12 : 16,
              }}
            >
              {related.map((r) => (
                <ProductCard key={r.id} product={r} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Customer reviews */}
      <ReviewSection productId={p.id} initialReviews={initialReviews} />
    </div>
  )
}

const infoCard = { background: '#F2EAE0', borderRadius: 12, padding: '14px 16px' }
const infoLabel = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.12em',
  color: '#6B7A5E',
  marginBottom: 6,
  textTransform: 'uppercase',
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

type RoutineKind = 'AM' | 'PM'

interface Routine {
  label: string
  shortLabel: RoutineKind
  description: string
  products: Product[]
}

interface DeliveryEstimate {
  pincode: string
  dispatchWindow: string
  deliveryEstimate: string
  prepaidAvailable: boolean
  codDecision: 'allow' | 'manual_review' | 'block'
}

const ROUTINE_CATEGORIES: Record<RoutineKind, string[]> = {
  AM: ['Cleanser', 'Toner', 'Serum', 'SPF'],
  PM: ['Cleanser', 'Serum', 'Moisturiser'],
}

function uniqueProducts(products: Product[]) {
  return products.filter(
    (product, index, source) =>
      source.findIndex((candidate) => candidate.id === product.id) === index
  )
}

function overlapsSkinTypes(a?: string[], b?: string[]) {
  if (!a?.length || !b?.length) return false
  if (a.includes('All Types') || b.includes('All Types')) return true
  return a.some((skinType) => b.includes(skinType))
}

function pickRoutineProduct(products: Product[], current: Product, category: string) {
  if (current.category === category) return current
  return (
    products.find(
      (product) =>
        product.id !== current.id &&
        product.category === category &&
        product.stock !== 0 &&
        overlapsSkinTypes(product.skin_types, current.skin_types)
    ) ??
    products.find(
      (product) => product.id !== current.id && product.category === category && product.stock !== 0
    )
  )
}

function buildRoutine(products: Product[], current: Product, kind: RoutineKind): Routine {
  const routineProducts = ROUTINE_CATEGORIES[kind]
    .map((category) => pickRoutineProduct(products, current, category))
    .filter((product): product is Product => Boolean(product))

  return {
    label: kind === 'AM' ? 'Complete your AM routine' : 'Complete your PM routine',
    shortLabel: kind,
    description:
      kind === 'AM'
        ? 'Cleanse, treat, and protect before the day starts.'
        : 'Cleanse, replenish, and seal in overnight recovery.',
    products: uniqueProducts(routineProducts),
  }
}

function codCopy(decision: DeliveryEstimate['codDecision']) {
  if (decision === 'block') return 'COD is not available for this PIN code.'
  if (decision === 'manual_review') return 'COD may need manual review at checkout.'
  return 'COD is generally available after checkout verification.'
}

function RoutinePreview({ routine }: { routine: Routine }) {
  if (!routine.products.length) return null

  return (
    <article className="ritual-preview">
      <div>
        <p>{routine.label}</p>
        <span>{routine.description}</span>
      </div>
      <ul>
        {routine.products.map((product) => (
          <li key={product.id}>
            <ProductImage product={product} />
            <span>{product.name}</span>
          </li>
        ))}
      </ul>
    </article>
  )
}
