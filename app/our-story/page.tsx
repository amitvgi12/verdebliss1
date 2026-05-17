import Link from 'next/link'
import { ArrowRight, Leaf, Heart, RefreshCw, Users } from 'lucide-react'
import FadeIn from '@/components/ui/FadeIn'

export const revalidate = 3600

export const metadata = {
  title: 'Our Story — Founded in Pune, 2019',
  description:
    'How VerdeBliss went from a Pune kitchen to 50,000 customers — without compromising on organic integrity.',
  alternates: { canonical: 'https://www.verdebliss.com/our-story' },
}

const TIMELINE = [
  {
    year: '2019',
    title: 'The Idea',
    body: 'Founded in a kitchen in Pune, VerdeBliss began as a personal quest — founder Kavya Menon could not find a serum gentle enough for her sensitive skin that was also genuinely organic.',
  },
  {
    year: '2020',
    title: 'First Formula',
    body: 'After 14 months of botanical research and 280 test batches, the Bakuchiol Renewal Serum was born. Word spread quickly through dermatology communities.',
  },
  {
    year: '2021',
    title: 'Certified Organic',
    body: 'VerdeBliss received USDA Organic and Ecocert certifications — one of the first Indian skincare brands to achieve both in the same year.',
  },
  {
    year: '2022',
    title: 'The Full Range',
    body: 'Eight hero products launched. The brand crossed ₹1 crore in revenue within 90 days, driven entirely by word-of-mouth and community trust.',
  },
  {
    year: '2024',
    title: 'Going Global',
    body: 'VerdeBliss began shipping to the UK, UAE, and Singapore. The philosophy remained unchanged: nature first, luxury second, profit never at the cost of either.',
  },
  {
    year: '2026',
    title: 'Today',
    body: 'Over 50,000 customers. Zero compromises on ingredients. Still founded on the belief that beauty and integrity are not opposites — they are the same thing.',
  },
]

const VALUES = [
  {
    Icon: Leaf,
    iconBg: '#EAF0E8',
    iconColor: '#2d4a32',
    title: 'Organic Integrity',
    body: 'Every ingredient certified organic at source. No exceptions, no shortcuts.',
  },
  {
    Icon: Heart,
    iconBg: '#F6EDE8',
    iconColor: '#c07a5a',
    title: 'Cruelty-Free Forever',
    body: 'Zero animal testing — every formula validated on dermatologist-supervised human panels.',
  },
  {
    Icon: RefreshCw,
    iconBg: '#E0F0FA',
    iconColor: '#2a6b8c',
    title: 'Circular Packaging',
    body: 'Glass and aluminium primary packaging. Refill programs in pilot for FY27.',
  },
  {
    Icon: Users,
    iconBg: '#EDF5E8',
    iconColor: '#4a6844',
    title: 'Fair Sourcing',
    body: 'Direct relationships with 12 farmer co-ops across Karnataka, Kerala, and Sikkim.',
  },
]

export default function OurStoryPage() {
  return (
    <div className="bg-bg">
      {/* Hero */}
      <section className="editorial-hero story-hero">
        <div className="editorial-hero__inner">
          <FadeIn>
            <p className="editorial-hero__kicker">FOUNDED IN PUNE — 2019</p>
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
            <h2 className="h-section">From kitchen to 50,000 customers</h2>
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
