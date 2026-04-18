/**
 * ProductCard.jsx
 * Uses ProductImage (serum.webp + logo overlay) instead of emoji placeholder.
 * Wishlist heart and Add-to-cart button preserved.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, ShoppingBag, Check } from 'lucide-react'
import Stars from '@/components/ui/Stars'
import Badge from '@/components/ui/Badge'
import ProductImage from '@/components/ui/ProductImage'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useAuthStore } from '@/store/authStore'
import { C, FONT } from '@/constants/theme'

export default function ProductCard({ product: p }) {
  const navigate          = useNavigate()
  const addItem           = useCartStore((s) => s.addItem)
  const { toggle, has }   = useWishlistStore()
  const user              = useAuthStore((s) => s.user)
  const [added, setAdded] = useState(false)

  const handleAdd = (e) => {
    e.stopPropagation()
    addItem(p)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  const handleWish = (e) => {
    e.stopPropagation()
    toggle(p.id, user?.id)
  }

  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: '0 12px 40px rgba(0,0,0,0.09)' }}
      transition={{ duration: 0.2 }}
      onClick={() => navigate(`/products/${p.id}`)}
      style={{ background: C.card, borderRadius: 16, overflow: 'hidden', cursor: 'pointer', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column' }}
    >
      {/* Product image with logo watermark */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <ProductImage product={p} height={200} />

        {/* Wishlist heart */}
        <button
          onClick={handleWish}
          aria-label={has(p.id) ? 'Remove from wishlist' : 'Add to wishlist'}
          style={{ position:'absolute', top:10, right:10, background:'white', border:'none', borderRadius:'50%', width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.1)', zIndex:2 }}
        >
          <Heart size={13} fill={has(p.id) ? C.terra : 'none'} color={has(p.id) ? C.terra : C.muted} />
        </button>

        {/* First badge */}
        <div style={{ position:'absolute', bottom:10, left:10, display:'flex', gap:3, zIndex:2 }}>
          {p.badges?.slice(0, 1).map((b) => <Badge key={b} label={b} />)}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding:'14px 16px', flex:1, display:'flex', flexDirection:'column', gap:6 }}>
        <div style={{ fontSize:10, color:C.muted, fontWeight:600, letterSpacing:'0.07em' }}>{p.category?.toUpperCase()}</div>
        <div style={{ fontSize:14, fontWeight:500, color:C.text, lineHeight:1.3, fontFamily:FONT.serif }}>{p.name}</div>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <Stars rating={p.rating} />
          <span style={{ fontSize:11, color:C.muted }}>({p.review_count})</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'auto', paddingTop:6 }}>
          <span style={{ fontSize:16, fontWeight:700, color:C.text }}>₹{p.price?.toLocaleString()}</span>
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={handleAdd}
            style={{ background: added ? C.sage : C.forest, color:'white', border:'none', borderRadius:8, padding:'6px 14px', fontSize:12, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:5, transition:'background 0.3s', fontFamily:'inherit' }}
          >
            {added ? <><Check size={12}/>Added!</> : <><ShoppingBag size={12}/>Add</>}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
