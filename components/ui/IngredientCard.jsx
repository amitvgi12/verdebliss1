/**
 * IngredientCard.jsx
 *
 * Renders a real ingredient photograph stored in /public/ingredients/.
 * Vite serves /public at the site root, so the path in the browser is /ingredients/{file}.
 *
 * IMAGE FILE NAMES expected in /public/ingredients/:
 *   Bakuchiol    → bakuchiol.webp
 *   Rose Hip     → rose_hip.webp
 *   Green Tea    → greentealeaves.webp
 *   Turmeric     → turmeric.webp
 *   Zinc Oxide   → zinc.webp
 *   Acai Berry   → blueberries.webp
 *   Niacinamide  → niacinamide.webp
 *   Shea Butter  → shea.webp
 *
 * Add any new ingredient: just add its key → filename entry below.
 * If a file is missing the card shows a sage-green placeholder — never crashes.
 */

import { useState } from 'react'
import { C, FONT } from '@/constants/theme'

/* ── Ingredient name → image filename map ───────────────────────────── */
const IMAGE_MAP = {
  'Bakuchiol':   '/images/ingredients/bakuchiol.webp',
  'Rose Hip':    '/images/ingredients/rose_hip.webp',
  'Green Tea':   '/images/ingredients/greentealeaves.webp',
  'Turmeric':    '/images/ingredients/turmeric.webp',
  'Zinc Oxide':  '/images/ingredients/zinc.webp',
  'Acai Berry':  '/images/ingredients/blueberries.webp',
  'Niacinamide': '/images/ingredients/niacinamide.webp',
  'Shea Butter': '/images/ingredients/shea.webp',
}

/* ── Background tints that match each ingredient's colour palette ────── */
const BG_MAP = {
  'Bakuchiol':   '#EAF4EB',
  'Rose Hip':    '#FDE8EF',
  'Green Tea':   '#E8F5E9',
  'Turmeric':    '#FFFDE7',
  'Zinc Oxide':  '#E3F2FD',
  'Acai Berry':  '#F3E5F5',
  'Niacinamide': '#E0F7FA',
  'Shea Butter': '#FFF8E1',
}

export default function IngredientCard({ ingredient, description, imageHeight = 160 }) {
  const src = IMAGE_MAP[ingredient]
  const bg  = BG_MAP[ingredient] ?? C.sagePale

  // Track whether the image loaded successfully
  const [imgFailed, setImgFailed] = useState(false)

  return (
    <div
      style={{
        background: '#FDFAF6',
        borderRadius: 16,
        border: `1px solid ${C.border}`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s, transform 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.09)'
        e.currentTarget.style.transform = 'translateY(-4px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* ── Image area ── */}
      <div
        style={{
          height: imageHeight,
          background: bg,
          overflow: 'hidden',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {src && !imgFailed ? (
          <img
            src={src}
            alt={ingredient}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
              transition: 'transform 0.35s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.06)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            onError={() => setImgFailed(true)}
          />
        ) : (
          /* Placeholder shown when image is missing or failed to load */
          <div style={{ textAlign: 'center', opacity: 0.5 }}>
            <div style={{ fontSize: 52, marginBottom: 6 }}>🌿</div>
            <div style={{ fontSize: 11, color: C.muted }}>Image coming soon</div>
          </div>
        )}
      </div>

      {/* ── Text ── */}
      {(ingredient || description) && (
        <div style={{ padding: '14px 16px' }}>
          {ingredient && (
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: description ? 4 : 0, fontFamily: FONT.serif }}>
              {ingredient}
            </div>
          )}
          {description && (
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
              {description}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
