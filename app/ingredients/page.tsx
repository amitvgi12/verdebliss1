import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
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
  },
  {
    name: 'Rose Hip',
    desc: 'Cold-pressed oil rich in vitamin C, A, and essential fatty acids. Supports cellular turnover and visible radiance.',
    source: 'Sikkim, India',
    role: 'Brightening · Hydration',
  },
  {
    name: 'Green Tea',
    desc: 'EGCG-rich extract calms inflammation, controls excess sebum, and shields against environmental stress.',
    source: 'Munnar, India',
    role: 'Antioxidant · Sebum control',
  },
  {
    name: 'Turmeric',
    desc: 'Curcumin-active rhizome extract with potent anti-inflammatory and brightening action — used in Ayurveda for centuries.',
    source: 'Erode, India',
    role: 'Brightening · Calming',
  },
  {
    name: 'Zinc Oxide',
    desc: 'Mineral broad-spectrum SPF that reflects UVA + UVB without absorbing into the bloodstream. Reef-safe.',
    source: 'Pharmaceutical-grade, USA',
    role: 'SPF · Soothing',
  },
  {
    name: 'Niacinamide',
    desc: 'Vitamin B3 derivative. Refines pore appearance, balances oil, and strengthens the skin barrier.',
    source: 'Synthesised, EU',
    role: 'Pore refinement · Barrier',
  },
  {
    name: 'Acai Berry',
    desc: 'Antioxidant-dense Amazonian superfruit. Polyphenol content supports skin elasticity and protects against free radicals.',
    source: 'Brazil',
    role: 'Antioxidant · Plumping',
  },
  {
    name: 'Shea Butter',
    desc: 'Unrefined African shea — vitamins A, E, F. Deeply nourishes and reinforces the skin barrier overnight.',
    source: 'Ghana',
    role: 'Nourishment · Barrier repair',
  },
]

export default function IngredientsPage() {
  return (
    <div className="bg-bg">
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

      <section className="container-content py-16">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
          {HERO_INGREDIENTS.map((ing) => (
            <article
              key={ing.name}
              className="overflow-hidden rounded-2xl border border-border bg-card"
            >
              <IngredientCard ingredient={ing.name} description={ing.desc} imageHeight={160} />
              <div className="border-t border-border bg-bg px-4 py-3">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-terra">
                  {ing.role}
                </div>
                <div className="text-[11px] text-muted">Source: {ing.source}</div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-ivory px-4 py-16">
        <div className="container-content">
          <header className="mb-10 text-center">
            <p className="label-eyebrow mb-2.5">WHAT YOU&apos;LL NEVER FIND</p>
            <h2 className="h-section">Our forever-no list</h2>
          </header>
          <ul className="mx-auto grid max-w-[680px] grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              'Parabens',
              'Sulphates',
              'Phthalates',
              'Synthetic Fragrance',
              'Mineral Oil',
              'Formaldehyde',
              'Triclosan',
              'Microbeads',
              'Animal Testing',
            ].map((nope) => (
              <li
                key={nope}
                className="rounded-[10px] border border-border bg-card px-4 py-3 text-center text-xs font-medium text-muted"
              >
                ✗ {nope}
              </li>
            ))}
          </ul>
        </div>
      </section>

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
