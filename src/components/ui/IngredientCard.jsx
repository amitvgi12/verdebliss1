/**
 * IngredientCard.jsx
 *
 * Renders a clean, studio-style SVG illustration for each key ingredient.
 * Follows the brief: soft lighting, minimal background, aerial-view feel,
 * high-contrast textures, softbox-style even illumination.
 *
 * When you have real ingredient photography, replace the <svg> with an <img>
 * pointing to /images/ingredients/{slug}.jpg — the card wrapper stays the same.
 */

import { C, FONT } from '@/constants/theme'

/* ── Individual ingredient SVG illustrations ────────────────────────── */

const ILLUSTRATIONS = {
  'Bakuchiol':   '/images/ingredients/bakuchiol.png',
  'Rose Hip':    '/images/ingredients/rose_hip.png',
  'Green Tea':   '/images/ingredients/greentealeaves.png',
  'Turmeric':    '/images/ingredients/turmeric.png',
  'Zinc Oxide':  '/images/ingredients/zinc.png',
  'BlueBerry':  '/images/ingredients/blueberries.png',
  'Niacinamide': '/images/ingredients/niacinamide.png',
  'Shea Butter': '/images/ingredients/shea.png',
}

/* ── Card wrapper ────────────────────────────────────────────────────── */
export default function IngredientCard({ ingredient, description }) {
  const Illustration = ILLUSTRATIONS[ingredient]

  return (
    <div
      style={{
        background: 'white',
        borderRadius: 16,
        padding: 20,
        border: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        transition: 'box-shadow 0.2s, transform 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.08)'
        e.currentTarget.style.transform = 'translateY(-3px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* SVG illustration — 120×120 viewport */}
      <div style={{ width: 120, height: 120, flexShrink: 0 }}>
        {Illustration ? <Illustration /> : (
          /* Fallback for unmapped ingredients */
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: C.sagePale, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44 }}>🌿</div>
        )}
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4, fontFamily: FONT.serif }}>
          {ingredient}
        </div>
        {description && (
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.55 }}>{description}</div>
        )}
      </div>
    </div>
  )
}
