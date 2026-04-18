/**
 * ProductDetail.jsx — Mobile-first responsive product page
 *
 * Mobile  (<768px): single column — image full-width on top, info below
 * Desktop (≥768px): 2-col sticky layout
 *
 * Issues fixed:
 *  1. Hard-coded `gridTemplateColumns: '1fr 1fr'` caused content to bleed
 *     off the right edge and compressed the image to ~150px on mobile.
 *  2. `position: sticky` on the image panel caused layout issues on mobile.
 *  3. `gap: 64` was too large for a narrow viewport.
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, ShoppingBag, Check, Award, ArrowLeft,
  ChevronRight, Plus, Minus, Share2, Truck,
} from 'lucide-react'
import Stars from '@/components/ui/Stars'
import ProductImage from '@/components/ui/ProductImage'
import ProductCard from '@/components/ui/ProductCard'
import { useProduct, useProducts } from '@/hooks/useProducts'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useAuthStore } from '@/store/authStore'
import { useWindowWidth, BP } from '@/hooks/useWindowWidth'
import { C, FONT } from '@/constants/theme'

/* ─── Per-ingredient content ──────────────────────── */
const INGREDIENT_TAGS = {
  'Bakuchiol':   ['Bakuchiol Extract', 'Jojoba Oil', 'Vitamin E', 'Hyaluronic Acid'],
  'Rose Hip':    ['Rosehip Oil', 'Ceramides', 'Niacinamide', 'Vitamin C'],
  'Green Tea':   ['Green Tea Extract', 'Salicylic Acid', 'Witch Hazel', 'Aloe Vera'],
  'Turmeric':    ['Turmeric Extract', 'Neem Leaf', 'Salicylic Acid', 'Aloe Vera'],
  'Zinc Oxide':  ['Zinc Oxide 20%', 'Aloe Vera', 'Vitamin E', 'Shea Butter'],
  'Acai Berry':  ['Açaí Berry', 'Shea Butter', 'Vitamin E', 'Coconut Oil'],
  'Niacinamide': ['Niacinamide 10%', 'Zinc PCA', 'Hyaluronic Acid', 'Aloe Vera'],
  'Shea Butter': ['Shea Butter', 'Vitamin E', 'Bakuchiol', 'Squalane'],
}

const HOW_TO_USE = [
  'Cleanse and gently tone your face.',
  'Apply 3–4 drops to fingertips.',
  'Press gently into skin, avoiding the eye area.',
  'Follow with moisturiser and SPF in the morning.',
]

const BENEFITS = [
  { icon: '💧', title: 'Deep Hydration', desc: 'Clinically proven moisture lock for 72 hours.' },
  { icon: '✨', title: 'Visible Radiance', desc: 'Brighter, more even-toned skin in 14 days.' },
  { icon: '🛡️', title: 'Barrier Support', desc: "Reinforces the skin's natural protective barrier." },
]

