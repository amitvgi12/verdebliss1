import { useSEO, PAGE_SEO } from '@/hooks/useSEO'
/**
 * Home.jsx
 *
 * BUG FIXED: Hero decorative circles had no z-index and sat ABOVE the CTA
 * button, swallowing click events at some viewport widths.
 * FIX: decorative circles get zIndex:0, content area gets zIndex:1.
 *
 * NEW: Ingredients section with SVG IngredientCard illustrations.
 * NEW: Hero shows serum.webp product image instead of emoji.
 */
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import { useState } from 'react'
import ProductCard from '@/components/ui/ProductCard'
import SkeletonCard from '@/components/ui/SkeletonCard'
import IngredientCard from '@/components/ui/IngredientCard'
import Stars from '@/components/ui/Stars'
import { useProducts } from '@/hooks/useProducts'
import { C, FONT } from '@/constants/theme'
import { useWindowWidth, BP } from '@/hooks/useWindowWidth'

const TESTIMONIALS = [
  { name:'Priya S.', skin:'Sensitive', city:'Mumbai', rating:5, text:'My skin has never felt this calm. The Bakuchiol serum is absolutely transformative — zero irritation, maximum glow.' },
  { name:'Aditi R.', skin:'Combination', city:'Bangalore', rating:5, text:'VerdeBliss converted me to clean beauty. The textures are so luxurious and the results are absolutely real.' },
  { name:'Meera P.', skin:'Dry', city:'Delhi', rating:5, text:'I\'ve tried so many moisturisers. The Rose Hip Glow is the only one that truly delivers on deep, lasting hydration.' },
]

const INGREDIENTS = [
  { name:'Bakuchiol',   desc:'Plant-based retinol alternative — renews without irritation.' },
  { name:'Rose Hip',    desc:'Rich in vitamin C and fatty acids for visible radiance.' },
  { name:'Green Tea',   desc:'Powerful antioxidant that calms inflammation and controls oil.' },
  { name:'Turmeric',    desc:'Ancient brightening spice with potent anti-inflammatory action.' },
  { name:'Zinc Oxide',  desc:'Mineral SPF shield that protects without clogging pores.' },
  { name:'Shea Butter', desc:'Deeply nourishing butter that restores the skin barrier overnight.' },
]

