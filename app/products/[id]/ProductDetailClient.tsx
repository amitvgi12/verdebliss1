'use client'
/**
 * ProductDetail.jsx — By Nature–style product page
 *
 * Audit fixes applied (Section 11):
 *   11.2 — Full INCI ingredient list in descending concentration
 *   11.3 — Allergen warnings + patch test notice
 *   11.4 — Certification badges with external verification links
 *   11.9 — Product-level cosmetic-use disclaimer (India CDSCO scope only)
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
import { getProductCompliance } from '@/constants/productCompliance'
import { MAX_CART_ITEM_QTY } from '@/constants/cart'
import {
  PRICE_UNAVAILABLE_COPY,
  formatPriceValidUntil,
  getVerifiablePriceOffer,
  hasProductPrice,
} from '@/lib/pricing'
import { formatApprovedReviewCount } from '@/lib/review-copy'
import { getProductBadgeKeys, type ProductBadgeKey } from '@/lib/product-claims'
import type { ApprovedReview, ReviewAggregate } from '@/lib/products-server'
import type { Product } from '@/types'

import ProductAccordions from './_components/ProductAccordions'
import ProductMedia from './_components/ProductMedia'
import ProductPurchaseActions from './_components/ProductPurchaseActions'
import ProductPurchaseDetails, { type DeliveryEstimate } from './_components/ProductPurchaseDetails'
import RelatedProducts from './_components/RelatedProducts'
import RoutineRecommendations from './_components/RoutineRecommendations'

/* ── Positioning labels — not third-party certification claims ── */
interface Certification {
  label: string
  emoji: string
  url: string
  org: string
  status: string
  /** Stable claim keys (from lib/product-claims) that activate this row. */
  matchKeys: ProductBadgeKey[]
  /** Positioning rows shown on every PDP regardless of the product's claims. */
  alwaysShow?: boolean
}

const CERTIFICATIONS: Certification[] = [
  {
    label: 'No animal testing stance',
    emoji: '🐰',
    url: '/certifications',
    org: 'No animal testing is conducted or commissioned; third-party audit status is published in the Trust Centre',
    status: 'Audit underway',
    matchKeys: ['no-animal-testing'],
  },
  {
    label: 'Vegan-friendly formula',
    emoji: '🌱',
    url: '/certifications',
    org: 'Formula scope varies by SKU; evidence status is published in the Trust Centre',
    status: 'Evidence review',
    matchKeys: ['vegan'],
  },
  {
    label: 'Skin compatibility notes',
    emoji: '🏥',
    url: '/certifications',
    org: 'Internal skin-compatibility assessment is complete; independent evidence file is in review',
    status: 'Evidence file',
    matchKeys: [],
    alwaysShow: true,
  },
  {
    label: 'Packaging documentation',
    emoji: '♻️',
    url: '/certifications',
    org: 'Packaging material evidence and supplier documentation are being prepared for review',
    status: 'Evidence file',
    matchKeys: [],
    alwaysShow: true,
  },
]

