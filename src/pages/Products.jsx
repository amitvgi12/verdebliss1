import { useSEO, PAGE_SEO } from '@/hooks/useSEO'
/**
 * Products.jsx — Filterable product catalogue
 * BUG FIXED: Reads ?cat= ?skin= ?sort= from URL via useSearchParams
 *            so footer links like /products?cat=Serum work correctly.
 */
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import ProductCard from '@/components/ui/ProductCard'
import SkeletonCard from '@/components/ui/SkeletonCard'
import { useProducts } from '@/hooks/useProducts'
import { CATEGORIES, SKIN_TYPES, SORT_OPTIONS } from '@/constants/products'
import { C, FONT } from '@/constants/theme'

export default function Products() {
  useSEO(PAGE_SEO.products)
  const [params, setParams] = useSearchParams()
  const category = params.get('cat')  ?? 'All'
  const skinType = params.get('skin') ?? 'All'
  const sortBy   = params.get('sort') ?? 'Bestselling'

  const setFilter = (key, value) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (!value || value === 'All') next.delete(key)
      else next.set(key, value)
      return next
    }, { replace: true })
  }

  const { products, loading } = useProducts({ category, skinType, sortBy })

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [category])

  return (
    <div style={{ background: C.bg, minHeight: '80vh' }}>
      <div style={{ background: C.forest, padding: '48px 16px 60px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ fontSize: 10, color: C.sage, letterSpacing: '0.14em', marginBottom: 8, fontWeight: 600 }}>THE BOUTIQUE</div>
          <h1 style={{ fontFamily: FONT.serif, fontSize: 'clamp(32px,5vw,48px)', color: 'white', margin: 0, fontWeight: 400 }}>
            {category !== 'All' ? `${category}s` : 'Shop All Products'}
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '-24px auto 0', padding: '0 16px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'clamp(140px,18%,220px) 1fr', gap: 28, alignItems: 'start' }}>

          {/* Sidebar */}
          <aside style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, marginTop: 24, position: 'sticky', top: 76 }}>
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.gold, letterSpacing: '0.12em', marginBottom: 12, paddingBottom: 6, borderBottom: `1px solid ${C.gold}`, opacity: 0.8 }}>CATEGORY</div>
              {CATEGORIES.map((c) => (
                <button key={c} onClick={() => setFilter('cat', c)} style={{ display:'block', width:'100%', textAlign:'left', border:'none', padding:'7px 10px', fontSize:13, color: category===c ? C.forest : C.muted, fontWeight: category===c ? 600 : 400, cursor:'pointer', borderLeft: category===c ? `2px solid ${C.forest}` : '2px solid transparent', borderRadius:'0 6px 6px 0', background: category===c ? C.sagePale : 'none', fontFamily:'inherit', transition:'all 0.15s' }}>
                  {c}
                </button>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.gold, letterSpacing: '0.12em', marginBottom: 12, paddingBottom: 6, borderBottom: `1px solid ${C.gold}`, opacity: 0.8 }}>SKIN TYPE</div>
              {SKIN_TYPES.map((s) => (
                <button key={s} onClick={() => setFilter('skin', s)} style={{ display:'block', width:'100%', textAlign:'left', border:'none', padding:'7px 10px', fontSize:13, color: skinType===s ? C.terra : C.muted, fontWeight: skinType===s ? 600 : 400, cursor:'pointer', borderLeft: skinType===s ? `2px solid ${C.terra}` : '2px solid transparent', borderRadius:'0 6px 6px 0', background: skinType===s ? C.terraPale : 'none', fontFamily:'inherit', transition:'all 0.15s' }}>
                  {s}
                </button>
              ))}
            </div>
            {(category!=='All' || skinType!=='All') && (
              <button onClick={() => setParams({})} style={{ marginTop:16, width:'100%', background:'none', border:`1px solid ${C.border}`, borderRadius:8, padding:'8px', fontSize:12, color:C.muted, cursor:'pointer', fontFamily:'inherit' }}>Clear Filters</button>
            )}
          </aside>

          {/* Grid */}
          <div style={{ marginTop: 24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:10 }}>
              <div style={{ fontSize:13, color:C.muted }}>{products.length} products</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {SORT_OPTIONS.map((s) => (
                  <button key={s} onClick={() => setFilter('sort', s)} style={{ background: sortBy===s ? C.forest : C.ivory, color: sortBy===s ? 'white' : C.muted, border:`1px solid ${sortBy===s ? C.forest : C.border}`, borderRadius:8, padding:'6px 10px', fontSize:11, cursor:'pointer', fontFamily:'inherit', fontWeight:500, transition:'all 0.15s', whiteSpace:'nowrap' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(190px, 1fr))', gap:16 }}>
              {loading
                ? Array.from({ length:6 }).map((_,i) => <SkeletonCard key={i}/>)
                : products.map((p,i) => (
                    <motion.div key={p.id} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.04 }}>
                      <ProductCard product={p}/>
                    </motion.div>
                  ))
              }
            </div>
            {!loading && products.length===0 && (
              <div style={{ textAlign:'center', padding:'80px 0' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🌿</div>
                <div style={{ fontSize:20, color:C.muted, fontFamily:FONT.serif }}>No products match your filters</div>
                <button onClick={() => setParams({})} style={{ marginTop:16, background:'none', border:`1px solid ${C.forest}`, color:C.forest, borderRadius:10, padding:'10px 24px', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Clear Filters</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
