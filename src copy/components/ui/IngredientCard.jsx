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
  Bakuchiol: () => (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      {/* Soft vignette bg */}
      <circle cx="80" cy="80" r="72" fill="url(#bk-bg)" />
      <defs>
        <radialGradient id="bk-bg" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#e8f5e9" />
          <stop offset="100%" stopColor="#c8e6c0" />
        </radialGradient>
      </defs>
      {/* Babchi leaves */}
      <ellipse cx="60" cy="90" rx="28" ry="12" fill="#66bb6a" transform="rotate(-30 60 90)" />
      <ellipse cx="100" cy="85" rx="24" ry="10" fill="#81c784" transform="rotate(20 100 85)" />
      <ellipse cx="80" cy="70" rx="20" ry="9" fill="#a5d6a7" transform="rotate(-10 80 70)" />
      {/* Seed pods */}
      <circle cx="72" cy="96" r="6" fill="#558b2f" />
      <circle cx="88" cy="98" r="5" fill="#689f38" />
      <circle cx="80" cy="106" r="4" fill="#558b2f" />
      {/* Oil drop */}
      <path d="M80 44 C80 44 72 56 72 62 A8 8 0 0 0 88 62 C88 56 80 44 80 44Z" fill="#c8e96c" opacity="0.9" />
      <ellipse cx="77" cy="59" rx="2" ry="3" fill="white" opacity="0.5" />
    </svg>
  ),

  'Rose Hip': () => (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <circle cx="80" cy="80" r="72" fill="url(#rh-bg)" />
      <defs>
        <radialGradient id="rh-bg" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#fce4ec" />
          <stop offset="100%" stopColor="#f8bbd0" />
        </radialGradient>
      </defs>
      {/* Rose hip berries */}
      <ellipse cx="78" cy="88" rx="16" ry="18" fill="#e53935" />
      <ellipse cx="78" cy="88" rx="12" ry="14" fill="#ef5350" />
      <circle cx="72" cy="82" r="4" fill="#ff8a80" opacity="0.6" />
      {/* Calyx tip */}
      <path d="M72 72 L78 68 L84 72 L80 78 L76 78Z" fill="#388e3c" />
      <line x1="78" y1="68" x2="78" y2="62" stroke="#388e3c" strokeWidth="1.5" />
      {/* Second berry */}
      <ellipse cx="100" cy="98" rx="12" ry="13" fill="#c62828" />
      <ellipse cx="100" cy="98" rx="9" ry="10" fill="#e53935" />
      {/* Leaves */}
      <ellipse cx="58" cy="90" rx="16" ry="7" fill="#4caf50" transform="rotate(-25 58 90)" />
      <ellipse cx="110" cy="80" rx="13" ry="6" fill="#66bb6a" transform="rotate(15 110 80)" />
      {/* Oil drop */}
      <path d="M95 48 C95 48 89 58 89 63 A6 6 0 0 0 101 63 C101 58 95 48 95 48Z" fill="#f9a825" opacity="0.85" />
    </svg>
  ),

  'Green Tea': () => (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <circle cx="80" cy="80" r="72" fill="url(#gt-bg)" />
      <defs>
        <radialGradient id="gt-bg" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#f1f8e9" />
          <stop offset="100%" stopColor="#dcedc8" />
        </radialGradient>
      </defs>
      {/* Tea leaves - multiple overlapping */}
      <ellipse cx="65" cy="95" rx="22" ry="9" fill="#33691e" transform="rotate(-40 65 95)" />
      <ellipse cx="80" cy="85" rx="25" ry="10" fill="#558b2f" transform="rotate(-15 80 85)" />
      <ellipse cx="96" cy="90" rx="20" ry="8" fill="#689f38" transform="rotate(20 96 90)" />
      <ellipse cx="75" cy="72" rx="18" ry="7" fill="#7cb342" transform="rotate(-5 75 72)" />
      {/* Vein lines */}
      <line x1="68" y1="87" x2="82" y2="83" stroke="#1b5e20" strokeWidth="0.8" opacity="0.6" />
      <line x1="88" y1="85" x2="100" y2="88" stroke="#1b5e20" strokeWidth="0.8" opacity="0.6" />
      {/* Tea cup silhouette */}
      <path d="M58 108 Q80 116 102 108 L98 100 Q80 107 62 100Z" fill="#a5d6a7" opacity="0.4" />
      {/* Steam wisps */}
      <path d="M72 56 Q68 48 72 42" stroke="#81c784" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M80 52 Q76 44 80 38" stroke="#81c784" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M88 56 Q84 48 88 42" stroke="#81c784" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  ),

  Turmeric: () => (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <circle cx="80" cy="80" r="72" fill="url(#tm-bg)" />
      <defs>
        <radialGradient id="tm-bg" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#fffde7" />
          <stop offset="100%" stopColor="#fff9c4" />
        </radialGradient>
      </defs>
      {/* Turmeric rhizomes */}
      <ellipse cx="80" cy="90" rx="24" ry="14" fill="#e65100" transform="rotate(-10 80 90)" />
      <ellipse cx="80" cy="90" rx="20" ry="11" fill="#ef6c00" />
      <ellipse cx="56" cy="88" rx="14" ry="8" fill="#e65100" transform="rotate(-30 56 88)" />
      <ellipse cx="105" cy="93" rx="13" ry="7" fill="#f57c00" transform="rotate(15 105 93)" />
      {/* Nubs on rhizome */}
      <ellipse cx="68" cy="78" rx="6" ry="4" fill="#bf360c" transform="rotate(-20 68 78)" />
      <ellipse cx="92" cy="80" rx="5" ry="3.5" fill="#bf360c" transform="rotate(10 92 80)" />
      {/* Turmeric powder spill */}
      <ellipse cx="80" cy="108" rx="28" ry="6" fill="#ffca28" opacity="0.6" />
      <ellipse cx="80" cy="108" rx="20" ry="4" fill="#ffd54f" opacity="0.5" />
      {/* Leaf */}
      <ellipse cx="95" cy="65" rx="20" ry="8" fill="#66bb6a" transform="rotate(30 95 65)" />
    </svg>
  ),

  'Zinc Oxide': () => (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <circle cx="80" cy="80" r="72" fill="url(#zo-bg)" />
      <defs>
        <radialGradient id="zo-bg" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#e3f2fd" />
          <stop offset="100%" stopColor="#bbdefb" />
        </radialGradient>
      </defs>
      {/* SPF shield symbol */}
      <path d="M80 42 L110 56 L110 82 Q110 105 80 118 Q50 105 50 82 L50 56Z" fill="white" opacity="0.7" />
      <path d="M80 50 L104 62 L104 82 Q104 100 80 111 Q56 100 56 82 L56 62Z" fill="#e3f2fd" />
      {/* Sun rays */}
      <circle cx="80" cy="80" r="16" fill="#fff9c4" />
      <circle cx="80" cy="80" r="12" fill="#ffee58" />
      {[0,45,90,135,180,225,270,315].map((deg, i) => {
        const r = deg * Math.PI / 180
        return <line key={i} x1={80 + 16*Math.cos(r)} y1={80 + 16*Math.sin(r)} x2={80 + 24*Math.cos(r)} y2={80 + 24*Math.sin(r)} stroke="#fbc02d" strokeWidth="2" strokeLinecap="round" />
      })}
      {/* SPF text */}
      <text x="80" y="84" textAnchor="middle" fill="#1565c0" fontSize="9" fontWeight="700">SPF</text>
    </svg>
  ),

  'Acai Berry': () => (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <circle cx="80" cy="80" r="72" fill="url(#ab-bg)" />
      <defs>
        <radialGradient id="ab-bg" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#f3e5f5" />
          <stop offset="100%" stopColor="#e1bee7" />
        </radialGradient>
      </defs>
      {/* Berry cluster */}
      {[
        [80,80,14], [62,74,11], [98,74,11], [70,96,10], [90,96,10], [80,60,9], [55,88,9], [105,88,9]
      ].map(([cx, cy, r], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={r} fill="#4a148c" />
          <circle cx={cx} cy={cy} r={r} fill="#6a1b9a" opacity="0.7" />
          <circle cx={cx-r*0.3} cy={cy-r*0.3} r={r*0.25} fill="white" opacity="0.35" />
        </g>
      ))}
      {/* Stem */}
      <path d="M80 44 Q75 52 80 60" stroke="#2e7d32" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Small leaves */}
      <ellipse cx="72" cy="50" rx="10" ry="4" fill="#388e3c" transform="rotate(-30 72 50)" />
      <ellipse cx="88" cy="48" rx="9" ry="4" fill="#43a047" transform="rotate(25 88 48)" />
    </svg>
  ),

  Niacinamide: () => (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <circle cx="80" cy="80" r="72" fill="url(#na-bg)" />
      <defs>
        <radialGradient id="na-bg" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#e0f7fa" />
          <stop offset="100%" stopColor="#b2ebf2" />
        </radialGradient>
      </defs>
      {/* Lab dropper bottle */}
      <rect x="66" y="72" width="28" height="40" rx="6" fill="white" stroke="#b2ebf2" strokeWidth="1.5" />
      <rect x="72" y="60" width="16" height="14" rx="3" fill="#e0f7fa" stroke="#80deea" strokeWidth="1.5" />
      <rect x="76" y="52" width="8" height="10" rx="2" fill="#b2ebf2" />
      {/* 10% label */}
      <text x="80" y="96" textAnchor="middle" fill="#006064" fontSize="10" fontWeight="700">10%</text>
      <text x="80" y="107" textAnchor="middle" fill="#00838f" fontSize="7">NIACIN</text>
      {/* Pore circle graphic */}
      <circle cx="80" cy="44" r="6" fill="none" stroke="#4dd0e1" strokeWidth="1.5" strokeDasharray="3 2" />
      <circle cx="80" cy="44" r="2" fill="#4dd0e1" />
      {/* Bubbles */}
      <circle cx="105" cy="80" r="5" fill="#e0f7fa" stroke="#80deea" strokeWidth="1" />
      <circle cx="55" cy="85" r="4" fill="#e0f7fa" stroke="#80deea" strokeWidth="1" />
      <circle cx="108" cy="95" r="3" fill="#b2ebf2" />
    </svg>
  ),

  'Shea Butter': () => (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <circle cx="80" cy="80" r="72" fill="url(#sb-bg)" />
      <defs>
        <radialGradient id="sb-bg" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#fff8e1" />
          <stop offset="100%" stopColor="#ffe0b2" />
        </radialGradient>
      </defs>
      {/* Shea nut */}
      <ellipse cx="80" cy="88" rx="22" ry="26" fill="#795548" />
      <ellipse cx="80" cy="88" rx="18" ry="22" fill="#8d6e63" />
      <ellipse cx="80" cy="88" rx="14" ry="18" fill="#a1887f" />
      {/* Cracked open — ivory butter inside */}
      <ellipse cx="80" cy="88" rx="10" ry="13" fill="#fff8e1" />
      <ellipse cx="80" cy="88" rx="7" ry="9" fill="#fffde7" />
      {/* Shea tree leaf */}
      <ellipse cx="60" cy="66" rx="18" ry="7" fill="#4caf50" transform="rotate(-35 60 66)" />
      <ellipse cx="100" cy="64" rx="16" ry="6" fill="#66bb6a" transform="rotate(30 100 64)" />
      {/* Butter blob */}
      <ellipse cx="80" cy="116" rx="20" ry="6" fill="#ffe082" opacity="0.7" />
      {/* Butter drip */}
      <path d="M80 108 Q83 112 80 116 Q77 112 80 108Z" fill="#ffd54f" />
    </svg>
  ),
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
