import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Leaf, ShieldCheck, Sparkles, Truck } from 'lucide-react'
import ProductCard from '@/components/ui/ProductCard'
import IngredientCard from '@/components/ui/IngredientCard'
import NewsletterForm from '@/components/features/newsletter/NewsletterForm'
import { getProductsServer } from '@/lib/products-server'

export const revalidate = 300

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
  const featured = products.slice(0, 6)

  return (
    <div className="bg-bg">
      <section className="premium-hero px-4">
        <div className="site-container premium-hero__grid">
          <div className="premium-hero__copy">
            <p className="premium-kicker">CERTIFIED ORGANIC SKINCARE INDIA</p>
            <h1 className="premium-hero__title">Ritual-grade botanicals for modern Indian skin.</h1>
            <p className="premium-hero__text">
              A premium organic skincare boutique built around transparent actives, conscious
              routines, verified commerce, and no inflated review claims.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/products" className="btn-terra premium-cta">
                Shop the collection <ArrowRight size={15} />
              </Link>
              <Link href="/quiz" className="premium-ghost-cta">
                Build my ritual <Sparkles size={15} />
              </Link>
            </div>
            <dl className="premium-hero__stats" aria-label="Store highlights">
              {[
                ['8', 'Launch formulas'],
                ['14 days', 'Return window'],
                ['₹499+', 'Free shipping'],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt>{value}</dt>
                  <dd>{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="premium-hero__visual" aria-label="Featured VerdeBliss product editorial">
            <div className="premium-hero__orb" />
            <div className="premium-hero__product">
              <Image
                src="/images/products/serum.webp"
                alt="VerdeBliss Bakuchiol Renewal Serum"
                priority
                fetchPriority="high"
                fill
                sizes="(max-width: 768px) 78vw, 420px"
                className="object-contain p-[12%]"
              />
            </div>
            <div className="premium-float premium-float--left">
              <span>INCI</span>
              <strong>Full ingredient clarity</strong>
            </div>
            <div className="premium-float premium-float--right">
              <span>NO HYPE</span>
              <strong>Reviews shown only after approval</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="site-container page-section">
        <div className="premium-section-head">
          <p className="label-eyebrow">CURATED BOUTIQUE</p>
          <h2 className="h-section">The launch collection</h2>
          <p>
            Six hero formulas are surfaced first for faster decision-making. Every card now uses
            product-specific copy instead of generic skincare filler.
          </p>
        </div>
        <div className="product-grid product-grid-compact">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/products" className="btn-outline">
            View full boutique <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <section className="premium-routines px-4">
        <div className="site-container">
          <div className="premium-section-head premium-section-head--light">
            <p className="premium-kicker">ROUTINE COMMERCE</p>
            <h2>Designed to sell rituals, not isolated SKUs.</h2>
            <p>
              Premium D2C skincare converts better when the customer sees an AM/PM path. These
              routine panels create bundle-ready entry points without making unsupported clinical
              claims.
            </p>
          </div>
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
        </div>
      </section>

      <section className="home-ingredients-section bg-ivory px-4">
        <div className="site-container">
          <div className="premium-section-head">
            <p className="label-eyebrow">BOTANICAL LIBRARY</p>
            <h2 className="h-section">Hero ingredients with a purpose</h2>
            <p>
              The brand story now feels ingredient-led and editorial, while staying within safe
              cosmetic-language boundaries.
            </p>
          </div>
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

      <section className="site-container page-section">
        <div className="premium-trust-grid">
          <div className="premium-trust-intro">
            <p className="label-eyebrow">WHY VERDEBLISS</p>
            <h2 className="h-section">Luxury that can survive scrutiny.</h2>
            <p>
              The storefront now avoids unverifiable social proof and leans into verifiable signals:
              ingredient transparency, secure checkout, review moderation, and clear policy pages.
            </p>
          </div>
          <div className="premium-trust-cards">
            {TRUST_CARDS.map(({ icon: Icon, title, copy }) => (
              <article key={title} className="premium-trust-card">
                <Icon size={20} />
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="premium-review-note px-4">
        <div className="site-container premium-review-note__inner">
          <div>
            <p className="premium-kicker">VERIFIED REVIEW STANDARD</p>
            <h2>Customer praise should be earned, not hard-coded.</h2>
            <p>
              Product reviews are displayed only after approval and purchase verification. Until
              real approved reviews exist, the site now shows transparent review-state messaging
              instead of inflated star ratings.
            </p>
          </div>
          <ul>
            {[
              'No fake review counts',
              'No unverified testimonials',
              'Schema omits empty aggregate ratings',
            ].map((item) => (
              <li key={item}>
                <CheckCircle2 size={16} /> {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="home-newsletter-section bg-ivory px-4 text-center">
        <p className="label-eyebrow mb-2.5">JOIN THE CIRCLE</p>
        <h2 className="mb-2 font-serif text-[clamp(26px,3vw,38px)] font-normal text-text">
          Launch notes, ingredient education, and ritual drops.
        </h2>
        <p className="mx-auto mb-7 max-w-[560px] text-sm leading-relaxed text-muted">
          Sign up for product education and carefully timed offers. No spam, no third-party ad
          tracking.
        </p>
        <NewsletterForm />
      </section>
    </div>
  )
}
