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

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, ShoppingBag, Check, Award, ArrowLeft,
  ChevronRight, Plus, Minus, Share2, Truck, AlertTriangle,
} from 'lucide-react'
import Stars from '@/components/ui/Stars'
import ProductImage from '@/components/ui/ProductImage'
import ProductCard from '@/components/ui/ProductCard'
import { useProduct, useProducts } from '@/hooks/useProducts'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useAuthStore } from '@/store/authStore'
import { useWindowWidth, BP } from '@/hooks/useWindowWidth'
import { useSEO } from '@/hooks/useSEO'
import { C, FONT } from '@/constants/theme'
import { PRODUCT_COMPLIANCE } from '@/constants/productCompliance'

/* ── Per-ingredient INCI fallback ─────────────────────────────── */
const HOW_TO_USE = [
  'Cleanse and gently tone your face.',
  'Apply 3–4 drops to fingertips.',
  'Press gently into skin, avoiding the eye area.',
  'Follow with moisturiser and SPF in the morning.',
]

const BENEFITS = [
  { icon: '💧', title: 'Deep Hydration',  desc: 'Helps support skin\'s moisture retention for visibly plumper skin.' },
  { icon: '✨', title: 'Visible Radiance', desc: 'Skin appears brighter and more even-toned with regular use.' },
  { icon: '🛡️', title: 'Barrier Support', desc: 'Helps reinforce the appearance of a healthy skin barrier.' },
]

/* ── Certification data with external verification links ──────── */
const CERTIFICATIONS = [
  { label: 'Cruelty-Free', emoji: '🐰', url: 'https://www.leapingbunny.org/', org: 'Leaping Bunny' },
  { label: 'Vegan',        emoji: '🌱', url: 'https://www.peta.org/living/personal-care-fashion/beauty-without-bunnies/', org: 'PETA' },
  { label: 'Derma-Tested', emoji: '🏥', url: null, org: 'In-house Tested' },
  { label: 'Eco Packaging', emoji: '♻️', url: null, org: 'FSC-Certified Packaging' },
]

/* ── PAO symbol ───────────────────────────────────────────────── */
function PAOSymbol({ months }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg width="36" height="36" viewBox="0 0 36 36" aria-label={`Period After Opening: ${months} months`} role="img">
        <circle cx="18" cy="18" r="16" fill="none" stroke={C.muted} strokeWidth="1.5" />
        <text x="18" y="21" textAnchor="middle" fontSize="10" fill={C.text} fontWeight="600">{months}M</text>
        <path d="M12 7 L12 3 L24 3 L24 7" fill="none" stroke={C.muted} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>Period After Opening</div>
        <div style={{ fontSize: 11, color: C.muted }}>Use within {months} months of opening</div>
      </div>
    </div>
  )
}

