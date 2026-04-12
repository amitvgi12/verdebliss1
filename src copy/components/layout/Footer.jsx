/**
 * Footer.jsx — Fixed navigation + responsive grid
 * BUG FIXED: Shop links read by Products.jsx via useSearchParams
 * BUG FIXED: "Coming soon" toast instead of silent redirect to "/"
 */
import { useNavigate } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { useToastStore } from '@/store/toastStore'
import { C, FONT } from '@/constants/theme'

const SHOP_LINKS    = [['Serums','/products?cat=Serum'],['Moisturisers','/products?cat=Moisturiser'],['Toners','/products?cat=Toner'],['Cleansers','/products?cat=Cleanser'],['SPF','/products?cat=SPF'],['Lip Care','/products?cat=Lip+Care']]
const COMPANY_LINKS = [['Our Story',null],['Ingredients',null],['Sustainability',null],['Press',null]]
const SUPPORT_LINKS = [['My Account','/account'],['Orders','/account'],['Returns',null],['Contact',null]]

export default function Footer() {
  const navigate = useNavigate()
  const toast    = useToastStore((s) => s.push)

  const go = (path, label) => {
    if (path) { navigate(path); window.scrollTo({ top: 0, behavior: 'smooth' }) }
    else toast(`${label} — coming soon! 🌿`, 'info')
  }

  const Link = ({ label, path }) => (
    <button onClick={() => go(path, label)}
      style={{ display:'block', background:'none', border:'none', textAlign:'left', fontSize:13, padding:'4px 0', color:'rgba(255,255,255,0.55)', cursor:'pointer', fontFamily:'inherit', width:'100%', transition:'color 0.2s' }}
      onMouseEnter={(e) => { e.currentTarget.style.color='rgba(255,255,255,0.9)' }}
      onMouseLeave={(e) => { e.currentTarget.style.color='rgba(255,255,255,0.55)' }}>
      {label}
    </button>
  )

  return (
    <footer style={{ background:C.forest, color:'rgba(255,255,255,0.55)', padding:'56px 16px 28px' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:40 }}>

        {/* Brand */}
        <div>
          <button onClick={() => navigate('/')} style={{ background:'none', border:'none', cursor:'pointer', padding:0, marginBottom:14 }}>
            <img src="/images/logo.png" alt="VerdeBliss" style={{ height:36, width:'auto', objectFit:'contain', filter:'brightness(0) invert(1)' }}
              onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.nextElementSibling.style.display='flex' }}/>
            <span style={{ display:'none', alignItems:'center', gap:6 }}>
              <Leaf size={14} color={C.sage}/>
              <span style={{ fontFamily:FONT.serif, fontSize:18, color:'white' }}>VerdeBliss</span>
            </span>
          </button>
          <p style={{ fontSize:13, lineHeight:1.75, maxWidth:240, marginBottom:16 }}>Where beauty becomes luxury. Certified organic botanicals for your most radiant skin.</p>
          <div style={{ fontSize:11, color:C.sage, fontWeight:600, marginBottom:16 }}>📩 hello@verdebliss.in</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {['Instagram','Pinterest','YouTube'].map((s) => (
              <button key={s} onClick={() => toast(`${s} — coming soon!`, 'info')} style={{ fontSize:11, color:'rgba(255,255,255,0.5)', cursor:'pointer', padding:'4px 10px', border:'1px solid rgba(255,255,255,0.1)', borderRadius:99, background:'none', fontFamily:'inherit' }}>{s}</button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.85)', letterSpacing:'0.09em', marginBottom:14 }}>SHOP</div>
          {SHOP_LINKS.map(([l,p]) => <Link key={l} label={l} path={p}/>)}
        </div>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.85)', letterSpacing:'0.09em', marginBottom:14 }}>COMPANY</div>
          {COMPANY_LINKS.map(([l,p]) => <Link key={l} label={l} path={p}/>)}
        </div>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.85)', letterSpacing:'0.09em', marginBottom:14 }}>SUPPORT</div>
          {SUPPORT_LINKS.map(([l,p]) => <Link key={l} label={l} path={p}/>)}
        </div>
      </div>

      <div style={{ maxWidth:1200, margin:'36px auto 0', paddingTop:24, borderTop:'1px solid rgba(255,255,255,0.08)', display:'flex', justifyContent:'space-between', fontSize:11, flexWrap:'wrap', gap:8 }}>
        <span>© 2026 VerdeBliss Cosmetics Private Limited.</span>
        <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
          {['Privacy Policy','Terms of Service','Cookie Policy'].map((l) => (
            <button key={l} onClick={() => toast(`${l} — coming soon!`, 'info')} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.55)', cursor:'pointer', fontSize:11, fontFamily:'inherit' }}>{l}</button>
          ))}
        </div>
      </div>
    </footer>
  )
}
