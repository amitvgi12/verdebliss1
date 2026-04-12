/**
 * Press.jsx — Media & press page
 * Route: /press
 */
import { motion } from 'framer-motion'
import { Download } from 'lucide-react'
import { useToastStore } from '@/store/toastStore'
import { C, FONT } from '@/constants/theme'

const COVERAGE = [
  { outlet: 'Vogue India',     date: 'March 2026',    title: '"The Indian skincare brand that\'s rewriting the rules of clean beauty"',       logo: 'V' },
  { outlet: 'Forbes India',    date: 'January 2026',  title: '"50 startups to watch in 2026 — VerdeBliss leads the organic beauty wave"',      logo: 'F' },
  { outlet: 'The Hindu',       date: 'November 2025', title: '"From Pune kitchen to global shelves: the VerdeBliss story"',                    logo: 'TH' },
  { outlet: 'Femina',          date: 'October 2025',  title: '"Best Organic Serum 2025 — Bakuchiol Renewal Serum wins Gold"',                  logo: 'Fe' },
  { outlet: 'Business Standard',date: 'August 2025',  title: '"VerdeBliss crosses ₹10 crore ARR on 100% organic growth"',                     logo: 'BS' },
  { outlet: 'Mint Lounge',     date: 'June 2025',     title: '"The science behind India\'s best-selling plant-based retinol alternative"',     logo: 'M' },
]

const AWARDS = [
  { year: '2025', award: 'Best Organic Skincare Brand — Femina Beauty Awards', category: 'Brand' },
  { year: '2025', award: 'Gold — Best Face Serum — Vogue Beauty Awards',       category: 'Product' },
  { year: '2024', award: 'Ecocert Cosmos Organic Certification',               category: 'Certification' },
  { year: '2024', award: 'PETA Beauty Without Bunnies — Cruelty-Free',         category: 'Ethics' },
  { year: '2023', award: 'USDA Organic Certification',                         category: 'Certification' },
  { year: '2022', award: 'Shark Tank India — Investor Choice Pick',            category: 'Recognition' },
]

export default function Press() {
  const toast = useToastStore((s) => s.push)
  return (
    <div style={{ background: C.bg }}>

      {/* Hero */}
      <section style={{ background: `linear-gradient(150deg, ${C.forest} 0%, #1A2E1E 100%)`, padding: '100px 24px 80px', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ fontSize: 10, color: C.sage, letterSpacing: '0.16em', marginBottom: 16, fontWeight: 600 }}>MEDIA & PRESS</div>
          <h1 style={{ fontFamily: FONT.serif, fontSize: 'clamp(40px,6vw,80px)', color: 'white', fontWeight: 400, margin: '0 0 24px' }}>Press Room</h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', maxWidth: 500, margin: '0 auto 36px', lineHeight: 1.8 }}>
            For press enquiries, interview requests, and brand assets, contact us at press@verdebliss.in
          </p>
          <button onClick={() => toast('Press kit download coming soon! Email press@verdebliss.in', 'info')}
            style={{ background: C.terra, color: 'white', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Download size={15} /> Download Press Kit
          </button>
        </motion.div>
      </section>

      {/* Coverage */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontSize: 10, color: C.terra, letterSpacing: '0.14em', marginBottom: 10, fontWeight: 600 }}>MEDIA COVERAGE</div>
          <h2 style={{ fontFamily: FONT.serif, fontSize: 44, color: C.text, fontWeight: 400 }}>As seen in</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {COVERAGE.map((c, i) => (
            <motion.div key={c.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} viewport={{ once: true }}
              style={{ background: 'white', borderRadius: 14, padding: '24px', border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: C.sagePale, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: C.forest, flexShrink: 0 }}>
                  {c.logo}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{c.outlet}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{c.date}</div>
                </div>
              </div>
              <p style={{ fontSize: 14, color: C.text, lineHeight: 1.6, fontStyle: 'italic', fontFamily: FONT.serif }}>{c.title}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Awards */}
      <section style={{ background: C.ivory, padding: '80px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 10, color: C.terra, letterSpacing: '0.14em', marginBottom: 10, fontWeight: 600 }}>RECOGNITION</div>
            <h2 style={{ fontFamily: FONT.serif, fontSize: 44, color: C.text, fontWeight: 400 }}>Awards & certifications</h2>
          </div>
          {AWARDS.map((a, i) => (
            <motion.div key={a.award} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }} viewport={{ once: true }}
              style={{ display: 'flex', gap: 20, padding: '20px 0', borderBottom: `1px solid ${C.border}`, alignItems: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.forest, minWidth: 44, textAlign: 'center' }}>{a.year}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, color: C.text, fontWeight: 500, marginBottom: 4 }}>{a.award}</div>
                <span style={{ fontSize: 11, background: C.sagePale, color: C.forest, padding: '2px 10px', borderRadius: 99, fontWeight: 600 }}>{a.category}</span>
              </div>
              <div style={{ fontSize: 20 }}>🏆</div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}
