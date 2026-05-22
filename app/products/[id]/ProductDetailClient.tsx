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
import { motion } from 'framer-motion'
import { Award, ArrowLeft, ChevronRight } from 'lucide-react'
import Stars from '@/components/ui/Stars'
import { useProduct, useProducts } from '@/hooks/useProducts'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useAuthStore } from '@/store/authStore'
import { useIsMobile } from '@/hooks/useIsMobile'
import ReviewSection from '@/components/features/reviews/ReviewSection'
import { C, FONT } from '@/constants/theme'
import { PRODUCT_COMPLIANCE } from '@/constants/productCompliance'
import { MAX_CART_ITEM_QTY } from '@/constants/cart'
import { formatPriceValidUntil, getVerifiablePriceOffer } from '@/lib/pricing'
import { formatApprovedReviewCount } from '@/lib/review-copy'
import type { ApprovedReview, ReviewAggregate } from '@/lib/products-server'
import type { Product } from '@/types'

import ProductAccordions from './_components/ProductAccordions'
import ProductMedia from './_components/ProductMedia'
import ProductPurchaseActions from './_components/ProductPurchaseActions'
import ProductPurchaseDetails, { type DeliveryEstimate } from './_components/ProductPurchaseDetails'
import RelatedProducts from './_components/RelatedProducts'
import RoutineRecommendations from './_components/RoutineRecommendations'

/* ── Positioning labels — not third-party certification claims ── */
const CERTIFICATIONS = [
  {
    label: 'Cruelty-free*',
    emoji: '🐰',
    url: '/certifications',
    org: 'No animal testing; certification in progress',
  },
  {
    label: 'Vegan-Friendly',
    emoji: '🌱',
    url: '/certifications',
    org: 'Where formulation permits; certification in progress',
  },
  {
    label: 'Skin-Tested',
    emoji: '🏥',
    url: '/certifications',
    org: 'Internal testing; independent review pending',
  },
  {
    label: 'Recyclable Packaging',
    emoji: '♻️',
    url: '/certifications',
    org: 'Packaging documentation in progress',
  },
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
  const priceOffer = getVerifiablePriceOffer(p)
  const mrp = priceOffer.mrp
  const discount = priceOffer.discountPercent
  const loyalPts = Math.floor((p.price ?? 0) / 10)
  const catLabel = (p.category ?? 'Skincare').toUpperCase()
  const stockCount = typeof p.stock === 'number' ? p.stock : null
  const stockOut = stockCount === 0
  const maxQty = Math.min(stockCount ?? MAX_CART_ITEM_QTY, MAX_CART_ITEM_QTY)
  const stockTone =
    stockCount == null ? null : stockCount <= 0 ? 'out' : stockCount <= 5 ? 'low' : 'in'

  const sectionPad = isMobile ? '20px 16px 48px' : '32px 24px 64px'
  const gridStyle: CSSProperties = isMobile
    ? { display: 'flex', flexDirection: 'column', gap: 0 }
    : { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }

  /* Applicable certs — Skin-Tested and Recyclable Packaging show on all products */
  const prodCerts = CERTIFICATIONS.filter((c) => {
    if (c.label === 'Skin-Tested') return true
    if (c.label === 'Recyclable Packaging') return true
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
          <ProductMedia
            product={p}
            isMobile={isMobile}
            paoMonths={compliance.pao}
            certifications={prodCerts}
          />

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
                    {initialReviewAggregate.average.toFixed(1)} ·{' '}
                    {formatApprovedReviewCount(initialReviewAggregate.count)}
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
                  ₹{priceOffer.price.toLocaleString()}
                </span>
                {mrp !== null && (
                  <span style={{ fontSize: 14, color: C.light, textDecoration: 'line-through' }}>
                    MRP ₹{mrp.toLocaleString()}
                  </span>
                )}
                {discount !== null && (
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
                )}
              </div>
              <div style={{ marginTop: 4, fontSize: 12, color: C.muted }}>
                MRP inclusive of all taxes
              </div>
              {priceOffer.priceValidUntil && (
                <div style={{ marginTop: 4, fontSize: 12, color: C.muted }}>
                  Launch price valid until {formatPriceValidUntil(priceOffer.priceValidUntil)}.
                </div>
              )}
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
                <Award size={12} />
                {user ? (
                  <span>Earn {loyalPts} loyalty points with this purchase</span>
                ) : (
                  <span>
                    <Link
                      href="/account"
                      style={{
                        color: C.gold,
                        fontWeight: 600,
                        textDecoration: 'underline',
                        textUnderlineOffset: '2px',
                      }}
                    >
                      Sign in
                    </Link>{' '}
                    to earn {loyalPts} loyalty points with this purchase
                  </span>
                )}
              </div>
            </div>

            <ProductPurchaseActions
              productName={p.name}
              qty={qty}
              setQty={setQty}
              maxQty={maxQty}
              stockOut={stockOut}
              added={added}
              isWishlisted={has(p.id)}
              onAdd={handleAdd}
              onWishlist={() => toggle(p.id, user?.id)}
            />

            <ProductPurchaseDetails
              stockTone={stockTone}
              stockCount={stockCount}
              deliveryPin={deliveryPin}
              deliveryError={deliveryError}
              deliveryResult={deliveryResult}
              checkingDelivery={checkingDelivery}
              onDeliveryPinChange={setDeliveryPin}
              onDeliveryCheck={handleDeliveryCheck}
              onOpenCart={openCart}
            />

            <ProductAccordions
              compliance={compliance}
              openSection={openSection}
              onToggle={toggleAcc}
            />

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

        <RoutineRecommendations
          products={all}
          current={p}
          onAddItem={addItem}
          onOpenCart={openCart}
        />

        <RelatedProducts products={related} isMobile={isMobile} />
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
