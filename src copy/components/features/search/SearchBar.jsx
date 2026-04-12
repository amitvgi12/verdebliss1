import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, ArrowRight } from 'lucide-react'
import { PRODUCTS } from '@/constants/products'
import { C } from '@/constants/theme'

const STORAGE_KEY = 'verdebliss-recent-searches'

export default function SearchBar() {
  const navigate = useNavigate()
  const [q, setQ]           = useState('')
  const [focused, setFocused] = useState(false)
  const [recent, setRecent]   = useState(() => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
  const inputRef = useRef(null)
  const [cursor, setCursor]   = useState(-1)

  // Fuzzy match helper
  const fuzzy = (str, pattern) => {
    const s = str.toLowerCase(), p = pattern.toLowerCase()
    let si = 0, pi = 0, score = 0
    while (si < s.length && pi < p.length) {
      if (s[si] === p[pi]) { score++; pi++ }
      si++
    }
    return pi === p.length ? score / p.length : 0
  }

  const results = q.length > 1
    ? PRODUCTS.filter((p) => fuzzy(p.name + p.category + p.ingredient, q) > 0.4).slice(0, 6)
    : []

  const saveRecent = (term) => {
    const updated = [term, ...recent.filter((r) => r !== term)].slice(0, 5)
    setRecent(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const go = (product) => {
    saveRecent(product.name)
    setQ('')
    setFocused(false)
    navigate(`/products/${product.id}`)
  }

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') setCursor((c) => Math.min(c + 1, results.length - 1))
    if (e.key === 'ArrowUp')   setCursor((c) => Math.max(c - 1, -1))
    if (e.key === 'Enter' && cursor >= 0 && results[cursor]) go(results[cursor])
    if (e.key === 'Escape') { setFocused(false); setQ('') }
  }

  useEffect(() => { setCursor(-1) }, [q])

  const showDropdown = focused && (results.length > 0 || (q.length === 0 && recent.length > 0))

  return (
    <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
      <div style={{ display: 'flex', alignItems: 'center', background: '#F2EAE0', border: `1px solid ${focused ? C.sage : C.border}`, borderRadius: 99, padding: '8px 16px', gap: 8, transition: 'border-color 0.2s' }}>
        <Search size={13} color={C.muted} />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 180)}
          onKeyDown={handleKey}
          placeholder="Search products, ingredients…"
          aria-label="Search products"
          style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, color: C.text, width: '100%', fontFamily: 'inherit' }}
        />
        {q && <X size={12} color={C.muted} style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => setQ('')} />}
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, background: 'white', border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', overflow: 'hidden', zIndex: 200 }}
          >
            {q.length === 0 && recent.length > 0 && (
              <>
                <div style={{ padding: '8px 16px', fontSize: 10, color: C.muted, fontWeight: 600, letterSpacing: '0.08em', borderBottom: `1px solid ${C.border}` }}>RECENT</div>
                {recent.map((r) => (
                  <div key={r} onClick={() => setQ(r)} style={{ padding: '10px 16px', fontSize: 13, color: C.muted, cursor: 'pointer', borderBottom: `1px solid ${C.border}` }}
                    onMouseEnter={(e) => e.currentTarget.style.background = C.bg}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                    🕐 {r}
                  </div>
                ))}
              </>
            )}
            {results.length > 0 && (
              <>
                <div style={{ padding: '8px 16px', fontSize: 10, color: C.muted, fontWeight: 600, letterSpacing: '0.08em', borderBottom: `1px solid ${C.border}` }}>PRODUCTS</div>
                {results.map((p, i) => (
                  <div key={p.id} onClick={() => go(p)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer', borderBottom: `1px solid ${C.border}`, background: cursor === i ? C.bg : 'white' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = C.bg}
                    onMouseLeave={(e) => e.currentTarget.style.background = cursor === i ? C.bg : 'white'}
                  >
                    <div style={{ width: 38, height: 38, borderRadius: 9, background: p.bg_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{p.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{p.category} · ₹{p.price?.toLocaleString()}</div>
                    </div>
                    <ArrowRight size={12} color={C.muted} />
                  </div>
                ))}
              </>
            )}
            {q.length > 1 && results.length === 0 && (
              <div style={{ padding: '20px 16px', textAlign: 'center', fontSize: 13, color: C.muted }}>No results for &ldquo;{q}&rdquo;</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
