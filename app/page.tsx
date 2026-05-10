import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import ProductCard from '@/components/ui/ProductCard'
import IngredientCard from '@/components/ui/IngredientCard'
import Stars from '@/components/ui/Stars'
import NewsletterForm from '@/components/features/newsletter/NewsletterForm'
import { getProductsServer } from '@/lib/products-server'

export const revalidate = 300

const TESTIMONIALS = [
  {
    name: 'Priya S.',
    skin: 'Sensitive',
    city: 'Mumbai',
    rating: 5,
    text: 'My skin has never felt this calm. The Bakuchiol serum is absolutely transformative — zero irritation, maximum glow.',
  },
  {
    name: 'Aditi R.',
    skin: 'Combination',
    city: 'Bangalore',
    rating: 5,
    text: 'VerdeBliss converted me to clean beauty. The textures are so luxurious and the results are absolutely real.',
  },
  {
    name: 'Meera P.',
    skin: 'Dry',
    city: 'Delhi',
    rating: 5,
    text: "I've tried so many moisturisers. The Rose Hip Glow is the only one that truly delivers on deep, lasting hydration.",
  },
]

const INGREDIENTS = [
  { name: 'Bakuchiol', desc: 'Plant-based retinol alternative — renews without irritation.' },
  { name: 'Rose Hip', desc: 'Rich in vitamin C and fatty acids for visible radiance.' },
  { name: 'Green Tea', desc: 'Powerful antioxidant that calms inflammation and controls oil.' },
  { name: 'Turmeric', desc: 'Ancient brightening spice with potent anti-inflammatory action.' },
  { name: 'Zinc Oxide', desc: 'Mineral SPF shield that protects without clogging pores.' },
  {
    name: 'Shea Butter',
    desc: 'Deeply nourishing butter that restores the skin barrier overnight.',
  },
]

