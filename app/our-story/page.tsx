import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
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
    icon: '🌱',
    title: 'Organic Integrity',
    body: 'Every ingredient certified organic at source. No exceptions, no shortcuts.',
  },
  {
    icon: '🐰',
    title: 'Cruelty-Free Forever',
    body: 'Zero animal testing — every formula validated on dermatologist-supervised human panels.',
  },
  {
    icon: '♻️',
    title: 'Circular Packaging',
    body: 'Glass and aluminium primary packaging. Refill programs in pilot for FY27.',
  },
  {
    icon: '🤝',
    title: 'Fair Sourcing',
    body: 'Direct relationships with 12 farmer co-ops across Karnataka, Kerala, and Sikkim.',
  },
]

export default function OurStoryPage() {
  return (
    <div className="bg-bg">
      <section className="bg-forest px-4 py-14 text-center">
        <div className="container-content">
          <FadeIn>
            <p className="mb-3 text-[10px] font-semibold tracking-[0.16em] text-sage">
              FOUNDED IN PUNE — 2019
            </p>
            <h1 className="m-0 mb-4 font-serif text-[clamp(2rem,3.5vw,3rem)] font-normal leading-[1.05] text-white">
              Our Story
            </h1>
            <p className="mx-auto max-w-[600px] text-center text-sm leading-relaxed text-white/65">
              VerdeBliss exists because skincare can be honest, beautiful, and free of greenwashing
              — all at the same time.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="container-content py-14">
        <FadeIn>
          <header className="mb-10 text-center">
            <p className="label-eyebrow mb-2.5">THE JOURNEY</p>
            <h2 className="h-section">From kitchen to 50,000 customers</h2>
          </header>
        </FadeIn>
        <ol className="relative mx-auto max-w-[680px] border-l-2 border-sagePale pl-6">
          {TIMELINE.map((item, i) => (
            <FadeIn key={item.year} delay={i * 0.06}>
              <li className="mb-8 last:mb-0">
                <span className="absolute -left-[7px] mt-1.5 block h-3 w-3 rounded-full bg-gold" />
                <div className="font-serif text-xs font-semibold uppercase tracking-wider text-terra">
                  {item.year}
                </div>
                <h3 className="mb-1 font-serif text-lg font-semibold text-text">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{item.body}</p>
              </li>
            </FadeIn>
          ))}
        </ol>
      </section>

      <section className="bg-ivory px-4 py-14">
        <div className="container-content">
          <FadeIn>
            <header className="mb-10 text-center">
              <p className="label-eyebrow mb-2.5">WHAT WE BELIEVE</p>
              <h2 className="h-section">Four lines we won&apos;t cross</h2>
            </header>
          </FadeIn>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
            {VALUES.map((value, i) => (
              <FadeIn key={value.title} delay={i * 0.08}>
                <article className="h-full rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(0,0,0,0.07)]">
                  <div className="mb-3 text-3xl" aria-hidden>
                    {value.icon}
                  </div>
                  <h3 className="mb-2 font-serif text-sm font-semibold text-text">{value.title}</h3>
                  <p className="text-xs leading-relaxed text-muted">{value.body}</p>
                </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-forest px-4 py-14 text-center">
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
