import Link from 'next/link'
import { ArrowRight, XCircle } from 'lucide-react'
import IngredientCard from '@/components/ui/IngredientCard'
import FadeIn from '@/components/ui/FadeIn'

export const revalidate = 3600

export const metadata = {
  title: 'Our Ingredients — Hero Botanicals',
  description:
    'The eight hero ingredients behind every VerdeBliss formula — what they do, where they come from, and the science behind them.',
  alternates: { canonical: 'https://www.verdebliss.com/ingredients' },
}

const HERO_INGREDIENTS = [
  {
    name: 'Bakuchiol',
    desc: 'A plant-based retinol alternative from the Babchi seed. Renews skin and softens fine lines without irritation. Suitable during pregnancy.',
    source: 'Karnataka, India',
    role: 'Renewal · Anti-ageing',
    roleColor: '#2d4a32',
  },
  {
    name: 'Rose Hip',
    desc: 'Cold-pressed oil rich in vitamin C, A, and essential fatty acids. Supports cellular turnover and visible radiance.',
    source: 'Sikkim, India',
    role: 'Brightening · Hydration',
    roleColor: '#c07a5a',
  },
  {
    name: 'Green Tea',
    desc: 'EGCG-rich extract calms inflammation, controls excess sebum, and shields against environmental stress.',
    source: 'Munnar, India',
    role: 'Antioxidant · Sebum control',
    roleColor: '#4a6844',
  },
  {
    name: 'Turmeric',
    desc: 'Curcumin-active rhizome extract with potent anti-inflammatory and brightening action — used in Ayurveda for centuries.',
    source: 'Erode, India',
    role: 'Brightening · Calming',
    roleColor: '#bfa06a',
  },
  {
    name: 'Zinc Oxide',
    desc: 'Mineral broad-spectrum SPF that reflects UVA + UVB without absorbing into the bloodstream. Reef-safe.',
    source: 'Pharmaceutical-grade, USA',
    role: 'SPF · Soothing',
    roleColor: '#5c7a52',
  },
  {
    name: 'Niacinamide',
    desc: 'Vitamin B3 derivative. Refines pore appearance, balances oil, and strengthens the skin barrier.',
    source: 'Synthesised, EU',
    role: 'Pore refinement · Barrier',
    roleColor: '#2d4a32',
  },
  {
    name: 'Acai Berry',
    desc: 'Antioxidant-dense Amazonian superfruit. Polyphenol content supports skin elasticity and protects against free radicals.',
    source: 'Brazil',
    role: 'Antioxidant · Plumping',
    roleColor: '#6644a0',
  },
  {
    name: 'Shea Butter',
    desc: 'Unrefined African shea — vitamins A, E, F. Deeply nourishes and reinforces the skin barrier overnight.',
    source: 'Ghana',
    role: 'Nourishment · Barrier repair',
    roleColor: '#c07a5a',
  },
]

const NEVER_LIST = [
  'Parabens',
  'Sulphates',
  'Phthalates',
  'Synthetic Fragrance',
  'Mineral Oil',
  'Formaldehyde',
  'Triclosan',
  'Microbeads',
  'Animal Testing',
]

export default function IngredientsPage() {
  return (
    <div className="bg-bg">
      {/* Hero */}
      <section className="editorial-hero">
        <div className="editorial-hero__inner">
          <FadeIn>
            <p className="editorial-hero__kicker">EVERY FORMULA. EVERY BOTANICAL.</p>
            <h1 className="editorial-hero__title">Our Ingredients</h1>
            <p className="editorial-hero__copy">
              Eight hero ingredients. We disclose source, role, and the actual science. No
              proprietary-blend hide-and-seek.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Ingredient grid */}
      <section className="site-container editorial-section">
        <div className="ingredients-grid">
          {HERO_INGREDIENTS.map((ing, i) => (
            <FadeIn key={ing.name} delay={i * 0.05}>
              <article className="ingredient-shell soft-card soft-card-hover">
                <IngredientCard ingredient={ing.name} description={ing.desc} imageHeight={150} />
                <div className="ingredient-shell__meta">
                  <div
                    className="mb-1 text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: ing.roleColor }}
                  >
                    {ing.role}
                  </div>
                  <div className="text-[11px] text-muted">
                    <span className="font-semibold text-light">Source:</span> {ing.source}
                  </div>
                </div>
              </article>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Forever-no list */}
      <section className="editorial-section editorial-section--tint px-4">
        <div className="site-container">
          <FadeIn>
            <header className="editorial-section-head">
              <p className="label-eyebrow mb-2.5">WHAT YOU&apos;LL NEVER FIND</p>
              <h2 className="h-section">Our forever-no list</h2>
              <p className="mx-auto mt-2 max-w-[500px] text-center text-sm text-muted">
                Every ingredient that will never appear in a VerdeBliss formula — no exceptions, no
                matter what the trend.
              </p>
            </header>
          </FadeIn>
          <FadeIn delay={0.1}>
            <ul className="never-grid">
              {NEVER_LIST.map((nope) => (
                <li key={nope} className="never-item">
                  <XCircle size={14} className="shrink-0 text-terra" />
                  {nope}
                </li>
              ))}
            </ul>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section className="editorial-cta">
        <FadeIn>
          <h2 className="mb-3 font-serif text-[clamp(1.5rem,2.5vw,2rem)] font-normal text-white">
            Find a product built around these
          </h2>
          <p className="mx-auto mb-7 max-w-[440px] text-center text-sm text-white/55">
            Every product page lists the full INCI breakdown — no proprietary blends, no marketing
            mystery.
          </p>
          <Link href="/products" className="btn-terra">
            Shop the collection <ArrowRight size={15} />
          </Link>
        </FadeIn>
      </section>
    </div>
  )
}