export default async function Home() {
  // Server-side product fetch — content is in the HTML for crawlers from the
  // first byte. Replaces the legacy `useProducts()` client hook on the home page.
  const products = await getProductsServer()
  const featured = products.slice(0, 6)

  return (
    <div className="bg-bg">
      {/* ── Hero ────────────────────────────────────────────────── */}
      <section
        className="relative flex items-center overflow-hidden px-4 py-20"
        style={{
          background: 'linear-gradient(135deg, #2D4A32 0%, #1B3022 55%, #2D4A32 100%)',
          minHeight: '88vh',
        }}
      >
        {/* Decorative circles, pointer-events-none so they never block CTAs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-32 z-0 h-[520px] w-[520px] rounded-full bg-white/[0.025]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-40 z-0 h-[360px] w-[360px] rounded-full bg-sage/10"
        />

        <div className="site-container relative z-10 grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12">
          <div>
            <p className="mb-5 text-[10px] font-semibold tracking-[0.18em] text-sage">
              ✦ BOTANICAL SKINCARE &nbsp;·&nbsp; CRUELTY-FREE PRINCIPLES &nbsp;·&nbsp; VEGAN
              FORMULAS ✦
            </p>
            <h1 className="m-0 mb-6 font-serif text-[clamp(40px,5.5vw,76px)] font-normal leading-none text-white">
              Pure.
              <br />
              <em className="not-italic text-sage">Botanical.</em>
              <br />
              Radiant.
            </h1>
            <p className="mb-10 max-w-[420px] text-base leading-relaxed text-white/60">
              Luxury skincare rooted in nature. Formulated with the finest certified organic
              botanicals.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/products" className="btn-terra">
                Shop the Collection <ArrowRight size={15} />
              </Link>
              <Link
                href="/quiz"
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-white/30 bg-transparent px-6 py-3.5 text-sm font-semibold tracking-wide text-white"
              >
                Take Skin Quiz <ArrowRight size={15} />
              </Link>
            </div>
            <dl className="mt-12 flex flex-wrap gap-9">
              {[
                ['8', 'Launch Formulas'],
                ['6', 'Care Categories'],
                ['₹499+', 'Free Shipping'],
              ].map(([n, l]) => (
                <div key={l}>
                  <dt className="font-serif text-2xl font-bold text-gold">{n}</dt>
                  <dd className="mt-0.5 text-[11px] text-white/45">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Hero product image — wrapped in an overflow-hidden container so
              decorative glass cards positioned outside the circle never push
              the document horizontally. */}
          <div className="relative mx-auto flex w-full max-w-[420px] justify-center overflow-hidden px-2 py-6">
            <div
              className="relative flex-shrink-0 overflow-hidden rounded-full border-2 border-sage/35"
              style={{
                width: 'min(360px, 80vw)',
                height: 'min(360px, 80vw)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
              }}
            >
              <Image
                src="/images/products/serum.webp"
                alt="VerdeBliss Bakuchiol Serum"
                priority
                fetchPriority="high"
                fill
                sizes="(max-width: 768px) 80vw, 360px"
                style={{ objectFit: 'cover', objectPosition: 'center' }}
              />
            </div>
            <div className="absolute left-0 top-10 flex items-center gap-2.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 backdrop-blur-md">
              <span className="text-[22px]">✨</span>
              <div>
                <div className="text-xs font-medium text-white">Bakuchiol Serum</div>
                <div className="text-[10px] text-white/55">Best Seller ✦</div>
              </div>
            </div>
            <div className="absolute bottom-16 right-0 flex items-center gap-2.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 backdrop-blur-md">
              <span className="text-[22px]">☀️</span>
              <div>
                <div className="text-xs font-medium text-white">SPF 50 Shield</div>
                <div className="text-[10px] text-white/55">4.9★ Rated</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Products ─────────────────────────────────── */}
      <section className="site-container page-section">
        <header className="mb-12 text-center">
          <p className="label-eyebrow mb-2.5">CURATED FOR YOU</p>
          <h2 className="h-section">The Collection</h2>
          <p className="mx-auto max-w-[420px] text-sm leading-relaxed text-muted">
            Every formula is designed around botanical actives, transparent ingredients, and
            everyday skin rituals.
          </p>
        </header>
        <div className="product-grid product-grid-compact">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/products" className="btn-outline">
            View All Products <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── Key Ingredients ───────────────────────────────────── */}
      <section className="home-ingredients-section bg-ivory px-4">
        <div className="site-container">
          <header className="mb-12 text-center">
            <p className="label-eyebrow mb-2.5">WHAT&apos;S INSIDE</p>
            <h2 className="h-section">Nature&apos;s Finest Ingredients</h2>
            <p className="mx-auto max-w-[460px] text-sm leading-relaxed text-muted">
              Every formula begins with the most potent certified-organic ingredients the earth has
              to offer.
            </p>
          </header>
          <div className="home-ingredients-grid">
            {INGREDIENTS.map((ing) => (
              <IngredientCard
                key={ing.name}
                ingredient={ing.name}
                description={ing.desc}
                imageHeight={140}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Philosophy ────────────────────────────────────────── */}
      <section className="overflow-hidden bg-forest px-4 py-20">
        <div className="site-container grid grid-cols-1 items-center gap-12 md:grid-cols-2">
          <div>
            <p className="mb-3 text-[10px] font-semibold tracking-[0.14em] text-sage">
              OUR PHILOSOPHY
            </p>
            <h2 className="mb-5 font-serif text-[clamp(28px,4vw,44px)] font-normal leading-tight text-white">
              Beauty that honours the earth
            </h2>
            <p className="mb-7 text-[15px] leading-relaxed text-white/60">
              Every VerdeBliss formula is designed around botanical ingredients, cruelty-free
              principles, and more conscious packaging choices.
            </p>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                ['🌱', 'Botanical Actives'],
                ['🐰', 'Cruelty-Free'],
                ['♻️', 'Eco Packaging'],
                ['🏆', 'Ingredient Transparency'],
              ].map(([e, l]) => (
                <li
                  key={l}
                  className="flex items-center gap-2.5 rounded-[10px] border border-white/10 bg-white/5 px-3 py-2"
                >
                  <span className="text-base" aria-hidden>
                    {e}
                  </span>
                  <span className="text-xs text-white/70">{l}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-3" aria-hidden>
            {['🌿', '🌸', '🍯', '🌺'].map((e) => (
              <div
                key={e}
                className="flex h-32 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-5xl"
              >
                {e}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────── */}
      <section className="site-container home-testimonials-section">
        <header className="mb-10 text-center">
          <p className="label-eyebrow mb-2.5">REAL RESULTS</p>
          <h2 className="m-0 font-serif text-[clamp(32px,4vw,44px)] font-normal text-text">
            Loved by thousands
          </h2>
        </header>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
          {TESTIMONIALS.map((t) => (
            <article
              key={t.name}
              className="rounded-2xl border border-border border-l-[3px] border-l-gold bg-card p-7"
            >
              <Stars rating={t.rating} size={14} />
              <p className="my-4 font-serif text-base italic leading-relaxed text-text">
                &ldquo;{t.text}&rdquo;
              </p>
              <footer className="flex items-center gap-2.5">
                <div
                  aria-hidden
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-sagePale text-sm font-semibold text-forest"
                >
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-text">{t.name}</div>
                  <div className="text-[11px] text-muted">
                    {t.skin} skin · {t.city}
                  </div>
                </div>
              </footer>
            </article>
          ))}
        </div>

        {/* FTC + Verified Purchase disclosure */}
        <p className="mt-6 text-center text-[11px] leading-relaxed text-light">
          Testimonials are from customer feedback collected by VerdeBliss. Results may vary based on
          individual skin type, usage, and lifestyle. Individual results are not guaranteed. *These
          statements have not been evaluated by a regulatory authority.
        </p>
      </section>

      {/* ── Newsletter ────────────────────────────────────────── */}
      <section className="home-newsletter-section bg-ivory px-4 text-center">
        <p className="label-eyebrow mb-2.5">JOIN THE CIRCLE</p>
        <h2 className="mb-2 font-serif text-[clamp(24px,3vw,34px)] font-normal text-text">
          Subscribe for launch rituals
        </h2>
        <p className="mb-7 text-sm text-muted">
          New launches, ingredient education, and exclusive offers — delivered to your inbox.
        </p>
        <NewsletterForm />
      </section>
    </div>
  )
}
