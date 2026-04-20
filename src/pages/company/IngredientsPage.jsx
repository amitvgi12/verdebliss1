import { useSEO, PAGE_SEO } from '@/hooks/useSEO'
/**
 * IngredientsPage.jsx — Full ingredient showcase
 * Route: /ingredients
 *
 * Uses IngredientCard which now shows real photographs from /public/ingredients/.
 * The card handles image → text layout internally, so this page only passes
 * the ingredient name + metadata and lets the card render the image.
 */
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import IngredientCard from '@/components/ui/IngredientCard'
import { C, FONT } from '@/constants/theme'

const INGREDIENTS = [
  {
    name: 'Bakuchiol',
    source: 'Psoralea corylifolia seed',
    benefit: 'Plant-based retinol — renews cells without irritation or sun sensitivity.',
    skin: 'All types, especially Sensitive',
  },
  {
    name: 'Rose Hip',
    source: 'Rosa canina fruit',
    benefit: 'Rich in vitamin C & essential fatty acids — fades pigmentation and boosts radiance.',
    skin: 'Dry, Dull',
  },
  {
    name: 'Green Tea',
    source: 'Camellia sinensis leaf',
    benefit: 'EGCG antioxidants neutralise free radicals — reduces redness and controls sebum.',
    skin: 'Oily, Combination',
  },
  {
    name: 'Turmeric',
    source: 'Curcuma longa root',
    benefit: 'Curcumin brightens and is anti-inflammatory — for clearer, more even skin.',
    skin: 'All types',
  },
  {
    name: 'Zinc Oxide',
    source: 'Mineral — naturally mined',
    benefit: 'Broad-spectrum SPF shield — reflects UV without penetrating the skin barrier.',
    skin: 'All types, especially Sensitive',
  },
  {
    name: 'Acai Berry',
    source: 'Euterpe oleracea fruit',
    benefit: 'Anthocyanins + omega fatty acids — deeply nourishes and plumps lip tissue.',
    skin: 'Dry, Mature',
  },
  {
    name: 'Niacinamide',
    source: 'Vitamin B3 (plant-derived)',
    benefit: '10% concentration minimises pores, regulates oil, strengthens the skin barrier.',
    skin: 'Oily, Combination',
  },
  {
    name: 'Shea Butter',
    source: 'Vitellaria paradoxa nut',
    benefit: 'Fatty acids + vitamins A/E — intensive barrier repair while you sleep.',
    skin: 'Dry, Sensitive',
  },
]

const PRINCIPLES = [
  { title: 'No Parabens',               desc: 'We never use parabens as preservatives. Our formulas use plant-derived alternatives.' },
  { title: 'No Sulfates',               desc: 'Sodium lauryl sulfate strips your skin barrier. Our cleansers never use it.' },
  { title: 'No Synthetic Fragrance',    desc: 'All scent comes from the botanicals themselves — never synthetic perfume compounds.' },
  { title: 'No Mineral Oil',            desc: 'We use plant-based oils that nourish, not petroleum-derived mineral oil that clogs.' },
  { title: 'No Formaldehyde Releasers', desc: 'Zero DMDM hydantoin or diazolidinyl urea — known irritants we refuse to touch.' },
  { title: 'No Animal Testing',         desc: 'VerdeBliss has never and will never conduct or commission animal testing.' },
]

export default function IngredientsPage() {
  useSEO(PAGE_SEO.ingredients)
  const navigate = useNavigate()

  return (
    <div style={{ background: C.bg }}>

      {/* ── Hero ── */}
      <section style={{ background: `linear-gradient(150deg, ${C.forest} 0%, #1A2E1E 100%)`, padding: '100px 24px 80px', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div style={{ fontSize: 10, color: C.sage, letterSpacing: '0.16em', marginBottom: 16, fontWeight: 600 }}>TRANSPARENCY FIRST</div>
          <h1 style={{ fontFamily: FONT.serif, fontSize: 'clamp(40px,6vw,80px)', color: 'white', fontWeight: 400, margin: '0 0 24px', lineHeight: 1.0 }}>
            Our Ingredients
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', maxWidth: 540, margin: '0 auto', lineHeight: 1.8 }}>
            Every ingredient has a story. We believe you deserve to know exactly what you&apos;re putting on your skin and why.
          </p>
        </motion.div>
      </section>

      {/* ── Ingredient cards ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontSize: 10, color: C.terra, letterSpacing: '0.14em', marginBottom: 10, fontWeight: 600 }}>THE BOTANICALS</div>
          <h2 style={{ fontFamily: FONT.serif, fontSize: 'clamp(32px,4vw,44px)', color: C.text, fontWeight: 400 }}>Key Active Ingredients</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
          {INGREDIENTS.map((ing, i) => (
            <motion.div
              key={ing.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              viewport={{ once: true }}
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              {/*
                IngredientCard renders image + name + description as one card.
                Below the card we add the SOURCE and BEST FOR metadata that
                only appears on the full ingredients page (not on the home page
                mini-cards where just image + name is shown).
              */}
              <div style={{ background: C.ivory, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', transition: 'box-shadow 0.2s, transform 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 10px 32px rgba(0,0,0,0.09)'; e.currentTarget.style.transform = 'translateY(-4px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                {/* Photo — fills card top, 200px tall */}
                <IngredientCard ingredient={ing.name} imageHeight={200} />

                {/* Metadata below the image */}
                <div style={{ padding: '16px 20px 22px', borderTop: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: '0.07em', marginBottom: 3 }}>SOURCE</div>
                  <div style={{ fontSize: 12, color: C.terra, fontStyle: 'italic', marginBottom: 12 }}>{ing.source}</div>

                  <div style={{ fontSize: 13, color: C.text, lineHeight: 1.65, marginBottom: 14 }}>{ing.benefit}</div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: '0.06em' }}>BEST FOR</div>
                    <div style={{ fontSize: 12, background: C.sagePale, color: C.forest, padding: '3px 12px', borderRadius: 99, fontWeight: 500 }}>
                      {ing.skin}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── What we never use ── */}
      <section style={{ background: C.ivory, padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 10, color: C.terra, letterSpacing: '0.14em', marginBottom: 10, fontWeight: 600 }}>OUR PROMISE</div>
            <h2 style={{ fontFamily: FONT.serif, fontSize: 'clamp(28px,4vw,44px)', color: C.text, fontWeight: 400 }}>What we will never use</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {PRINCIPLES.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                viewport={{ once: true }}
                style={{ background: C.ivory, borderRadius: 14, padding: '20px 24px', border: `1px solid ${C.border}` }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#FCEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#A32D2D', flexShrink: 0, marginTop: 1 }}>
                    ✕
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 6 }}>{p.title}</div>
                    <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.65 }}>{p.desc}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '72px 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: FONT.serif, fontSize: 'clamp(28px,4vw,40px)', color: C.text, margin: '0 0 16px', fontWeight: 400 }}>
          See these ingredients in action
        </h2>
        <p style={{ fontSize: 15, color: C.muted, marginBottom: 28 }}>Every VerdeBliss product is built around one or more of these certified organic actives.</p>
        <button
          onClick={() => navigate('/products')}
          style={{ background: C.forest, color: 'white', border: 'none', borderRadius: 10, padding: '14px 32px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Shop the Collection
        </button>
      </section>
    </div>
  )
}
