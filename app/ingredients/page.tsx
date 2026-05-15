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
      <section className="bg-forest px-4 py-14 text-center">
        <div className="container-content">
          <FadeIn>
            <p className="mb-3 text-[10px] font-semibold tracking-[0.16em] text-sage">
              EVERY FORMULA. EVERY BOTANICAL.
            </p>
            <h1 className="m-0 mb-4 font-serif text-[clamp(2rem,3.5vw,3rem)] font-normal leading-[1.05] text-white">
              Our Ingredients
            </h1>
            <p className="mx-auto max-w-[600px] text-center text-sm leading-relaxed text-white/65">
              Eight hero ingredients. We disclose source, role, and the actual science. No
              proprietary-blend hide-and-seek.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Ingredient grid */}
      <section className="container-content py-14">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
          {HERO_INGREDIENTS.map((ing, i) => (
            <FadeIn key={ing.name} delay={i * 0.05}>
              <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_2px_10px_rgba(45,74,50,0.05)] transition hover:-translate-y-1 hover:shadow-[0_10px_32px_rgba(45,74,50,0.1)]">
                <IngredientCard ingredient={ing.name} description={ing.desc} imageHeight={160} />
                <div className="border-t border-border bg-bg px-4 py-3">
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
      <section className="bg-ivory px-4 py-14">
        <div className="container-content">
          <FadeIn>
            <header className="mb-10 text-center">
              <p className="label-eyebrow mb-2.5">WHAT YOU&apos;LL NEVER FIND</p>
              <h2 className="h-section">Our forever-no list</h2>
              <p className="mx-auto mt-2 max-w-[500px] text-center text-sm text-muted">
                Every ingredient that will never appear in a VerdeBliss formula — no exceptions, no
                matter what the trend.
              </p>
            </header>
          </FadeIn>
          <FadeIn delay={0.1}>
            <ul className="mx-auto grid max-w-[700px] grid-cols-2 gap-3 sm:grid-cols-3">
              {NEVER_LIST.map((nope) => (
                <li
                  key={nope}
                  className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-3 text-xs font-semibold text-muted transition hover:border-terra/30 hover:bg-terraPale/30"
                >
                  <XCircle size={14} className="shrink-0 text-terra" />
                  {nope}
                </li>
              ))}
            </ul>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-forest px-4 py-14 text-center">
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
