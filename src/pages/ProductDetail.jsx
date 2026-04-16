/**
 * ProductDetail.jsx — By Nature–style product page
 *
 * Layout:
 *   Breadcrumb → Back link
 *   [Sticky image panel | Scrollable info panel]
 *   You might also like
 *
 * Image panel: fills 100% of its column using ProductImage.
 * Info panel:  category · name · stars · desc · key-info cards · price ·
 *              qty + add-to-cart · delivery · accordions · trust badges
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, ShoppingBag, Check, Award, ArrowLeft,
  ChevronRight, Plus, Minus, Share2, Truck,
} from 'lucide-react'
import Stars from '@/components/ui/Stars'
import Badge from '@/components/ui/Badge'
import ProductImage from '@/components/ui/ProductImage'
import ProductCard from '@/components/ui/ProductCard'
import { useProduct, useProducts } from '@/hooks/useProducts'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useAuthStore } from '@/store/authStore'
import { C, FONT } from '@/constants/theme'

/* ─── Per-ingredient ingredient tags ─────────────── */
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
  { icon: '🛡️', title: 'Barrier Support', desc: 'Reinforces the skin\'s natural protective barrier.' },
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

/* ─── Main component ──────────────────────────────── */
export default function ProductDetail() {
  const { id }     = useParams()
  const navigate   = useNavigate()
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

  const toggle_ = (id) => setSection((prev) => prev === id ? '' : id)

  /* ─── Loading / 404 ──────────────────────────── */
  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
      Loading…
    </div>
  )
  if (!p) return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ fontSize: 48 }}>🌿</div>
      <div style={{ fontFamily: FONT.serif, fontSize: 22, color: C.muted }}>Product not found</div>
      <button onClick={() => navigate('/products')}
        style={{ background: C.forest, color: 'white', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
        Back to Shop
      </button>
    </div>
  )

  const related   = all.filter((r) => r.id !== p.id && r.category === p.category).slice(0, 4)
  const tags      = INGREDIENT_TAGS[p.ingredient] ?? [p.ingredient, 'Natural Botanicals', 'Aloe Vera', 'Vitamin E']
  const mrp       = Math.round((p.price ?? 0) * 1.25)
  const discount  = Math.round(((mrp - (p.price ?? 0)) / mrp) * 100)
  const loyalPts  = Math.floor((p.price ?? 0) / 10)

  /* derive category label */
  const catLabel = (p.category ?? 'Skincare').toUpperCase()

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>

      {/* ── Breadcrumb ────────────────────────── */}
      <div style={{ borderBottom: `1px solid ${C.border}`, background: C.bg }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 40, fontSize: 12, color: C.muted }}>
            <button onClick={() => navigate('/')} style={crumbBtn}>Home</button>
            <ChevronRight size={12} />
            <button onClick={() => navigate('/products')} style={crumbBtn}>Shop</button>
            <ChevronRight size={12} />
            <span style={{ color: C.text, fontWeight: 500 }}>{p.name}</span>
          </div>
        </div>
      </div>

      {/* ── Main grid ─────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 64px' }}>

        {/* Back link */}
        <button onClick={() => navigate('/products')}
          style={{ background: 'none', border: 'none', color: C.muted, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit', fontWeight: 500, marginBottom: 28, padding: 0 }}>
          <ArrowLeft size={13} /> Back to Products
        </button>

        {/* 2-col grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }}>

          {/* ── LEFT: full-fill image ──────────── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45 }}
            style={{ position: 'sticky', top: 80 }}
          >
            {/*
             * Aspect-ratio box so the image gets a defined height.
             * ProductImage fills 100% × 100% of this box.
             */}
            <div style={{
              borderRadius: 24,
              overflow: 'hidden',
              aspectRatio: '1 / 1',       /* square container */
              width: '100%',
              position: 'relative',
              boxShadow: '0 8px 40px rgba(0,0,0,0.07)',
            }}>
              <div style={{ position: 'absolute', inset: 0 }}>
                <ProductImage product={p} />
              </div>
            </div>

            {/* Trust badge pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
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

          {/* ── RIGHT: info panel ─────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
          >
            {/* Category */}
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: C.gold, marginBottom: 10 }}>
              {catLabel} · 30ml
            </div>

            {/* Name */}
            <h1 style={{
              fontFamily: FONT.serif, fontSize: 'clamp(28px,3.5vw,42px)',
              fontWeight: 400, color: C.text, lineHeight: 1.1,
              marginBottom: 14, letterSpacing: '-0.01em',
            }}>
              {p.name}
            </h1>

            {/* Stars */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <Stars rating={p.rating} size={14} />
              <span style={{ fontSize: 13, color: C.muted }}>
                {p.rating?.toFixed(1)} ({p.review_count} verified reviews)
              </span>
              <span style={{ color: C.border }}>·</span>
              <button style={{ ...linkBtn }}>Read reviews</button>
            </div>

            {/* Description */}
            <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.85, marginBottom: 24 }}>
              {p.description}
            </p>

            {/* Key info cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
              <div style={infoCard}>
                <div style={infoLabel}>KEY INGREDIENT</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{p.ingredient}</div>
              </div>
              <div style={infoCard}>
                <div style={infoLabel}>IDEAL FOR</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {(p.skin_types ?? []).map((s) => (
                    <span key={s} style={{
                      background: C.sagePale, color: C.forest,
                      fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 500,
                    }}>{s}</span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${C.border}`, marginBottom: 24 }} />

            {/* Price */}
            <div style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <span style={{ fontFamily: FONT.serif, fontSize: 34, fontWeight: 600, color: C.text }}>
                  ₹{(p.price ?? 0).toLocaleString()}
                </span>
                <span style={{ fontSize: 15, color: C.light, textDecoration: 'line-through' }}>
                  ₹{mrp.toLocaleString()}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 700, background: C.forest, color: 'white',
                  padding: '3px 10px', borderRadius: 99,
                }}>
                  {discount}% OFF
                </span>
              </div>
              <div style={{ fontSize: 12, color: C.sage, display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                <Award size={12} /> Earn {loyalPts} loyalty points with this purchase
              </div>
            </div>

            {/* Quantity + Add to Cart + Wishlist */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'stretch', marginBottom: 12, marginTop: 20 }}>
              {/* Qty */}
              <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={qtyBtn} aria-label="Decrease">
                  <Minus size={13} />
                </button>
                <span style={{ width: 32, textAlign: 'center', fontSize: 14, fontWeight: 600, color: C.text }}>{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} style={qtyBtn} aria-label="Increase">
                  <Plus size={13} />
                </button>
              </div>

              {/* Add to Cart */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAdd}
                style={{
                  flex: 1, height: 52, borderRadius: 12, border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: added ? C.sage : C.forest, color: 'white',
                  transition: 'background 0.25s',
                }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {added ? (
                    <motion.span key="done" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Check size={15} /> Added to Cart
                    </motion.span>
                  ) : (
                    <motion.span key="add" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ShoppingBag size={15} /> Add to Cart
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Wishlist */}
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => toggle(p.id, user?.id)}
                aria-label={has(p.id) ? 'Remove from wishlist' : 'Save to wishlist'}
                style={{
                  width: 52, height: 52, borderRadius: 12, cursor: 'pointer',
                  border: `1px solid ${C.border}`, background: 'white', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Heart size={18} fill={has(p.id) ? C.terra : 'none'} color={has(p.id) ? C.terra : C.muted} />
              </motion.button>

              {/* Share */}
              <motion.button
                whileTap={{ scale: 0.93 }}
                aria-label="Share product"
                style={{
                  width: 52, height: 52, borderRadius: 12, cursor: 'pointer',
                  border: `1px solid ${C.border}`, background: 'white', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                onClick={() => navigator.share?.({ title: p.name, url: window.location.href })}
              >
                <Share2 size={16} color={C.muted} />
              </motion.button>
            </div>

            {/* Delivery note */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.sagePale, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: C.forest, marginBottom: 24, fontWeight: 500 }}>
              <Truck size={13} />
              Free shipping on orders above ₹499 · Ships in 2–3 business days
            </div>

            {/* ── Accordions ────────────────────── */}
            <div style={{ borderTop: `1px solid ${C.border}` }}>
              <Accordion id="ingredients" label="Full Ingredients" open={openSection === 'ingredients'} onToggle={() => toggle_('ingredients')}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingBottom: 20 }}>
                  {tags.map((t) => (
                    <span key={t} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 99, background: C.sagePale, color: C.forest, fontWeight: 500 }}>{t}</span>
                  ))}
                  <span style={{ fontSize: 12, color: C.muted, alignSelf: 'center', marginLeft: 4 }}>+ natural botanicals</span>
                </div>
              </Accordion>

              <Accordion id="how_to_use" label="How To Use" open={openSection === 'how_to_use'} onToggle={() => toggle_('how_to_use')}>
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

              <Accordion id="benefits" label="Key Benefits" open={openSection === 'benefits'} onToggle={() => toggle_('benefits')}>
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

        {/* ── You might also like ─────────────── */}
        {related.length > 0 && (
          <div style={{ marginTop: 80, borderTop: `1px solid ${C.border}`, paddingTop: 48 }}>
            <h3 style={{ fontFamily: FONT.serif, fontSize: 30, fontWeight: 400, color: C.text, marginBottom: 28 }}>
              You might also like
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {related.map((r) => <ProductCard key={r.id} product={r} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Shared micro-styles ─────────────────────────── */
const crumbBtn = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontFamily: 'inherit', fontSize: 12, color: '#6E7D71',
  padding: 0, fontWeight: 400,
}
const linkBtn = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontFamily: 'inherit', fontSize: 12, color: '#2D4A32',
  padding: 0, textDecoration: 'underline', textUnderlineOffset: 3,
}
const infoCard = {
  background: '#F2EAE0', borderRadius: 12, padding: '14px 16px',
}
const infoLabel = {
  fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
  color: '#6E7D71', marginBottom: 6, textTransform: 'uppercase',
}
const qtyBtn = {
  background: 'none', border: 'none', cursor: 'pointer',
  width: 40, height: 52, display: 'flex', alignItems: 'center',
  justifyContent: 'center', color: '#1C221E',
}
