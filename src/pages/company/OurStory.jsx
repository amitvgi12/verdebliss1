import { useSEO, PAGE_SEO } from '@/hooks/useSEO'
/**
 * OurStory.jsx — Brand story page
 * Route: /our-story
 */
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { C, FONT } from '@/constants/theme'

const TIMELINE = [
  { year: '2019', title: 'The Idea', body: 'Founded in a kitchen in Pune, VerdeBliss began as a personal quest — founder Kavya Menon could not find a serum gentle enough for her sensitive skin that was also genuinely organic.' },
  { year: '2020', title: 'First Formula', body: 'After 14 months of botanical research and 280 test batches, the Bakuchiol Renewal Serum was born. Word spread quickly through dermatology communities.' },
  { year: '2021', title: 'Certified Organic', body: 'VerdeBliss received USDA Organic and Ecocert certifications — one of the first Indian skincare brands to achieve both in the same year.' },
  { year: '2022', title: 'The Full Range', body: 'Eight hero products launched. The brand crossed ₹1 crore in revenue within 90 days, driven entirely by word-of-mouth and community trust.' },
  { year: '2024', title: 'Going Global', body: 'VerdeBliss began shipping to the UK, UAE, and Singapore. The philosophy remained unchanged: nature first, luxury second, profit never at the cost of either.' },
  { year: '2026', title: 'Today', body: 'Over 50,000 customers. Zero compromises on ingredients. Still founded on the belief that beauty and integrity are not opposites — they are the same thing.' },
]

const TEAM = [
  { name: 'Kavya Menon', role: 'Founder & Chief Botanist', initial: 'K', bg: '#EAF0E8' },
  { name: 'Rohan Pillai', role: 'Head of Formulation', initial: 'R', bg: '#F6EDE8' },
  { name: 'Ananya Sharma', role: 'Sustainability Director', initial: 'A', bg: '#E8EFF5' },
  { name: 'Dev Krishnan', role: 'Head of Experience', initial: 'D', bg: '#F5EBF0' },
]

export default function OurStory() {
  useSEO(PAGE_SEO.ourStory)
  const navigate = useNavigate()
  return (
    <div style={{ background: C.bg }}>

      {/* Hero */}
      <section style={{ background: `linear-gradient(150deg, ${C.forest} 0%, #1A2E1E 100%)`, padding: '100px 24px 80px', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div style={{ fontSize: 10, color: C.sage, letterSpacing: '0.16em', marginBottom: 16, fontWeight: 600 }}>SINCE 2019</div>
          <h1 style={{ fontFamily: FONT.serif, fontSize: 'clamp(40px,6vw,80px)', color: 'white', fontWeight: 400, margin: '0 0 24px', lineHeight: 1.0 }}>Our Story</h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', maxWidth: 560, margin: '0 auto', lineHeight: 1.8 }}>
            Born from a personal skin struggle. Built on botanical science. Committed forever to the earth that feeds us.
          </p>
        </motion.div>
      </section>

      {/* Mission statement */}
      <section style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 10, color: C.terra, letterSpacing: '0.14em', marginBottom: 16, fontWeight: 600 }}>OUR MISSION</div>
        <p style={{ fontFamily: FONT.serif, fontSize: 'clamp(22px,3vw,34px)', color: C.text, lineHeight: 1.5, fontWeight: 400, fontStyle: 'italic' }}>
          &ldquo;To prove that the most effective skincare is also the kindest — to your skin, to animals, and to the planet.&rdquo;
        </p>
        <div style={{ marginTop: 24, fontSize: 14, color: C.muted }}>— Kavya Menon, Founder</div>
      </section>

      {/* Timeline */}
      <section style={{ background: C.ivory, padding: '80px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 10, color: C.terra, letterSpacing: '0.14em', marginBottom: 10, fontWeight: 600 }}>THE JOURNEY</div>
            <h2 style={{ fontFamily: FONT.serif, fontSize: 44, color: C.text, fontWeight: 400 }}>From kitchen to the world</h2>
          </div>
          <div style={{ position: 'relative' }}>
            {/* Vertical line */}
            <div style={{ position: 'absolute', left: 40, top: 0, bottom: 0, width: 1, background: C.border }} />
            {TIMELINE.map((t, i) => (
              <motion.div key={t.year} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} viewport={{ once: true }}
                style={{ display: 'flex', gap: 32, marginBottom: 48, position: 'relative' }}>
                {/* Year circle */}
                <div style={{ width: 80, flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 4 }}>
                  <div style={{ background: C.forest, color: 'white', borderRadius: 99, padding: '4px 12px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', zIndex: 1 }}>{t.year}</div>
                </div>
                <div style={{ flex: 1, background: 'white', borderRadius: 16, padding: '20px 24px', border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 8, fontFamily: FONT.serif }}>{t.title}</div>
                  <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.7 }}>{t.body}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontSize: 10, color: C.terra, letterSpacing: '0.14em', marginBottom: 10, fontWeight: 600 }}>THE PEOPLE</div>
          <h2 style={{ fontFamily: FONT.serif, fontSize: 44, color: C.text, fontWeight: 400 }}>Who we are</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
          {TEAM.map((m, i) => (
            <motion.div key={m.name} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
              style={{ background: 'white', borderRadius: 16, padding: 28, border: `1px solid ${C.border}`, textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: C.forest, margin: '0 auto 16px', fontFamily: FONT.serif }}>
                {m.initial}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 4, fontFamily: FONT.serif }}>{m.name}</div>
              <div style={{ fontSize: 13, color: C.muted }}>{m.role}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: C.forest, padding: '72px 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: FONT.serif, fontSize: 40, color: 'white', margin: '0 0 16px', fontWeight: 400 }}>Ready to experience the difference?</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: 16 }}>Every product tells the story of a seed, a soil, and a scientist who cares.</p>
        <button onClick={() => navigate('/products')} style={{ background: C.terra, color: 'white', border: 'none', borderRadius: 10, padding: '14px 32px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          Shop the Collection <ArrowRight size={16} />
        </button>
      </section>
    </div>
  )
}
