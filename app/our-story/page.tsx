import Link from 'next/link'
import { ArrowRight, Leaf, Heart, RefreshCw, Users } from 'lucide-react'
import FadeIn from '@/components/ui/FadeIn'

export const revalidate = 3600

export const metadata = {
  title: 'Our Story — From a Pune Idea to a Dehradun Lab',
  description:
    'How VerdeBliss grew from a Pune formulation idea into an INCI-first botanical skincare catalogue.',
  alternates: { canonical: 'https://www.verdebliss.com/our-story' },
}

const TIMELINE = [
  {
    year: '2019',
    title: 'The Idea',
    body: 'VerdeBliss began as a Pune formulation concept: a gentler-feeling serum ritual with ingredient documentation customers could inspect before buying.',
  },
  {
    year: '2020',
    title: 'First Formula',
    body: 'The first Bakuchiol Renewal Serum prototype was developed around a gentler renewal ritual with full ingredient documentation.',
  },
  {
    year: '2021',
    title: 'Organic Commitment',
    body: 'VerdeBliss formalised its organic ingredient sourcing standards and began the process of pursuing third-party certification. Certification scope and issuers are published at /certifications as each is confirmed.',
  },
  {
    year: '2022',
    title: 'The Full Range',
    body: 'Eight hero product concepts were organised into a complete cleanser, serum, moisturiser, SPF, and lip-care catalogue.',
  },
  {
    year: '2024',
    title: 'Evidence First',
    body: 'The team moved claim substantiation, INCI disclosure, packaging notes, and review rules into public-facing product and Trust Centre pages.',
  },
  {
    year: '2026',
    title: 'Today',
    body: 'A pre-launch storefront with eight current formulas, transparent claim status, and verified reviews only after purchase.',
  },
]

const VALUES = [
  {
    Icon: Leaf,
    iconBg: '#EAF0E8',
    iconColor: '#2d4a32',
    title: 'Ingredient Transparency',
    body: 'Formulas are built around named botanical ingredients with full INCI disclosure. Certification status is published at /certifications.',
  },
  {
    Icon: Heart,
    iconBg: '#F6EDE8',
    iconColor: '#c07a5a',
    title: 'Animal-testing stance',
    body: 'No animal testing at any stage. We do not commission animal tests and are pursuing formal cruelty-free certification.',
  },
  {
    Icon: RefreshCw,
    iconBg: '#E0F0FA',
    iconColor: '#2a6b8c',
    title: 'Packaging Accountability',
    body: 'Packaging claims are documented before publication, with certification status tracked in the Trust Centre.',
  },
  {
    Icon: Users,
    iconBg: '#EDF5E8',
    iconColor: '#4a6844',
    title: 'Responsible Sourcing',
    body: 'Supplier and origin documentation is gathered before any sourcing claim is treated as verified.',
  },
]

export default function OurStoryPage() {
  return (
    <div className="bg-bg">
      {/* Hero */}
      <section className="editorial-hero story-hero">
        <div className="editorial-hero__inner">
          <FadeIn>
            {/* The brand idea began in Pune in 2019; VERDEBLISS COSMETICS
                PRIVATE LIMITED was incorporated in 2026 (see CIN in the
                footer). Stating both keeps the narrative from reading as a
                claim that the company is older than it is. */}
            <p className="editorial-hero__kicker">
              AN IDEA FROM PUNE, 2019 — INCORPORATED IN UTTARAKHAND, 2026
            </p>
            <h1 className="editorial-hero__title">Our Story</h1>
            <p className="editorial-hero__copy max-w-[600px]">
              VerdeBliss exists because skincare can be honest, beautiful, and free of greenwashing
              — all at the same time.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Timeline */}
      <section className="site-container editorial-section">
        <FadeIn>
          <header className="editorial-section-head">
            <p className="label-eyebrow mb-3">THE JOURNEY</p>
            <h2 className="h-section">From kitchen concept to transparent catalogue</h2>
          </header>
        </FadeIn>
        <ol className="story-timeline">
          {TIMELINE.map((item, i) => (
            <FadeIn key={item.year} delay={i * 0.06}>
              <li className="story-timeline__item soft-card soft-card-hover">
                <div className="story-timeline__year">{item.year}</div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              </li>
            </FadeIn>
          ))}
        </ol>
      </section>

      {/* Values */}
      <section className="editorial-section editorial-section--tint px-4">
        <div className="site-container">
          <FadeIn>
            <header className="editorial-section-head">
              <p className="label-eyebrow mb-3">WHAT WE BELIEVE</p>
              <h2 className="h-section">Four lines we won&apos;t cross</h2>
            </header>
          </FadeIn>
          <div className="story-values-grid">
            {VALUES.map((value, i) => (
              <FadeIn key={value.title} delay={i * 0.08}>
                <article className="story-value-card soft-card soft-card-hover">
                  <div
                    className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl"
                    style={{ background: value.iconBg }}
                  >
                    <value.Icon size={22} style={{ color: value.iconColor }} />
                  </div>
                  <h3 className="mb-2 font-serif text-base font-semibold text-text">
                    {value.title}
                  </h3>
                  <p className="text-[13px] leading-[1.75] text-muted">{value.body}</p>
                </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="editorial-cta">
        <FadeIn>
          <h2 className="mb-3 font-serif text-[clamp(1.5rem,2.5vw,2rem)] font-normal text-white">
            Try the formulas that started it all
          </h2>
          <p className="mx-auto mb-7 max-w-[440px] text-center text-sm text-white/55">
            Eight hero products. Every one of them rooted in the same five-year obsession with
            getting it right.
          </p>
          <Link href="/products" className="btn-terra">
            Shop the collection <ArrowRight size={15} />
          </Link>
        </FadeIn>
      </section>
    </div>
  )
}