/* ── Accordion ────────────────────────────────────────────────── */
function Accordion({ id, label, open, onToggle, children }) {
  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <button onClick={onToggle} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{label}</span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.18 }} style={{ fontSize: 22, color: C.muted, lineHeight: 1, display: 'block' }}>+</motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key={id} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }}>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function ProductDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const width    = useWindowWidth()
  const isMobile = width < BP.tablet

  const { product: p, loading } = useProduct(id)
  const { products: all }       = useProducts({})
  const addItem    = useCartStore((s) => s.addItem)
  const { toggle, has } = useWishlistStore()
  const user       = useAuthStore((s) => s.user)

  const [added, setAdded]         = useState(false)
  const [qty, setQty]             = useState(1)
  const [openSection, setSection] = useState('ingredients')

  /* ── Dynamic SEO with Product JSON-LD ─── */
  useSEO(
    p ? {
      title: `${p.name} — VerdeBliss`,
      description: `${p.description} Shop ${p.name} at VerdeBliss. Free shipping above ₹499.`,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: p.name,
        description: p.description,
        image: `https://www.verdebliss.com/images/products/${p.ingredient?.toLowerCase().replace(' ', '-') || 'serum'}.webp`,
        brand: { '@type': 'Brand', name: 'VerdeBliss' },
        offers: {
          '@type': 'Offer', price: p.price, priceCurrency: 'INR',
          availability: 'https://schema.org/InStock',
          url: `https://www.verdebliss.com/products/${id}`,
        },
        aggregateRating: p.rating
          ? { '@type': 'AggregateRating', ratingValue: p.rating, reviewCount: p.review_count ?? 1 }
          : undefined,
      },
    } : { title: 'Product | VerdeBliss' }
  )

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) addItem(p)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const toggleAcc = (secId) => setSection((prev) => (prev === secId ? '' : secId))

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>Loading…</div>
  )
  if (!p) return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '0 24px' }}>
      <div style={{ fontSize: 48 }}>🌿</div>
      <div style={{ fontFamily: FONT.serif, fontSize: 22, color: C.muted }}>Product not found</div>
      <button onClick={() => navigate('/products')} style={{ background: C.forest, color: 'white', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Back to Shop</button>
    </div>
  )

  const compliance = PRODUCT_COMPLIANCE[id] ?? {}
  const related    = all.filter((r) => r.id !== p.id && r.category === p.category).slice(0, 4)
  const mrp        = Math.round((p.price ?? 0) * 1.25)
  const discount   = Math.round(((mrp - (p.price ?? 0)) / mrp) * 100)
  const loyalPts   = Math.floor((p.price ?? 0) / 10)
  const catLabel   = (p.category ?? 'Skincare').toUpperCase()

  const outerPad   = isMobile ? '0 16px' : '0 24px'
  const sectionPad = isMobile ? '20px 16px 48px' : '32px 24px 64px'
  const gridStyle  = isMobile
    ? { display: 'flex', flexDirection: 'column', gap: 0 }
    : { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }

  /* Applicable certs based on product badges */
  const prodCerts = CERTIFICATIONS.filter((c) => {
    if (c.label === 'Derma-Tested') return true
    if (c.label === 'Eco Packaging') return true
    return (p.badges ?? []).some((b) => b.toLowerCase().includes(c.label.toLowerCase().split('-')[0]))
  })

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>

      {/* Breadcrumb */}
      <div style={{ borderBottom: `1px solid ${C.border}`, background: C.bg, overflowX: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: outerPad }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 40, fontSize: 12, color: C.muted, overflow: 'hidden' }}>
            <button onClick={() => navigate('/')} style={crumbBtn}>Home</button>
            <ChevronRight size={11} style={{ flexShrink: 0 }} />
            <button onClick={() => navigate('/products')} style={crumbBtn}>Shop</button>
            <ChevronRight size={11} style={{ flexShrink: 0 }} />
            <span style={{ color: C.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{p.name}</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: sectionPad }}>
        <button onClick={() => navigate('/products')} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit', fontWeight: 500, marginBottom: isMobile ? 16 : 28, padding: 0 }}>
          <ArrowLeft size={13} /> Back to Products
        </button>

        <div style={gridStyle}>

          {/* ── LEFT: image ─────────────────────────────── */}
          <motion.div initial={{ opacity: 0, x: isMobile ? 0 : -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45 }}
            style={isMobile ? {} : { position: 'sticky', top: 80 }}>

            <div style={{ borderRadius: isMobile ? 16 : 24, overflow: 'hidden', aspectRatio: '1 / 1', width: '100%', position: 'relative', boxShadow: '0 8px 40px rgba(0,0,0,0.07)', marginBottom: isMobile ? 20 : 0 }}>
              <div style={{ position: 'absolute', inset: 0 }}>
                <ProductImage product={p} />
              </div>
            </div>

            {/* 11.10 PAO indicator below image */}
            {compliance.pao && (
              <div style={{ marginTop: 16, padding: '12px 16px', background: C.goldPale, borderRadius: 12, border: `1px solid ${C.border}` }}>
                <PAOSymbol months={compliance.pao} />
                <p style={{ fontSize: 10, color: C.muted, marginTop: 8, lineHeight: 1.5 }}>
                  Store in a cool, dry place away from direct sunlight. Best before date printed on packaging.
                </p>
              </div>
            )}

            {/* 11.4 Certification badges with external verification links */}
            <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {prodCerts.map((cert) => (
                cert.url ? (
                  <a key={cert.label} href={cert.url} target="_blank" rel="noopener noreferrer"
                    title={`Verified by ${cert.org}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', padding: '5px 12px', borderRadius: 99, border: `1px solid ${C.border}`, color: C.olive, background: C.sagePale, textDecoration: 'none', textTransform: 'uppercase' }}>
                    {cert.emoji} {cert.label} ↗
                  </a>
                ) : (
                  <span key={cert.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', padding: '5px 12px', borderRadius: 99, border: `1px solid ${C.border}`, color: C.muted, textTransform: 'uppercase' }}>
                    {cert.emoji} {cert.label}
                  </span>
                )
              ))}
            </div>
          </motion.div>

          {/* ── RIGHT: info ─────────────────────────────── */}
          <motion.div initial={{ opacity: 0, x: isMobile ? 0 : 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: isMobile ? 0 : 0.08 }}>

            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: C.gold, marginBottom: 10 }}>{catLabel} · 30ml</div>

            <h1 style={{ fontFamily: FONT.serif, fontSize: isMobile ? 'clamp(24px,7vw,34px)' : 'clamp(28px,3.5vw,42px)', fontWeight: 400, color: C.text, lineHeight: 1.15, marginBottom: 14, letterSpacing: '-0.01em' }}>
              {p.name}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <Stars rating={p.rating} size={14} />
              <span style={{ fontSize: 13, color: C.muted }}>{p.rating?.toFixed(1)} ({p.review_count} verified reviews)</span>
            </div>

            <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.85, marginBottom: 20 }}>{p.description}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              <div style={infoCard}>
                <div style={infoLabel}>KEY INGREDIENT</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{p.ingredient}</div>
              </div>
              <div style={infoCard}>
                <div style={infoLabel}>IDEAL FOR</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {(p.skin_types ?? []).map((s) => (
                    <span key={s} style={{ background: C.sagePale, color: C.forest, fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 500 }}>{s}</span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${C.border}`, marginBottom: 20 }} />

            <div style={{ marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: FONT.serif, fontSize: isMobile ? 28 : 34, fontWeight: 600, color: C.text }}>₹{(p.price ?? 0).toLocaleString()}</span>
                <span style={{ fontSize: 14, color: C.light, textDecoration: 'line-through' }}>₹{mrp.toLocaleString()}</span>
                <span style={{ fontSize: 11, fontWeight: 700, background: C.gold, color: 'white', padding: '3px 10px', borderRadius: 99 }}>{discount}% OFF</span>
              </div>
              <div style={{ fontSize: 12, color: C.gold, display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                <Award size={12} /> Earn {loyalPts} loyalty points with this purchase
              </div>
            </div>

            {/* Qty + Add to Cart + Wishlist + Share */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'stretch', marginTop: 20, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={qtyBtn} aria-label="Decrease quantity"><Minus size={13} /></button>
                <span style={{ width: 28, textAlign: 'center', fontSize: 14, fontWeight: 600, color: C.text }}>{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} style={qtyBtn} aria-label="Increase quantity"><Plus size={13} /></button>
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={handleAdd}
                style={{ flex: 1, minWidth: 0, height: 52, borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, whiteSpace: 'nowrap', background: added ? C.sage : C.forest, color: 'white', transition: 'background 0.25s' }}>
                <AnimatePresence mode="wait" initial={false}>
                  {added
                    ? <motion.span key="done" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Check size={15} /> Added to cart!</motion.span>
                    : <motion.span key="add" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ShoppingBag size={15} /> Add to Cart</motion.span>
                  }
                </AnimatePresence>
              </motion.button>

              <motion.button whileTap={{ scale: 0.93 }} onClick={() => toggle(p.id, user?.id)} aria-label="Save to wishlist"
                style={{ width: 52, height: 52, borderRadius: 12, cursor: 'pointer', border: `1px solid ${C.border}`, background: C.ivory, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Heart size={18} fill={has(p.id) ? C.terra : 'none'} color={has(p.id) ? C.terra : C.muted} />
              </motion.button>

              <motion.button whileTap={{ scale: 0.93 }} aria-label="Share product"
                style={{ width: 52, height: 52, borderRadius: 12, cursor: 'pointer', border: `1px solid ${C.border}`, background: C.ivory, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => navigator.share?.({ title: p.name, url: window.location.href })}>
                <Share2 size={16} color={C.muted} />
              </motion.button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.goldPale, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: C.olive, marginBottom: 24, fontWeight: 500 }}>
              <Truck size={13} />
              Free shipping on orders above ₹499 · Ships in 2–3 business days
            </div>

            {/* ── Accordions ─────────────────────────── */}
            <div style={{ borderTop: `1px solid ${C.border}` }}>

              {/* 11.2 INCI Ingredients */}
              <Accordion id="ingredients" label="Full Ingredients (INCI)" open={openSection === 'ingredients'} onToggle={() => toggleAcc('ingredients')}>
                <div style={{ paddingBottom: 20 }}>
                  {compliance.inci ? (
                    <>
                      <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.75, marginBottom: 10 }}>
                        Listed in descending order of concentration (INCI standard):
                      </p>
                      <p style={{ fontSize: 12, color: C.text, lineHeight: 1.8, fontStyle: 'italic', background: C.ivory, borderRadius: 8, padding: '10px 12px' }}>
                        {compliance.inci}
                      </p>
                    </>
                  ) : (
                    <p style={{ fontSize: 12, color: C.muted }}>Full ingredient list available on product packaging.</p>
                  )}
                  {compliance.freeFrom && (
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {compliance.freeFrom.map((f) => (
                        <span key={f} style={{ fontSize: 10, padding: '3px 9px', borderRadius: 99, background: C.sagePale, color: C.forest, fontWeight: 600 }}>✓ {f}-Free</span>
                      ))}
                    </div>
                  )}
                </div>
              </Accordion>

              {/* 11.3 Allergen warnings */}
              <Accordion id="allergens" label="Allergen & Safety Info" open={openSection === 'allergens'} onToggle={() => toggleAcc('allergens')}>
                <div style={{ paddingBottom: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {compliance.allergens && (
                    <div style={{ background: '#FFF8E7', border: '1px solid #F0D68A', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#8B6914', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <AlertTriangle size={12} /> Allergen Information
                      </div>
                      <p style={{ fontSize: 12, color: '#665200', lineHeight: 1.7 }}>{compliance.allergens}</p>
                    </div>
                  )}
                  {compliance.patchTest && (
                    <div style={{ background: C.ivory, borderRadius: 10, padding: '12px 14px', border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 4 }}>🧪 Patch Test Recommended</div>
                      <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                        Apply a small amount to the inner forearm 24 hours before first full use.
                        Discontinue use if redness, itching, or irritation occurs. Consult a dermatologist if you have reactive skin.
                      </p>
                    </div>
                  )}
                  {compliance.agingNote && (
                    <div style={{ background: C.terraPale, borderRadius: 10, padding: '12px 14px', border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.terra, marginBottom: 4 }}>ℹ️ Age Guidance</div>
                      <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>{compliance.agingNote}</p>
                    </div>
                  )}
                  <div style={{ background: C.ivory, borderRadius: 10, padding: '12px 14px', border: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                      <strong>For external use only.</strong> Avoid contact with eyes. If contact occurs, rinse thoroughly with water.
                      Keep out of reach of children. Store in a cool, dry place.
                    </p>
                  </div>
                </div>
              </Accordion>

              <Accordion id="how_to_use" label="How To Use" open={openSection === 'how_to_use'} onToggle={() => toggleAcc('how_to_use')}>
                <ol style={{ paddingBottom: 20, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {HOW_TO_USE.map((step, i) => (
                    <li key={i} style={{ display: 'flex', gap: 12, fontSize: 13, color: C.muted, alignItems: 'flex-start' }}>
                      <span style={{ width: 22, height: 22, borderRadius: '50%', background: C.sagePale, color: C.forest, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </Accordion>

              <Accordion id="benefits" label="Key Benefits" open={openSection === 'benefits'} onToggle={() => toggleAcc('benefits')}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 20 }}>
                  {BENEFITS.map((b) => (
                    <div key={b.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <span style={{ fontSize: 20, lineHeight: 1 }}>{b.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>{b.title}</div>
                        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>{b.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Accordion>
            </div>

            {/* 11.9 FTC Disclaimer */}
            <div style={{ marginTop: 20, padding: '12px 14px', borderTop: `1px solid ${C.border}` }}>
              <p style={{ fontSize: 10, color: C.light, lineHeight: 1.7, fontStyle: 'italic' }}>
                *These statements have not been evaluated by the Central Drugs Standard Control Organisation (CDSCO) or the Food and Drug Administration (FDA).
                This product is not intended to diagnose, treat, cure, or prevent any disease. Results may vary based on individual skin type and usage.
                Individual results are not guaranteed. For external use only. Discontinue use if irritation occurs and consult a dermatologist.
              </p>
            </div>
          </motion.div>
        </div>

        {/* You might also like */}
        {related.length > 0 && (
          <div style={{ marginTop: isMobile ? 48 : 80, borderTop: `1px solid ${C.border}`, paddingTop: isMobile ? 32 : 48 }}>
            <h3 style={{ fontFamily: FONT.serif, fontSize: isMobile ? 24 : 30, fontWeight: 400, color: C.text, marginBottom: 24 }}>You might also like</h3>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: isMobile ? 12 : 16 }}>
              {related.map((r) => <ProductCard key={r.id} product={r} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const crumbBtn = { background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, color: '#6B7A5E', padding: 0, fontWeight: 400, flexShrink: 0 }
const infoCard = { background: '#F2EAE0', borderRadius: 12, padding: '14px 16px' }
const infoLabel = { fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: '#6B7A5E', marginBottom: 6, textTransform: 'uppercase' }
const qtyBtn = { background: 'none', border: 'none', cursor: 'pointer', width: 40, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1C221E' }
