'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, ArrowRight } from 'lucide-react'
import { C } from '@/constants/theme'
import { productPath } from '@/lib/seo'
import type { Product } from '@/types'

const STORAGE_KEY = 'verdebliss-recent-searches'

export default function SearchBar({ products }: { products: Product[] }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [focused, setFocused] = useState(false)
  const [recent, setRecent] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
      return Array.isArray(stored) ? (stored as string[]) : []
    } catch {
      return []
    }
  })
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [cursor, setCursor] = useState(-1)

  // Fuzzy match helper
  const fuzzy = (str: string, pattern: string) => {
    const s = str.toLowerCase()
    const p = pattern.toLowerCase()
    let si = 0
    let pi = 0
    let score = 0
    while (si < s.length && pi < p.length) {
      if (s[si] === p[pi]) {
        score++
        pi++
      }
      si++
    }
    return pi === p.length ? score / p.length : 0
  }

  const results: Product[] =
    q.length > 1
      ? products
          .filter((p) => fuzzy(`${p.name}${p.category ?? ''}${p.ingredient ?? ''}`, q) > 0.4)
          .slice(0, 6)
      : []

  const saveRecent = (term: string) => {
    const updated = [term, ...recent.filter((r: string) => r !== term)].slice(0, 5)
    setRecent(updated)
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch {
        // Ignore storage errors
      }
    }
  }

  const go = (product: Product) => {
    saveRecent(product.name)
    setQ('')
    setFocused(false)
    router.push(productPath(product))
  }

  const goToSearchResults = (term: string) => {
    const normalizedTerm = term.trim()
    if (!normalizedTerm) return
    saveRecent(normalizedTerm)
    setQ('')
    setFocused(false)
    router.push(`/products?q=${encodeURIComponent(normalizedTerm)}`)
  }

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') setCursor((c) => Math.min(c + 1, results.length - 1))
    if (e.key === 'ArrowUp') setCursor((c) => Math.max(c - 1, -1))
    if (e.key === 'Enter') {
      e.preventDefault()
      if (cursor >= 0 && results[cursor]) go(results[cursor])
      else goToSearchResults(q)
    }
    if (e.key === 'Escape') {
      setFocused(false)
      setQ('')
    }
  }

  useEffect(() => {
    setCursor(-1)
  }, [q])

  const showDropdown = focused && (results.length > 0 || (q.length === 0 && recent.length > 0))

  return (
    <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#F2EAE0',
          border: `1px solid ${focused ? C.sage : C.border}`,
          borderRadius: 99,
          padding: '8px 16px',
          gap: 8,
          transition: 'border-color 0.2s',
        }}
      >
        <Search size={13} color={C.muted} />
        <input
          id="site-search"
          name="search"
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 180)}
          onKeyDown={handleKey}
          placeholder="Search products, ingredients…"
          aria-label="Search products"
          style={{
            background: 'none',
            border: 'none',
            outline: 'none',
            fontSize: 13,
            color: C.text,
            width: '100%',
            fontFamily: 'inherit',
          }}
        />
        {q && (
          <X
            size={12}
            color={C.muted}
            style={{ cursor: 'pointer', flexShrink: 0 }}
            onClick={() => setQ('')}
          />
        )}
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              background: '#FDFAF6',
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              zIndex: 200,
            }}
          >
            {q.length === 0 && recent.length > 0 && (
              <>
                <div
                  style={{
                    padding: '8px 16px',
                    fontSize: 10,
                    color: C.muted,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  RECENT
                </div>
                {recent.map((r: string) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setQ(r)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: '#FDFAF6',
                      border: 'none',
                      padding: '10px 16px',
                      fontSize: 13,
                      color: C.muted,
                      cursor: 'pointer',
                      borderBottom: `1px solid ${C.border}`,
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.bg)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#FDFAF6')}
                  >
                    🕐 {r}
                  </button>
                ))}
              </>
            )}
            {/* WCAG: aria-live announces results to screen readers */}
            <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
              {results.length > 0 ? `${results.length} results found` : ''}
            </div>
            {results.length > 0 && (
              <>
                <div
                  style={{
                    padding: '8px 16px',
                    fontSize: 10,
                    color: C.muted,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  PRODUCTS
                </div>
                {results.map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => go(p)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 16px',
                      cursor: 'pointer',
                      border: 'none',
                      borderBottom: `1px solid ${C.border}`,
                      background: cursor === i ? C.ivory : '#FDFAF6',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.bg)}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = cursor === i ? C.ivory : '#FDFAF6')
                    }
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 9,
                        background: p.bg_color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        flexShrink: 0,
                      }}
                    >
                      {p.emoji}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>
                        {p.category} · ₹{p.price?.toLocaleString()}
                      </div>
                    </div>
                    <ArrowRight size={12} color={C.muted} />
                  </button>
                ))}
              </>
            )}
            {q.length > 1 && results.length === 0 && (
              <div
                style={{ padding: '20px 16px', textAlign: 'center', fontSize: 13, color: C.muted }}
              >
                No results for &ldquo;{q}&rdquo;
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
