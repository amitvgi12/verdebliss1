import { useNavigate } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { C, FONT } from '@/constants/theme'

const LINKS = [
  ['Shop',    [['Serums', '/products?cat=Serum'], ['Moisturisers', '/products?cat=Moisturiser'], ['Toners', '/products?cat=Toner'], ['Cleansers', '/products?cat=Cleanser'], ['SPF', '/products?cat=SPF'], ['Lip Care', '/products?cat=Lip+Care']]],
  ['Company', [['Our Story', '/'], ['Ingredients', '/'], ['Sustainability', '/'], ['Press', '/']]],
  ['Support', [['My Account', '/account'], ['Orders', '/account'], ['Returns', '/'], ['Contact', '/']]],
]

export default function Footer() {
  const navigate = useNavigate()
  return (
    <footer style={{ background: C.forest, color: 'rgba(255,255,255,0.55)', padding: '56px 24px 28px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf size={13} color={C.sage} />
            </div>
            <span style={{ fontFamily: FONT.serif, fontSize: 18, color: 'white', fontWeight: 400 }}>VerdeBliss</span>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.75, maxWidth: 240, marginBottom: 16 }}>
            Where beauty becomes luxury. Crafted from certified organic botanicals for your most radiant skin.
          </p>
          <div style={{ fontSize: 11, color: C.sage, fontWeight: 600, letterSpacing: '0.06em' }}>📩 hello@verdebliss.in</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            {['Instagram', 'Pinterest', 'YouTube'].map((s) => (
              <div key={s} style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px 10px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 99 }}>{s}</div>
            ))}
          </div>
        </div>

        {LINKS.map(([title, items]) => (
          <div key={title}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.09em', marginBottom: 16 }}>{title.toUpperCase()}</div>
            {items.map(([label, path]) => (
              <div key={label} onClick={() => navigate(path)}
                style={{ fontSize: 13, padding: '4px 0', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.9)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}>
                {label}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 1200, margin: '36px auto 0', paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', fontSize: 11, flexWrap: 'wrap', gap: 8 }}>
        <span>© 2026 VerdeBliss. All rights reserved.</span>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((l) => (
            <span key={l} style={{ cursor: 'pointer' }}>{l}</span>
          ))}
        </div>
      </div>
    </footer>
  )
}