export default function Home() {
  useSEO(PAGE_SEO.home)
  const navigate = useNavigate()
  const width = useWindowWidth()
  const isMobile = width < BP.tablet
  const { products, loading } = useProducts({ sortBy: 'Bestselling' })
  const [email, setEmail]       = useState('')
  const [subscribed, setSubscribed] = useState(false)

  return (
    <div style={{ background: C.bg }}>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section style={{ background:`linear-gradient(135deg, ${C.forest} 0%, #1B3022 55%, #2D4A32 100%)`, minHeight:'88vh', display:'flex', alignItems:'center', position:'relative', overflow:'hidden', padding:'80px 16px' }}>

        {/* Decorative circles — z-index:0 so they NEVER block buttons */}
        <div style={{ position:'absolute', top:-120, right:-80, width:520, height:520, borderRadius:'50%', background:'rgba(255,255,255,0.025)', zIndex:0, pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-100, left:160, width:360, height:360, borderRadius:'50%', background:'rgba(125,155,118,0.07)', zIndex:0, pointerEvents:'none' }}/>

        {/* Content — z-index:1 so it always sits above decorative elements */}
        <div style={{ maxWidth:1200, margin:'0 auto', width:'100%', display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 48, alignItems:'center', position:'relative', zIndex:1 }}>
          <motion.div initial={{ opacity:0, x:-30 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.9 }}>
            <div style={{ fontSize:10, color:C.sage, letterSpacing:'0.18em', marginBottom:20, fontWeight:600 }}>✦ CERTIFIED ORGANIC &nbsp;·&nbsp; CRUELTY-FREE &nbsp;·&nbsp; VEGAN ✦</div>
            <h1 style={{ fontFamily:FONT.serif, fontSize:'clamp(40px,5.5vw,76px)', color:'white', lineHeight:1.0, margin:'0 0 24px', fontWeight:400 }}>
              Pure.<br/><em style={{ color:C.sage }}>Botanical.</em><br/>Radiant.
            </h1>
            <p style={{ fontSize:16, color:'rgba(255,255,255,0.6)', lineHeight:1.8, marginBottom:40, maxWidth:420 }}>
              Luxury skincare rooted in nature. Formulated with the finest certified organic botanicals.
            </p>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <motion.button
                whileHover={{ x:4 }} whileTap={{ scale:0.97 }}
                onClick={() => navigate('/products')}
                style={{ background:C.terra, color:'white', border:'none', borderRadius:10, padding:'14px 28px', fontSize:14, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:8, fontFamily:'inherit', letterSpacing:'0.02em' }}
              >
                Shop the Collection <ArrowRight size={15}/>
              </motion.button>
            </div>
            <div style={{ display:'flex', gap:36, marginTop:52, flexWrap:'wrap' }}>
              {[['500+','Organic Ingredients'],['4.8★','Average Rating'],['50K+','Happy Customers']].map(([n,l]) => (
                <div key={l}>
                  <div style={{ fontSize:24, fontWeight:700, color:C.gold, fontFamily:FONT.serif }}>{n}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginTop:2 }}>{l}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Hero product image — fills circle edge-to-edge */}
          <motion.div initial={{ opacity:0, scale:0.88 }} animate={{ opacity:1, scale:1 }} transition={{ duration:0.9, delay:0.15 }} style={{ display:'flex', justifyContent:'center', position:'relative' }}>
            {/* overflow:hidden clips image to circle, objectFit:cover fills it completely */}
            <motion.div animate={{ y:[0,-8,0] }} transition={{ duration:4, repeat:Infinity, ease:'easeInOut' }}
              style={{ width:'min(360px, 90vw)', height:'min(360px, 90vw)', borderRadius:'50%', border:'2px solid rgba(125,155,118,0.35)', overflow:'hidden', boxShadow:'0 24px 64px rgba(0,0,0,0.35)', flexShrink:0 }}>
              <img
                src="/images/products/serum.webp"
                alt="VerdeBliss Bakuchiol Serum"
                style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center', display:'block' }}
                onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.parentElement.style.cssText += 'background:rgba(125,155,118,0.15);display:flex;align-items:center;justify-content:center;font-size:110px'; e.currentTarget.parentElement.textContent='🌿' }}
              />
            </motion.div>

            {/* Floating tags */}
            {[
              { label:'Bakuchiol Serum', sub:'Best Seller ✦', pos:{ top:16, left:-20 }, em:'✨' },
              { label:'SPF 50 Shield',   sub:'4.9★ Rated',    pos:{ bottom:50, right:-12 }, em:'☀️' },
            ].map(({ label, sub, pos, em }, i) => (
              <motion.div key={label} animate={{ y:[0,-7,0] }} transition={{ duration:3+i, repeat:Infinity, ease:'easeInOut', delay:i*1.2 }}
                style={{ position:'absolute', ...pos, background:'rgba(255,255,255,0.1)', backdropFilter:'blur(14px)', border:'1px solid rgba(255,255,255,0.18)', borderRadius:12, padding:'10px 14px', display:'flex', gap:10, alignItems:'center' }}>
                <span style={{ fontSize:22 }}>{em}</span>
                <div>
                  <div style={{ fontSize:12, color:'white', fontWeight:500 }}>{label}</div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.55)' }}>{sub}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Featured Products ─────────────────────────────────────────── */}
      <section style={{ maxWidth:1200, margin:'0 auto', padding:'80px 16px' }}>
        <div style={{ textAlign:'center', marginBottom:52 }}>
          <div style={{ fontSize:10, color:C.terra, letterSpacing:'0.14em', marginBottom:10, fontWeight:600 }}>CURATED FOR YOU</div>
          <h2 style={{ fontFamily:FONT.serif, fontSize:'clamp(32px,4vw,44px)', color:C.text, margin:'0 0 12px', fontWeight:400 }}>The Collection</h2>
          <p style={{ fontSize:14, color:C.muted, maxWidth:420, margin:'0 auto', lineHeight:1.7 }}>Every formula crafted from certified organic botanicals, dermatologist-approved and loved by thousands.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:20 }}>
          {loading
            ? Array.from({ length:6 }).map((_,i) => <SkeletonCard key={i}/>)
            : products.slice(0,6).map((p) => <ProductCard key={p.id} product={p}/>)
          }
        </div>
        <div style={{ textAlign:'center', marginTop:40 }}>
          <button onClick={() => navigate('/products')} style={{ background:'none', border:`2px solid ${C.forest}`, color:C.forest, borderRadius:10, padding:'12px 32px', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:8 }}>
            View All Products <ArrowRight size={15}/>
          </button>
        </div>
      </section>

      {/* ── Key Ingredients ───────────────────────────────────────────── */}
      <section style={{ background:C.ivory, padding:'80px 16px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:52 }}>
            <div style={{ fontSize:10, color:C.terra, letterSpacing:'0.14em', marginBottom:10, fontWeight:600 }}>WHAT&apos;S INSIDE</div>
            <h2 style={{ fontFamily:FONT.serif, fontSize:'clamp(32px,4vw,44px)', color:C.text, margin:'0 0 12px', fontWeight:400 }}>Nature&apos;s Finest Ingredients</h2>
            <p style={{ fontSize:14, color:C.muted, maxWidth:460, margin:'0 auto', lineHeight:1.7 }}>Every formula begins with the most potent certified-organic ingredients the earth has to offer.</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(170px, 1fr))', gap:20 }}>
            {INGREDIENTS.map((ing, i) => (
              <motion.div key={ing.name} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} transition={{ delay: i*0.07 }} viewport={{ once:true }}>
                <IngredientCard ingredient={ing.name} description={ing.desc} imageHeight={140}/>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Philosophy ────────────────────────────────────────────────── */}
      <section style={{ background:C.forest, padding:'80px 16px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:48, alignItems:'center' }}>
          <div>
            <div style={{ fontSize:10, color:C.sage, letterSpacing:'0.14em', marginBottom:12, fontWeight:600 }}>OUR PHILOSOPHY</div>
            <h2 style={{ fontFamily:FONT.serif, fontSize:'clamp(28px,4vw,44px)', color:'white', margin:'0 0 20px', fontWeight:400, lineHeight:1.1 }}>Beauty that honours the earth</h2>
            <p style={{ color:'rgba(255,255,255,0.62)', lineHeight:1.85, fontSize:15, marginBottom:28 }}>Every VerdeBliss formula is crafted from certified organic botanicals, never tested on animals, and packaged in eco-conscious materials.</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[['🌱','95%+ Organic Ingredients'],['🐰','Cruelty-Free'],['♻️','Eco Packaging'],['🏆','Dermatologist OK']].map(([e,l]) => (
                <div key={l} style={{ display:'flex', gap:10, alignItems:'center', padding:'8px 12px', background:'rgba(255,255,255,0.05)', borderRadius:10, border:'1px solid rgba(255,255,255,0.07)' }}>
                  <span style={{ fontSize:16 }}>{e}</span>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.72)' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {['🌿','🌸','🍯','🌺'].map((e,i) => (
              <motion.div key={i} whileHover={{ scale:1.04 }} style={{ background:`rgba(255,255,255,${0.04+i*0.018})`, borderRadius:16, height:130, display:'flex', alignItems:'center', justifyContent:'center', fontSize:48, border:'1px solid rgba(255,255,255,0.07)' }}>
                {e}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────── */}
      <section style={{ maxWidth:1200, margin:'0 auto', padding:'80px 16px' }}>
        <div style={{ textAlign:'center', marginBottom:52 }}>
          <div style={{ fontSize:10, color:C.terra, letterSpacing:'0.14em', marginBottom:10, fontWeight:600 }}>REAL RESULTS</div>
          <h2 style={{ fontFamily:FONT.serif, fontSize:'clamp(32px,4vw,44px)', color:C.text, margin:0, fontWeight:400 }}>Loved by thousands</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:20 }}>
          {TESTIMONIALS.map((t,i) => (
            <motion.div key={i} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} transition={{ delay: i*0.1 }} viewport={{ once:true }}
              style={{ background:C.card, border:`1px solid ${C.border}`, borderLeft:`3px solid ${C.gold}`, borderRadius:16, padding:28 }}>
              <Stars rating={t.rating} size={14}/>
              <p style={{ fontSize:16, color:C.text, lineHeight:1.7, margin:'16px 0', fontStyle:'italic', fontFamily:FONT.serif }}>&ldquo;{t.text}&rdquo;</p>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:38, height:38, borderRadius:'50%', background:C.sagePale, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:600, color:C.forest }}>{t.name[0]}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{t.name}</div>
                  <div style={{ fontSize:11, color:C.muted }}>{t.skin} skin · {t.city}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>


          {/* 11.6 FTC + 11.9 Verified Purchase disclosure */}
          <p style={{ textAlign:'center', fontSize:11, color:C.light, marginTop:24, lineHeight:1.7 }}>
            All reviews are from verified purchasers. Results may vary based on individual skin type, usage, and lifestyle.
            Individual results are not guaranteed. *These statements have not been evaluated by a regulatory authority.
          </p>
      {/* ── Newsletter ────────────────────────────────────────────────── */}
      <section style={{ background:C.ivory, padding:'60px 16px', textAlign:'center' }}>
        <div style={{ fontSize:10, color:C.terra, letterSpacing:'0.14em', marginBottom:10, fontWeight:600 }}>JOIN THE CIRCLE</div>
        <h2 style={{ fontFamily:FONT.serif, fontSize:'clamp(24px,3vw,34px)', color:C.text, margin:'0 0 8px', fontWeight:400 }}>Subscribe &amp; earn 50 bonus points</h2>
        <p style={{ fontSize:14, color:C.muted, marginBottom:28 }}>New launches, rituals, and exclusive offers — delivered to your inbox.</p>
        {subscribed ? (
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#EBF0E9', borderRadius:10, padding:'12px 24px', color:C.forest, fontWeight:500 }}>
            <Check size={16}/> You&apos;re on the list! 50 points added soon.
          </div>
        ) : (
          <div style={{ display:'flex', gap:10, justifyContent:'center', maxWidth:400, margin:'0 auto', flexWrap:'wrap' }}>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com"
              style={{ flex:1, minWidth:180, padding:'12px 18px', border:`1px solid ${C.border}`, borderRadius:10, fontSize:14, outline:'none', fontFamily:'inherit', background:C.warmWhite, color:C.text }}/>
            <button onClick={() => setSubscribed(true)} style={{ background:C.gold, color:'white', border:'none', borderRadius:10, padding:'12px 22px', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
              Subscribe
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
