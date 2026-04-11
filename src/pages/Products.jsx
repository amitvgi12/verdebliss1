import { useState } from 'react'
import { motion } from 'framer-motion'
import ProductCard from '@/components/ui/ProductCard'
import SkeletonCard from '@/components/ui/SkeletonCard'
import { useProducts } from '@/hooks/useProducts'
import { CATEGORIES, SKIN_TYPES, SORT_OPTIONS } from '@/constants/products'
import { C, FONT } from '@/constants/theme'

export default function Products() {
  const [category, setCategory]   = useState('All')
  const [skinType, setSkinType]   = useState('All')
  const [sortBy, setSortBy]       = useState('Bestselling')

  const { products, loading } = useProducts({ category, skinType, sortBy })

  return (
    <div style={{ background: C.bg, minHeight: '80vh' }}>
      {/* Page header */}
      <div style={{ background: C.forest, padding: '48px 24px 60px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ fontSize: 10, color: C.sage, letterSpacing: '0.14em', marginBottom: 8, fontWeight: 600 }}>THE BOUTIQUE</div>
          <h1 style={{ fontFamily: FONT.serif, fontSize: 48, color: 'white', margin: 0, fontWeight: 400 }}>Shop All Products</h1>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '-24px auto 0', padding: '0 24px 80px', display: 'grid', gridTemplateColumns: '220px 1fr', gap: 40 }}>
        {/* ── Sidebar filters ── */}
        <aside style={{ background: C.card, borderRadius: 16, padding: 24, border: `1px solid ${C.border}`, alignSelf: 'start', marginTop: 24, position: 'sticky', top: 80 }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.text, letterSpacing: '0.07em', marginBottom: 14 }}>CATEGORY</div>
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', padding: '7px 12px', fontSize: 13, color: category === c ? C.forest : C.muted, fontWeight: category === c ? 600 : 400, cursor: 'pointer', borderLeft: category === c ? `2px solid ${C.forest}` : '2px solid transparent', borderRadius: '0 6px 6px 0', transition: 'all 0.2s', fontFamily: 'inherit', background: category === c ? C.sagePale : 'none' }}>
                {c}
              </button>
            ))}
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.text, letterSpacing: '0.07em', marginBottom: 14 }}>SKIN TYPE</div>
            {SKIN_TYPES.map((s) => (
              <button key={s} onClick={() => setSkinType(s)}
                style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', padding: '7px 12px', fontSize: 13, color: skinType === s ? C.terra : C.muted, fontWeight: skinType === s ? 600 : 400, cursor: 'pointer', borderLeft: skinType === s ? `2px solid ${C.terra}` : '2px solid transparent', borderRadius: '0 6px 6px 0', transition: 'all 0.2s', fontFamily: 'inherit', background: skinType === s ? C.terraPale : 'none' }}>
                {s}
              </button>
            ))}
          </div>

          {(category !== 'All' || skinType !== 'All') && (
            <button onClick={() => { setCategory('All'); setSkinType('All') }}
              style={{ marginTop: 20, width: '100%', background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px', fontSize: 12, color: C.muted, cursor: 'pointer', fontFamily: 'inherit' }}>
              Clear Filters
            </button>
          )}
        </aside>

        {/* ── Product grid ── */}
        <div style={{ marginTop: 24 }}>
          {/* Sort bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>{products.length} products</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {SORT_OPTIONS.map((s) => (
                <button key={s} onClick={() => setSortBy(s)}
                  style={{ background: sortBy === s ? C.forest : 'white', color: sortBy === s ? 'white' : C.muted, border: `1px solid ${sortBy === s ? C.forest : C.border}`, borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, transition: 'all 0.2s' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 20 }}>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
              : products.map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <ProductCard product={p} />
                  </motion.div>
                ))
            }
          </div>

          {!loading && products.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🌿</div>
              <div style={{ fontSize: 20, color: C.muted, fontFamily: FONT.serif }}>No products match your filters</div>
              <button onClick={() => { setCategory('All'); setSkinType('All') }}
                style={{ marginTop: 16, background: 'none', border: `1px solid ${C.forest}`, color: C.forest, borderRadius: 10, padding: '10px 24px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