/* ─── Accordion ───────────────────────────────────── */
function Accordion({ id, label, open, onToggle, children }) {
  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '16px 0',
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'inherit', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{label}</span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.18 }}
          style={{ fontSize: 22, color: C.muted, lineHeight: 1, display: 'block' }}
        >
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key={id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Main ────────────────────────────────────────── */
export default function ProductDetail() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const width      = useWindowWidth()
  const isMobile   = width < BP.tablet

  const { product: p, loading } = useProduct(id)
  const { products: all }       = useProducts({})
  const addItem    = useCartStore((s) => s.addItem)
  const { toggle, has } = useWishlistStore()
  const user       = useAuthStore((s) => s.user)

  const [added, setAdded]         = useState(false)
  const [qty, setQty]             = useState(1)
  const [openSection, setSection] = useState('ingredients')

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) addItem(p)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const toggleAcc = (id) => setSection((prev) => (prev === id ? '' : id))

  /* ─── States ──────────────────────────────────── */
  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
      Loading…
    </div>
  )

  if (!p) return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '0 24px' }}>
      <div style={{ fontSize: 48 }}>🌿</div>
      <div style={{ fontFamily: FONT.serif, fontSize: 22, color: C.muted }}>Product not found</div>
      <button onClick={() => navigate('/products')}
        style={{ background: C.forest, color: 'white', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
        Back to Shop
      </button>
    </div>
  )

  const related  = all.filter((r) => r.id !== p.id && r.category === p.category).slice(0, 4)
  const tags     = INGREDIENT_TAGS[p.ingredient] ?? [p.ingredient, 'Natural Botanicals', 'Aloe Vera', 'Vitamin E']
  const mrp      = Math.round((p.price ?? 0) * 1.25)
  const discount = Math.round(((mrp - (p.price ?? 0)) / mrp) * 100)
  const loyalPts = Math.floor((p.price ?? 0) / 10)
  const catLabel = (p.category ?? 'Skincare').toUpperCase()

  /* ─── Responsive values ─────────────────────── */
  const outerPad    = isMobile ? '0 16px' : '0 24px'
  const sectionPad  = isMobile ? '20px 16px 48px' : '32px 24px 64px'
  const gridStyle   = isMobile
    ? { display: 'flex', flexDirection: 'column', gap: 0 }
    : { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>

      {/* ── Breadcrumb ───────────────────────────── */}
      <div style={{ borderBottom: `1px solid ${C.border}`, background: C.bg, overflowX: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: outerPad }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 40, fontSize: 12, color: C.muted, flexWrap: 'nowrap', overflow: 'hidden' }}>
            <button onClick={() => navigate('/')} style={crumbBtn}>Home</button>
            <ChevronRight size={11} style={{ flexShrink: 0 }} />
            <button onClick={() => navigate('/products')} style={crumbBtn}>Shop</button>
            <ChevronRight size={11} style={{ flexShrink: 0 }} />
            <span style={{ color: C.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
              {p.name}
            </span>
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: sectionPad }}>

        {/* Back link */}
        <button onClick={() => navigate('/products')}
          style={{ background: 'none', border: 'none', color: C.muted, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit', fontWeight: 500, marginBottom: isMobile ? 16 : 28, padding: 0 }}>
          <ArrowLeft size={13} /> Back to Products
        </button>

        {/* ── Responsive 1-col (mobile) / 2-col (desktop) grid ── */}
        <div style={gridStyle}>

          {/* ── Image panel ────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: isMobile ? 0 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45 }}
            /* Sticky only on desktop — mobile stacks vertically */
            style={isMobile ? {} : { position: 'sticky', top: 80 }}
          >
            {/*
             * Mobile: full-width square — no tiny corner image.
             * Desktop: same full-width square in the left column.
             */}
            <div style={{
              borderRadius: isMobile ? 16 : 24,
              overflow: 'hidden',
              aspectRatio: '1 / 1',
              width: '100%',
              position: 'relative',
              boxShadow: '0 8px 40px rgba(0,0,0,0.07)',
              /* Bottom margin on mobile to space from info below */
              marginBottom: isMobile ? 20 : 0,
            }}>
              <div style={{ position: 'absolute', inset: 0 }}>
                <ProductImage product={p} />
              </div>
            </div>

            {/* Trust badge pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: isMobile ? 0 : 16, marginBottom: isMobile ? 20 : 0 }}>
              {(p.badges ?? []).map((b) => (
                <span key={b} style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                  padding: '4px 12px', borderRadius: 99,
                  border: `1px solid ${C.border}`, color: C.muted,
                  textTransform: 'uppercase',
                }}>{b}</span>
              ))}
            </div>
          </motion.div>

          {/* ── Info panel ─────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: isMobile ? 0 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: isMobile ? 0 : 0.08 }}
          >
            {/* Category */}
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: C.gold, marginBottom: 10 }}>
              {catLabel} · 30ml
            </div>

            {/* Name */}
            <h1 style={{
              fontFamily: FONT.serif,
              fontSize: isMobile ? 'clamp(24px,7vw,34px)' : 'clamp(28px,3.5vw,42px)',
              fontWeight: 400, color: C.text,
              lineHeight: 1.15, marginBottom: 14, letterSpacing: '-0.01em',
            }}>
              {p.name}
            </h1>

            {/* Stars */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <Stars rating={p.rating} size={14} />
              <span style={{ fontSize: 13, color: C.muted }}>
                {p.rating?.toFixed(1)} ({p.review_count} verified reviews)
              </span>
            </div>

            {/* Description */}
            <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.85, marginBottom: 20 }}>
              {p.description}
            </p>

            {/* Key info cards */}
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

            {/* Price */}
            <div style={{ marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: FONT.serif, fontSize: isMobile ? 28 : 34, fontWeight: 600, color: C.text }}>
                  ₹{(p.price ?? 0).toLocaleString()}
                </span>
                <span style={{ fontSize: 14, color: C.light, textDecoration: 'line-through' }}>
                  ₹{mrp.toLocaleString()}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, background: C.forest, color: 'white', padding: '3px 10px', borderRadius: 99 }}>
                  {discount}% OFF
                </span>
              </div>
              <div style={{ fontSize: 12, color: C.sage, display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                <Award size={12} /> Earn {loyalPts} loyalty points with this purchase
              </div>
            </div>

            {/* Qty + Add to Cart + Wishlist + Share */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'stretch', marginTop: 20, marginBottom: 12 }}>
              {/* Qty selector */}
              <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={qtyBtn} aria-label="Decrease">
                  <Minus size={13} />
                </button>
                <span style={{ width: 28, textAlign: 'center', fontSize: 14, fontWeight: 600, color: C.text }}>{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} style={qtyBtn} aria-label="Increase">
                  <Plus size={13} />
                </button>
              </div>

              {/* Add to Cart — flex:1 so it fills available width */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAdd}
                style={{
                  flex: 1,
                  minWidth: 0,          /* prevent text from forcing width */
                  height: 52,
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 14,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap', /* "Add to Cart" stays on one line */
                  background: added ? C.sage : C.forest,
                  color: 'white',
                  transition: 'background 0.25s',
                }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {added ? (
                    <motion.span key="done" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Check size={15} /> Added!
                    </motion.span>
                  ) : (
                    <motion.span key="add" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ShoppingBag size={15} /> Add to Cart
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Wishlist */}
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => toggle(p.id, user?.id)}
                aria-label="Save to wishlist"
                style={{ width: 52, height: 52, borderRadius: 12, cursor: 'pointer', border: `1px solid ${C.border}`, background: 'white', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Heart size={18} fill={has(p.id) ? C.terra : 'none'} color={has(p.id) ? C.terra : C.muted} />
              </motion.button>

              {/* Share */}
              <motion.button
                whileTap={{ scale: 0.93 }}
                aria-label="Share product"
                style={{ width: 52, height: 52, borderRadius: 12, cursor: 'pointer', border: `1px solid ${C.border}`, background: 'white', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => navigator.share?.({ title: p.name, url: window.location.href })}
              >
                <Share2 size={16} color={C.muted} />
              </motion.button>
            </div>

            {/* Delivery */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.sagePale, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: C.forest, marginBottom: 24, fontWeight: 500 }}>
              <Truck size={13} />
              Free shipping on orders above ₹499 · Ships in 2–3 business days
            </div>

            {/* Accordions */}
            <div style={{ borderTop: `1px solid ${C.border}` }}>
              <Accordion id="ingredients" label="Full Ingredients" open={openSection === 'ingredients'} onToggle={() => toggleAcc('ingredients')}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingBottom: 20 }}>
                  {tags.map((t) => (
                    <span key={t} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 99, background: C.sagePale, color: C.forest, fontWeight: 500 }}>{t}</span>
                  ))}
                  <span style={{ fontSize: 12, color: C.muted, alignSelf: 'center', marginLeft: 4 }}>+ natural botanicals</span>
                </div>
              </Accordion>

              <Accordion id="how_to_use" label="How To Use" open={openSection === 'how_to_use'} onToggle={() => toggleAcc('how_to_use')}>
                <ol style={{ paddingBottom: 20, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {HOW_TO_USE.map((step, i) => (
                    <li key={i} style={{ display: 'flex', gap: 12, fontSize: 13, color: C.muted, alignItems: 'flex-start' }}>
                      <span style={{ width: 22, height: 22, borderRadius: '50%', background: C.sagePale, color: C.forest, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                        {i + 1}
                      </span>
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
          </motion.div>
        </div>

        {/* ── You might also like ─────────────────── */}
        {related.length > 0 && (
          <div style={{ marginTop: isMobile ? 48 : 80, borderTop: `1px solid ${C.border}`, paddingTop: isMobile ? 32 : 48 }}>
            <h3 style={{ fontFamily: FONT.serif, fontSize: isMobile ? 24 : 30, fontWeight: 400, color: C.text, marginBottom: 24 }}>
              You might also like
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: isMobile ? 12 : 16 }}>
              {related.map((r) => <ProductCard key={r.id} product={r} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Micro-styles ────────────────────────────────── */
const crumbBtn = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontFamily: 'inherit', fontSize: 12, color: '#6E7D71',
  padding: 0, fontWeight: 400, flexShrink: 0,
}
const infoCard = { background: '#F2EAE0', borderRadius: 12, padding: '14px 16px' }
const infoLabel = { fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: '#6E7D71', marginBottom: 6, textTransform: 'uppercase' }
const qtyBtn = {
  background: 'none', border: 'none', cursor: 'pointer',
  width: 40, height: 52, display: 'flex', alignItems: 'center',
  justifyContent: 'center', color: '#1C221E',
}
