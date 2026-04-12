/**
 * Sustainability.jsx — Environmental commitment page
 * Route: /sustainability
 */
import { motion } from 'framer-motion'
import { C, FONT } from '@/constants/theme'

const PILLARS = [
  { icon: '🌱', title: 'Certified Organic Sourcing', body: 'Every botanical is sourced from certified organic farms with fair-trade agreements. We visit our suppliers annually and publish audit reports.' },
  { icon: '♻️', title: 'Circular Packaging',         body: 'Glass bottles, aluminium caps, and paper labels. Our packaging is 92% recyclable or refillable. We\'re targeting 100% by 2027.' },
  { icon: '💧', title: 'Water Stewardship',          body: 'Our Pune lab uses a closed-loop water system that recycles 84% of process water. We offset the remainder via local watershed projects.' },
  { icon: '🌍', title: 'Carbon Neutral by 2027',     body: 'We\'ve reduced scope 1+2 emissions by 41% since 2022. Remaining emissions are offset via verified reforestation in the Western Ghats.' },
  { icon: '🐝', title: 'Biodiversity Commitment',    body: 'We partner with 12 organic farms that maintain pollinator corridors. For every product sold, ₹5 goes to a native seed-bank programme.' },
  { icon: '👩‍🌾', title: 'Farmer Partnerships',       body: 'Our 34 farming partners receive 23% above fair-trade price benchmarks. We provide interest-free equipment loans and organic certification support.' },
]

const METRICS = [
  { value: '92%',   label: 'Recyclable Packaging' },
  { value: '84%',   label: 'Water Recycled in Production' },
  { value: '41%',   label: 'Scope 1+2 Emission Reduction since 2022' },
  { value: '34',    label: 'Organic Farming Partners' },
  { value: '12',    label: 'Pollinator Corridors Maintained' },
  { value: '₹5',   label: 'Per product to seed-bank programme' },
]

export default function Sustainability() {
  return (
    <div style={{ background: C.bg }}>

      {/* Hero */}
      <section style={{ background: `linear-gradient(150deg, #1A3320 0%, ${C.forest} 100%)`, padding: '100px 24px 80px', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div style={{ fontSize: 10, color: C.sage, letterSpacing: '0.16em', marginBottom: 16, fontWeight: 600 }}>THE EARTH FIRST</div>
          <h1 style={{ fontFamily: FONT.serif, fontSize: 'clamp(40px,6vw,80px)', color: 'white', fontWeight: 400, margin: '0 0 24px', lineHeight: 1.0 }}>Sustainability</h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', maxWidth: 560, margin: '0 auto', lineHeight: 1.8 }}>
            Our commitment to the planet is not a marketing message. It is written into every formula, every package, and every supply-chain decision we make.
          </p>
        </motion.div>
      </section>

      {/* Metrics */}
      <section style={{ background: C.forest, padding: '0 24px 60px', marginTop: -1 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 20, paddingTop: 40 }}>
          {METRICS.map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} viewport={{ once: true }}
              style={{ textAlign: 'center', padding: '24px 16px', background: 'rgba(255,255,255,0.06)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontFamily: FONT.serif, fontSize: 36, fontWeight: 600, color: 'white', marginBottom: 8 }}>{m.value}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>{m.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pillars */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontSize: 10, color: C.terra, letterSpacing: '0.14em', marginBottom: 10, fontWeight: 600 }}>OUR COMMITMENTS</div>
          <h2 style={{ fontFamily: FONT.serif, fontSize: 44, color: C.text, fontWeight: 400 }}>Six pillars of responsibility</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {PILLARS.map((p, i) => (
            <motion.div key={p.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} viewport={{ once: true }}
              style={{ background: 'white', borderRadius: 16, padding: '28px', border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>{p.icon}</div>
              <div style={{ fontSize: 17, fontWeight: 600, color: C.text, marginBottom: 10, fontFamily: FONT.serif }}>{p.title}</div>
              <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.75 }}>{p.body}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Progress bar section */}
      <section style={{ background: C.ivory, padding: '72px 24px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 10, color: C.terra, letterSpacing: '0.14em', marginBottom: 10, fontWeight: 600 }}>2027 ROADMAP</div>
            <h2 style={{ fontFamily: FONT.serif, fontSize: 44, color: C.text, fontWeight: 400 }}>Progress toward our goals</h2>
          </div>
          {[
            { label: 'Recyclable packaging', current: 92, target: 100 },
            { label: 'Carbon neutral operations', current: 59, target: 100 },
            { label: 'Renewable energy in lab', current: 73, target: 100 },
            { label: 'Refillable product range', current: 25, target: 60 },
          ].map((g, i) => (
            <div key={g.label} style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{g.label}</span>
                <span style={{ fontSize: 14, color: C.forest, fontWeight: 700 }}>{g.current}%</span>
              </div>
              <div style={{ height: 8, background: C.border, borderRadius: 99, overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} whileInView={{ width: `${g.current}%` }} transition={{ duration: 1, delay: i * 0.1 }} viewport={{ once: true }}
                  style={{ height: '100%', background: `linear-gradient(90deg, ${C.sage}, ${C.forest})`, borderRadius: 99 }} />
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Target: {g.target}% by 2027</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
