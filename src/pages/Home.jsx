import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import { useState } from 'react'
import ProductCard from '@/components/ui/ProductCard'
import SkeletonCard from '@/components/ui/SkeletonCard'
import Stars from '@/components/ui/Stars'
import { useProducts } from '@/hooks/useProducts'
import { C, FONT } from '@/constants/theme'

const TESTIMONIALS = [
  { name: 'Priya S.', skin: 'Sensitive', city: 'Mumbai',    rating: 5, text: 'My skin has never felt this calm. The Bakuchiol serum is absolutely transformative — zero irritation, maximum glow.' },
  { name: 'Aditi R.', skin: 'Combination', city:'Bangalore', rating: 5, text: 'VerdeBliss converted me to clean beauty. The textures are so luxurious and the results are absolutely real.' },
  { name: 'Meera P.', skin: 'Dry', city: 'Delhi',           rating: 5, text: 'I\'ve tried so many moisturisers. The Rose Hip Glow is the only one that truly delivers on deep, lasting hydration.' },
]

export default function Home() {
  const navigate = useNavigate()
  const { products, loading } = useProducts({ sortBy: 'Bestselling' })
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  return (
    <div style={{ background: C.bg }}>
      {/* ── Hero ── */}
      <section style={{ background: `linear-gradient(135deg, ${C.forest} 0%, #1B3022 55%, #2D4A32 100%)`, minHeight: '88vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', padding: '80px 24px' }}>
        <div style={{ position: 'absolute', top: -120, right: -80, width: 520, height: 520, borderRadius: '50%', background: 'rgba(255,255,255,0.025)' }} />
        <div style={{ position: 'absolute', bottom: -100, left: 160, width: 360, height: 360, borderRadius: '50%', background: 'rgba(125,155,118,0.07)' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9 }}>
            <div style={{ fontSize: 10, color: C.sage, letterSpacing: '0.18em', marginBottom: 20, fontWeight: 600 }}>✦ CERTIFIED ORGANIC &nbsp;·&nbsp; CRUELTY-FREE &nbsp;·&nbsp; VEGAN ✦</div>
            <h1 style={{ fontFamily: FONT.serif, fontSize: 'clamp(44px, 5.5vw, 76px)', color: 'white', lineHeight: 1.0, margin: '0 0 24px', fontWeight: 400 }}>
              Pure.<br /><em style={{ color: C.sage }}>Botanical.</em><br />Radiant.
            </h1>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, marginBottom: 40, maxWidth: 420 }}>
              Luxury skincare rooted in nature. Formulated with the finest certified organic botanicals — because your skin deserves the purest care.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <motion.button whileHover={{ x: 4 }} whileTap={{ scale: 0.97 }} onClick={() => navigate('/products')}
                style={{ background: C.terra, color: 'white', border: 'none', borderRadius: 10, padding: '14px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit', letterSpacing: '0.02em' }}>
                Shop the Collection <ArrowRight size={15} />
              </motion.button>
            </div>
            <div style={{ display: 'flex', gap: 36, marginTop: 52 }}>
              {[['500+', 'Organic Ingredients'], ['4.8★', 'Average Rating'], ['50K+', 'Happy Customers']].map(([n, l]) => (
                <div key={l}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: 'white', fontFamily: FONT.serif }}>{n}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2, letterSpacing: '0.04em' }}>{l}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, delay: 0.15 }} style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <div style={{ width: 360, height: 360, borderRadius: '50%', background: 'rgba(125,155,118,0.1)', border: '1px solid rgba(125,155,118,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 270, height: 270, borderRadius: '50%', background: 'rgba(125,155,118,0.15)', border: '1px solid rgba(125,155,118,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} style={{ fontSize: 110, filter: 'drop-shadow(0 8px 28px rgba(0,0,0,0.25))' }}>🌿</motion.div>
              </div>
            </div>
            {[
              { label: 'Bakuchiol Serum', sub: 'Best Seller ✦', pos: { top: 16, left: -28 }, em: '✨' },
              { label: 'SPF 50 Shield',  sub: '4.9★ Rated',    pos: { bottom: 50, right: -24 }, em: '☀️' },
            ].map(({ label, sub, pos, em }, i) => (
              <motion.div key={label} animate={{ y: [0, -7, 0] }} transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 1.2 }}
                style={{ position: 'absolute', ...pos, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 12, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 22 }}>{em}</span>
                <div>
                  <div style={{ fontSize: 12, color: 'white', fontWeight: 500 }}>{label}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>{sub}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '88px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontSize: 10, color: C.terra, letterSpacing: '0.14em', marginBottom: 10, fontWeight: 600 }}>CURATED FOR YOU</div>
          <h2 style={{ fontFamily: FONT.serif, fontSize: 44, color: C.text, margin: '0 0 12px', fontWeight: 400 }}>The Collection</h2>
          <p style={{ fontSize: 14, color: C.muted, maxWidth: 420, margin: '0 auto', lineHeight: 1.7 }}>Every formula crafted from certified organic botanicals, dermatologist-approved and loved by thousands.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : products.slice(0, 6).map((p) => <ProductCard key={p.id} product={p} />)
          }
        </div>
        <div style={{ textAlign: 'center', marginTop: 44 }}>
          <button onClick={() => navigate('/products')} style={{ background: 'none', border: `2px solid ${C.forest}`, color: C.forest, borderRadius: 10, padding: '12px 32px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            View All Products <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* ── Philosophy ── */}
      <section style={{ background: C.forest, padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, color: C.sage, letterSpacing: '0.14em', marginBottom: 12, fontWeight: 600 }}>OUR PHILOSOPHY</div>
            <h2 style={{ fontFamily: FONT.serif, fontSize: 44, color: 'white', margin: '0 0 20px', fontWeight: 400, lineHeight: 1.08 }}>Beauty that honours the earth</h2>
            <p style={{ color: 'rgba(255,255,255,0.62)', lineHeight: 1.85, fontSize: 15, marginBottom: 28 }}>We believe luxury and sustainability are kindred spirits. Every VerdeBliss formula is crafted from certified organic botanicals, never tested on animals, and packaged in eco-conscious materials.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[['🌱', '100% Natural Origin'], ['🐰', 'Never Tested on Animals'], ['♻️', 'Eco Packaging'], ['🏆', 'Dermatologist Approved']].map(([e, l]) => (
                <div key={l} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)' }}>
                  <span style={{ fontSize: 16 }}>{e}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {['🌿', '🌸', '🍯', '🌺'].map((e, i) => (
              <motion.div key={i} whileHover={{ scale: 1.04 }}
                style={{ background: `rgba(255,255,255,${0.04 + i * 0.018})`, borderRadius: 16, height: 148, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52, border: '1px solid rgba(255,255,255,0.07)' }}>
                {e}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '88px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontSize: 10, color: C.terra, letterSpacing: '0.14em', marginBottom: 10, fontWeight: 600 }}>REAL RESULTS</div>
          <h2 style={{ fontFamily: FONT.serif, fontSize: 44, color: C.text, margin: 0, fontWeight: 400 }}>Loved by thousands</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {TESTIMONIALS.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
              style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28 }}>
              <Stars rating={t.rating} size={14} />
              <p style={{ fontSize: 16, color: C.text, lineHeight: 1.7, margin: '16px 0', fontStyle: 'italic', fontFamily: FONT.serif }}>&ldquo;{t.text}&rdquo;</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: C.sagePale, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: C.forest }}>{t.name[0]}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{t.skin} skin · {t.city}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section style={{ background: C.ivory, padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 10, color: C.terra, letterSpacing: '0.14em', marginBottom: 10, fontWeight: 600 }}>JOIN THE CIRCLE</div>
        <h2 style={{ fontFamily: FONT.serif, fontSize: 34, color: C.text, margin: '0 0 8px', fontWeight: 400 }}>Subscribe &amp; earn 50 bonus points</h2>
        <p style={{ fontSize: 14, color: C.muted, marginBottom: 28 }}>New launches, rituals, and exclusive offers — delivered to your inbox.</p>
        {subscribed ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#EBF0E9', borderRadius: 10, padding: '12px 24px', color: C.forest, fontWeight: 500 }}>
            <Check size={16} /> You&apos;re on the list! 50 points added soon.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', maxWidth: 400, margin: '0 auto' }}>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com"
              style={{ flex: 1, padding: '12px 18px', border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: 'white', color: C.text }} />
            <button onClick={() => setSubscribed(true)}
              style={{ background: C.forest, color: 'white', border: 'none', borderRadius: 10, padding: '12px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
              Subscribe
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
