import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, ShoppingBag, Check, Award, ArrowLeft } from 'lucide-react'
import Stars from '@/components/ui/Stars'
import Badge from '@/components/ui/Badge'
import ProductCard from '@/components/ui/ProductCard'
import { useProduct, useProducts } from '@/hooks/useProducts'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useAuthStore } from '@/store/authStore'
import { C, FONT } from '@/constants/theme'

export default function ProductDetail() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const { product: p, loading } = useProduct(id)
  const { products: related }   = useProducts({})
  const addItem     = useCartStore((s) => s.addItem)
  const { toggle, has } = useWishlistStore()
  const user        = useAuthStore((s) => s.user)
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    addItem(p)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  if (loading) return (
    <div style={{ maxWidth: 1100, margin: '80px auto', padding: '0 24px', textAlign: 'center', color: C.muted }}>Loading…</div>
  )
  if (!p) return (
    <div style={{ maxWidth: 1100, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🌿</div>
      <div style={{ fontFamily: FONT.serif, fontSize: 24, color: C.muted }}>Product not found</div>
      <button onClick={() => navigate('/products')} style={{ marginTop: 16, background: C.forest, color: 'white', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Back to Shop</button>
    </div>
  )

  const relatedProducts = related.filter((r) => r.id !== p.id && r.category === p.category).slice(0, 4)

  return (
    <div style={{ background: C.bg, minHeight: '80vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        {/* Back */}
        <button onClick={() => navigate('/products')}
          style={{ background: 'none', border: 'none', color: C.muted, fontSize: 13, cursor: 'pointer', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', fontWeight: 500 }}>
          <ArrowLeft size={14} /> Back to Products
        </button>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'start', marginBottom: 60 }}>
          {/* Visual */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div style={{ background: p.bg_color, borderRadius: 24, height: 440, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 130, boxShadow: '0 4px 32px rgba(0,0,0,0.06)' }}>
              {p.emoji}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              {p.badges?.map((b) => <Badge key={b} label={b} />)}
            </div>
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: '0.09em', marginBottom: 8, fontWeight: 600 }}>{p.category?.toUpperCase()}</div>
            <h1 style={{ fontFamily: FONT.serif, fontSize: 38, color: C.text, margin: '0 0 12px', fontWeight: 400, lineHeight: 1.1 }}>{p.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Stars rating={p.rating} size={14} />
              <span style={{ fontSize: 13, color: C.muted }}>({p.review_count} verified reviews)</span>
            </div>
            <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.8, marginBottom: 24 }}>{p.description}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              <div style={{ background: C.ivory, borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: '0.07em', marginBottom: 4 }}>KEY INGREDIENT</div>
                <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{p.ingredient}</div>
              </div>
              <div style={{ background: C.ivory, borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: '0.07em', marginBottom: 6 }}>IDEAL FOR</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {p.skin_types?.map((s) => (
                    <span key={s} style={{ background: C.sagePale, color: C.forest, fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 500 }}>{s}</span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 36, fontWeight: 600, color: C.text, marginBottom: 8, fontFamily: FONT.serif }}>₹{p.price?.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: C.sage, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Award size={12} /> Earn {Math.floor((p.price ?? 0) / 10)} loyalty points with this purchase
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleAdd}
                style={{ flex: 1, background: added ? C.sage : C.forest, color: 'white', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.3s' }}>
                {added ? <><Check size={16} />Added to Cart!</> : <><ShoppingBag size={16} />Add to Cart</>}
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => toggle(p.id, user?.id)}
                style={{ width: 52, height: 52, borderRadius: 12, border: `1px solid ${C.border}`, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Heart size={18} fill={has(p.id) ? C.terra : 'none'} color={has(p.id) ? C.terra : C.muted} />
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <div>
            <h3 style={{ fontFamily: FONT.serif, fontSize: 30, color: C.text, marginBottom: 24, fontWeight: 400 }}>You might also like</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {relatedProducts.map((r) => <ProductCard key={r.id} product={r} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