export default function ProductDetailClient({
  id,
  initialProduct,
  initialReviews = [],
  initialReviewAggregate = null,
  sellerDetails,
}: {
  id: string
  initialProduct?: Product | null
  initialReviews?: ApprovedReview[]
  initialReviewAggregate?: ReviewAggregate | null
  /** Server-computed seller/manufacturer identity string, read fresh from
   *  process.env at ISR-render time.  Passed from the server page component
   *  so client bundle build-time constants cannot cause stale legal data. */
  sellerDetails?: string
}) {
  // id passed as prop
  const router = useRouter()
  const isMobile = useIsMobile()

  const shouldFetchProduct = !initialProduct || !hasProductPrice(initialProduct)
  const { product: serverProduct, loading } = useProduct(shouldFetchProduct ? id : undefined)
  const p = serverProduct ?? initialProduct
  const isLoading = !initialProduct && loading
  const { products: all } = useProducts({})
  const addItem = useCartStore((s) => s.addItem)
  const updateQty = useCartStore((s) => s.updateQty)
  const cartItem = useCartStore((s) => (p ? s.items.find((item) => item.id === p.id) : null))
  const openCart = useCartStore((s) => s.openCart)
  const { toggle, has } = useWishlistStore()
  const user = useAuthStore((s) => s.user)

  const [added, setAdded] = useState(false)
  const [openSection, setSection] = useState('benefits')
  const [deliveryPin, setDeliveryPin] = useState('')
  const [deliveryResult, setDeliveryResult] = useState<DeliveryEstimate | null>(null)
  const [deliveryError, setDeliveryError] = useState('')
  const [checkingDelivery, setCheckingDelivery] = useState(false)
  /* ── Dynamic SEO with Product JSON-LD ─── */

  const handleAdd = () => {
    if (!p) return
    if (stockOut || !hasProductPrice(p) || maxQty < 1) return
    addItem(p)
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

  const _baseCompliance = getProductCompliance(p, id)
  // Override manufacturer/packer with server-provided identity so ISR
  // revalidation (not a full rebuild) is enough to update legally-mandated data.
  const compliance = sellerDetails
    ? { ..._baseCompliance, manufacturer: sellerDetails, packer: sellerDetails }
    : _baseCompliance
  const related = all.filter((r) => r.id !== p.id && r.category === p.category).slice(0, 4)
  const priceOffer = getVerifiablePriceOffer(p)
  const priceAvailable = hasProductPrice(p)
  const mrp = priceOffer.mrp
  const discount = priceOffer.discountPercent
  const loyalPts = priceAvailable ? Math.floor(priceOffer.price / 20) : 0
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

  /* Applicable claim-status badges link to the Trust Centre without making certificate claims.
   * Match on stable claim keys (not display substrings) so a badge copy edit can't drop a row. */
  const badgeKeys = getProductBadgeKeys(p.badges)
  const prodCerts = CERTIFICATIONS.filter(
    (c) => c.alwaysShow || c.matchKeys.some((key) => badgeKeys.has(key))
  )

  return (
    <div className="min-h-screen bg-bg" data-testid="pdp-shell">
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
                color: C.goldText,
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
              {priceAvailable ? (
                <>
                  <div
                    style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}
                  >
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
                      <span
                        style={{ fontSize: 14, color: C.light, textDecoration: 'line-through' }}
                      >
                        MRP ₹{mrp.toLocaleString()}
                      </span>
                    )}
                    {discount !== null && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          background: C.goldText,
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
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span
                    style={{
                      width: 'fit-content',
                      fontSize: 13,
                      fontWeight: 700,
                      background: C.terraPale,
                      color: C.terra,
                      padding: '7px 12px',
                      borderRadius: 99,
                    }}
                  >
                    {PRICE_UNAVAILABLE_COPY}
                  </span>
                  <span style={{ fontSize: 12, color: C.muted }}>
                    We are refreshing live pricing before checkout.
                  </span>
                </div>
              )}
              {priceOffer.priceValidUntil && (
                <div style={{ marginTop: 4, fontSize: 12, color: C.muted }}>
                  Launch price valid until {formatPriceValidUntil(priceOffer.priceValidUntil)}.
                </div>
              )}
              {priceAvailable && (
                <div
                  style={{
                    fontSize: 12,
                    color: C.goldText,
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
                          color: C.goldText,
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
              )}
            </div>

            <ProductPurchaseActions
              productName={p.name}
              priceLabel={priceAvailable ? `₹${priceOffer.price.toLocaleString()}` : null}
              cartQty={cartItem?.qty ?? null}
              maxQty={maxQty}
              stockOut={stockOut}
              priceAvailable={priceAvailable}
              added={added}
              isWishlisted={has(p.id)}
              onAdd={handleAdd}
              onGoToCart={openCart}
              onDecreaseCartQty={() => updateQty(p.id, -1)}
              onIncreaseCartQty={() => updateQty(p.id, 1)}
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

            {/* 11.9 Cosmetic-use disclaimer — India only (CDSCO scope) */}
            <div
              style={{ marginTop: 20, padding: '12px 14px', borderTop: `1px solid ${C.border}` }}
            >
              <p style={{ fontSize: 10, color: C.muted, lineHeight: 1.7, fontStyle: 'italic' }}>
                Cosmetic product information is provided for routine selection only. This product is
                not intended to diagnose, treat, cure, or prevent any disease. Results vary by
                individual skin type and usage. For external use only. Discontinue use if irritation
                occurs and seek professional advice if symptoms persist.
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
  color: '#2D4A32',
  marginBottom: 6,
  textTransform: 'uppercase',
}
