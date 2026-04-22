/**
 * Footer.jsx
 *
 * FIXES APPLIED:
 * 1. Logo now sits inside a white rounded container → visible on dark background.
 * 2. Company links navigate to real pages (/our-story, /ingredients, etc.)
 * 3. Privacy Policy / Terms / Cookie Policy open LegalModal popups.
 * 4. Social links and placeholder items show toast instead of silent redirect.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import LegalModal from '@/components/ui/LegalModal'
import { useToastStore } from '@/store/toastStore'
import { C, FONT } from '@/constants/theme'

/* ── Navigation data ─────────────────────────────────────────────── */
const SHOP_LINKS = [
  ['Serums',       '/products?cat=Serum'],
  ['Moisturisers', '/products?cat=Moisturiser'],
  ['Toners',       '/products?cat=Toner'],
  ['Cleansers',    '/products?cat=Cleanser'],
  ['SPF',          '/products?cat=SPF'],
  ['Lip Care',     '/products?cat=Lip+Care'],
]

/* null = coming-soon toast; string = navigate to route */
const COMPANY_LINKS = [
  ['Our Story',      '/our-story'],
  ['Ingredients',    '/ingredients'],
  ['Sustainability', '/sustainability'],
  ['Press',          '/press'],
  ['Journal',        '/blog'],
]

const SUPPORT_LINKS = [
  ['My Account', '/account'],
  ['Orders',     '/account'],
  ['Returns & Refund', 'refund'],
  ['Contact',    '/contact'],
]

/* Legal opens modals, not pages */
const LEGAL_LINKS = ['privacy', 'terms', 'cookie', 'refund']
const LEGAL_LABELS = { privacy: 'Privacy Policy', terms: 'Terms of Service', cookie: 'Cookie Policy', refund: 'Returns & Refund Policy' }

export default function Footer() {
  const navigate = useNavigate()
  const toast    = useToastStore((s) => s.push)
  const [modal, setModal] = useState(null) // 'privacy' | 'terms' | 'cookie' | null

  const go = (path, label) => {
    if (path) {
      navigate(path)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      toast(`${label} — coming soon! 🌿`, 'info')
    }
  }

  const Link = ({ label, path }) => (
    <button onClick={() => go(path, label)}
      style={{ display:'block', background:'none', border:'none', textAlign:'left', fontSize:13, padding:'4px 0', color:'rgba(255,255,255,0.55)', cursor:'pointer', fontFamily:'inherit', width:'100%', transition:'color 0.2s' }}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.9)' }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}>
      {label}
    </button>
  )

  return (
    <>
      {/* Legal modal — renders outside footer so z-index works correctly */}
      {modal && <LegalModal type={modal} onClose={() => setModal(null)} />}

      <footer style={{ background: C.forest, color: 'rgba(255,255,255,0.55)', padding: '56px 16px 28px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 40 }}>

          {/* ── Brand column ── */}
          <div>
            <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 14, display: 'block' }}>
              {/*
                FIX: White pill container keeps the original logo colours
                visible on the dark forest footer background.
                brightness(0) invert(1) made it invisible because the logo
                PNG has a non-transparent background.
              */}
              <div style={{ background: 'white', borderRadius: 10, padding: '4px 8px', display: 'inline-flex', alignItems: 'center' }}>
                <img
                  src="/images/logo.webp"
                  alt="VerdeBliss"
                  style={{ height: 34, width: 'auto', objectFit: 'contain', display: 'block' }}
                  onError={(e) => {
                    /* If logo.webp is missing, hide the white container and show text */
                    e.currentTarget.closest('div').style.display = 'none'
                    e.currentTarget.closest('button').querySelector('span').style.display = 'flex'
                  }}
                />
              </div>
              {/* Text fallback */}
              <span style={{ display: 'none', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <Leaf size={14} color={C.sage} />
                <span style={{ fontFamily: FONT.serif, fontSize: 18, color: 'white' }}>VerdeBliss</span>
              </span>
            </button>

            <p style={{ fontSize: 13, lineHeight: 1.75, maxWidth: 240, marginBottom: 16 }}>
              Where nature becomes luxury. Certified organic botanicals for your most radiant skin.
            </p>
            <div style={{ fontSize: 11, color: C.sage, fontWeight: 600, marginBottom: 16 }}>📩 hello@verdebliss.in</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['Instagram', 'Pinterest', 'YouTube'].map((s) => (
                <button key={s} onClick={() => toast(`${s} — coming soon!`, 'info')}
                  style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '4px 10px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 99, background: 'none', fontFamily: 'inherit' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* ── Shop ── */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.09em', marginBottom: 14 }}>SHOP</div>
            {SHOP_LINKS.map(([l, p]) => <Link key={l} label={l} path={p} />)}
          </div>

          {/* ── Company ── */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.09em', marginBottom: 14 }}>COMPANY</div>
            {COMPANY_LINKS.map(([l, p]) => <Link key={l} label={l} path={p} />)}
          </div>

          {/* ── Support ── */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.09em', marginBottom: 14 }}>SUPPORT</div>
            {SUPPORT_LINKS.map(([l, p]) => <Link key={l} label={l} path={p} />)}
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div style={{ maxWidth: 1200, margin: '36px auto 0', paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', fontSize: 11, flexWrap: 'wrap', gap: 8 }}>
          <span>© 2026 VerdeBliss Cosmetics Private Limited.</span>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {LEGAL_LINKS.map((key) => (
              <button key={key} onClick={() => setModal(key)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', transition: 'color 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.9)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}>
                {LEGAL_LABELS[key]}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </>
  )
}
