import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Leaf, ShieldCheck, Truck } from 'lucide-react'
import ProductCard from '@/components/ui/ProductCard'
import IngredientCard from '@/components/ui/IngredientCard'
import NewsletterForm from '@/components/features/newsletter/NewsletterForm'
import FadeIn from '@/components/ui/FadeIn'
import { getProductsServer } from '@/lib/products-server'
import { TRUST_METRICS } from '@/constants/trust'
import type { Metadata } from 'next'

export const revalidate = 300

export const metadata: Metadata = {
  title: { absolute: 'VerdeBliss — Botanical Skincare India' },
  description:
    'Premium botanical skincare from India. INCI-first formulas for every skin type. Free shipping above ₹499.',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://www.verdebliss.com',
    siteName: 'VerdeBliss',
    title: 'VerdeBliss — Botanical Skincare India',
    description: 'Premium botanical skincare. INCI-first formulas for every skin type.',
    images: [
      { url: '/og/home.jpg', width: 1200, height: 630, alt: 'VerdeBliss botanical skincare' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@verdebliss',
    title: 'VerdeBliss — Botanical Skincare India',
    description: 'Premium botanical skincare. INCI-first formulas.',
    images: ['/og/home.jpg'],
  },
  alternates: { canonical: 'https://www.verdebliss.com' },
}

const INGREDIENTS = [
  {
    name: 'Bakuchiol',
    desc: 'Plant-based retinol alternative for night renewal without harshness.',
  },
  { name: 'Rose Hip', desc: 'A vitamin-rich oil profile for barrier comfort and visible glow.' },
  { name: 'Green Tea', desc: 'Polyphenol-rich antioxidant support for oily and combination skin.' },
  { name: 'Turmeric', desc: 'A brightening botanical used in Indian rituals for generations.' },
  { name: 'Zinc Oxide', desc: 'Mineral UV shield for daily broad-spectrum protection.' },
  { name: 'Shea Butter', desc: 'A cushiony emollient for overnight barrier nourishment.' },
]

const TRUST_CARDS = [
  {
    icon: ShieldCheck,
    title: 'INCI-first product pages',
    copy: 'Every product page prioritises full ingredient disclosure, safety notes, PAO guidance, and patch-test advice.',
  },
  {
    icon: Leaf,
    title: 'Botanical luxury, not vague clean beauty',
    copy: 'Formulas are positioned around named actives and skin concerns instead of generic natural claims.',
  },
  {
    icon: Truck,
    title: 'India-ready commerce rules',
    copy: 'Free shipping threshold, COD caps, server-side cart validation, and verified payment flow are built in.',
  },
]

const ROUTINES = [
  {
    eyebrow: 'AM RITUAL',
    title: 'Cleanse · Treat · Protect',
    copy: 'Turmeric cleanser, niacinamide support, and mineral SPF for pollution-heavy Indian mornings.',
    href: '/products?cat=SPF',
  },
  {
    eyebrow: 'PM RITUAL',
    title: 'Repair · Replenish · Seal',
    copy: 'Bakuchiol renewal layered with rose hip or shea butter for a calmer overnight routine.',
    href: '/products?cat=Serum',
  },
  {
    eyebrow: 'SENSITIVE SKIN',
    title: 'Calm barrier routine',
    copy: 'Low-friction textures, transparent allergens, and patch-test guidance before active use.',
    href: '/products?skin=Sensitive',
  },
]

export default async function Home() {
  const products = await getProductsServer()
  const featured = products.slice(0, 8)

  return (
    <div className="bg-bg">
      <section className="premium-hero px-4">
        <div className="site-container premium-hero__grid">
          <div className="premium-hero__copy">
            <p className="premium-kicker" style={{ fontSize: '0.62rem', letterSpacing: '0.18em' }}>
              INCI-FIRST BOTANICAL SKINCARE
            </p>
            <h1 className="premium-hero__title">
              Pure.
              <br />
              <em>Botanical.</em>
              <br />
              Radiant.
            </h1>
            <p className="premium-hero__text">
              Luxury skincare rooted in nature. Formulated with transparent botanical
              ingredients.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/products" className="btn-terra premium-cta">
                Shop the Collection <ArrowRight size={15} />
              </Link>
              <Link href="/quiz" className="premium-ghost-cta">
                Take Skin Quiz <ArrowRight size={15} />
              </Link>
            </div>
            <ul className="premium-hero__proofs" aria-label="Trust highlights">
              {TRUST_METRICS.heroProofs.map((proof) => (
                <li key={proof}>{proof}</li>
              ))}
            </ul>
          </div>

          <div className="premium-hero__visual" aria-label="Featured VerdeBliss product editorial">
            <div className="premium-hero__product">
              <Image
                src="/images/products/serum.webp"
                alt="VerdeBliss Bakuchiol Renewal Serum"
                priority
                fetchPriority="high"
                fill
                sizes="(max-width: 768px) 90vw, 480px"
                className="object-cover"
              />
            </div>
            <div className="premium-float premium-float--left">
              <span>Bakuchiol Serum</span>
              <strong>Full INCI listed</strong>
            </div>
            <div className="premium-float premium-float--right">
              <span>SPF 50 Shield</span>
              <strong>Mineral UV filter</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="site-container home-collection-section page-section">
        <FadeIn>
          <div className="premium-section-head">
            <h2 className="vb-collection-heading">The Collection</h2>
            <p>{TRUST_METRICS.collectionCopy}</p>
          </div>
        </FadeIn>
        <FadeIn delay={0.1}>
          <div className="product-grid product-grid-compact">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </FadeIn>
        <FadeIn delay={0.18}>
          <div className="home-collection-cta-wrap">
            <Link href="/products" className="home-collection-cta">
              View full boutique <ArrowRight size={15} />
            </Link>
          </div>
        </FadeIn>
      </section>

      <section className="premium-routines px-4">
        <div className="site-container">
          <FadeIn>
            <div className="premium-section-head premium-section-head--light">
              <p className="premium-kicker">BUILD YOUR RITUAL</p>
              <h2>Morning, evening, or sensitive-skin care.</h2>
              <p>
                Every skin concern has a routine. Start with the step that matters most to you —
                your ritual, in the order that works for your skin.
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="premium-routine-grid">
              {ROUTINES.map((routine) => (
                <Link key={routine.title} href={routine.href} className="premium-routine-card">
                  <span>{routine.eyebrow}</span>
                  <h3>{routine.title}</h3>
                  <p>{routine.copy}</p>
                  <small>
                    Explore products <ArrowRight size={13} />
                  </small>
                </Link>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="home-ingredients-section bg-ivory px-4">
        <div className="site-container">
          <FadeIn>
            <div className="premium-section-head">
              <p className="label-eyebrow">WHAT&apos;S INSIDE</p>
              <h2 className="h-section">Nature&apos;s Finest Ingredients</h2>
              <p>
                Every formula begins with carefully sourced botanical ingredients and a full INCI
                trail you can inspect.
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
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
          </FadeIn>
        </div>
      </section>

      <section className="home-philosophy-section px-4">
        <div className="site-container">
          <FadeIn>
            <div className="home-philosophy-grid">
              <div className="home-philosophy-copy">
                <p className="premium-kicker">OUR PHILOSOPHY</p>
                <h2>Beauty that honours the earth</h2>
                <p>{TRUST_METRICS.philosophyCopy}</p>
                <div className="home-philosophy-links" aria-label="Proof pages">
                  {TRUST_METRICS.proofLinks.map((item) => (
                    <Link key={item.href} href={item.href}>
                      {item.label} <ArrowRight size={14} />
                    </Link>
                  ))}
                </div>
              </div>
              <div className="home-philosophy-cert-grid">
                {[
                  { value: 'INCI', label: 'Full disclosure', accent: '#bfa06a' },
                  { value: String(products.length), label: 'Current formulas', accent: '#7d9b76' },
                  { value: '14 days', label: 'Return window', accent: '#bfa06a' },
                  { value: 'Verified', label: 'Review standard', accent: '#7d9b76' },
                ].map((item) => (
                  <div key={item.value} className="home-philosophy-cert-card">
                    <strong style={{ color: item.accent }}>{item.value}</strong>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="site-container page-section premium-trust-section">
        <div className="premium-trust-grid">
          <div className="premium-trust-intro">
            <FadeIn>
              <p className="label-eyebrow">WHY VERDEBLISS</p>
              <h2 className="h-section">Luxury that can survive scrutiny.</h2>
              <p>
                Ingredient transparency, verified reviews, secure checkout, and a clear returns
                policy — the kind of trust that holds up to a second look.
              </p>
            </FadeIn>
          </div>
          <div className="premium-trust-cards">
            {TRUST_CARDS.map(({ icon: Icon, title, copy }, i) => (
              <FadeIn key={title} delay={i * 0.09}>
                <article className="premium-trust-card">
                  <Icon size={20} />
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="premium-review-note px-4">
        <div className="site-container premium-review-note__inner">
          <FadeIn>
            <div>
              <p className="premium-kicker">VERIFIED REVIEW STANDARD</p>
              <h2>Customer praise should be earned, not hard-coded.</h2>
              <p>
                Product reviews are displayed only after approval and purchase verification. Until
                real approved reviews exist, the site now shows transparent review-state messaging
                instead of inflated star ratings.
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={0.12}>
            <ul>
              {[...TRUST_METRICS.reviewStandards].map((item) => (
                <li key={item}>
                  <CheckCircle2 size={16} /> {item}
                </li>
              ))}
            </ul>
          </FadeIn>
        </div>
      </section>

      <section className="home-newsletter-section bg-ivory px-4 text-center">
        <FadeIn className="home-newsletter-content">
          <p className="label-eyebrow mb-2.5">JOIN THE CIRCLE</p>
          <h2 className="mb-2 font-serif text-[clamp(1.5rem,2.5vw,2.2rem)] font-normal text-text">
            Subscribe &amp; earn 50 bonus points
          </h2>
          <p className="mx-auto mb-7 max-w-[560px] text-center text-sm leading-relaxed text-muted">
            New launches, rituals, and exclusive offers — delivered to your inbox. No spam, ever.
          </p>
          <NewsletterForm />
        </FadeIn>
      </section>
    </div>
  )
}
