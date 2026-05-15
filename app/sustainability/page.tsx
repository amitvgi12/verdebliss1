import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import FadeIn from '@/components/ui/FadeIn'

export const revalidate = 3600

export const metadata = {
  title: 'Sustainability — Our Climate Commitments',
  description:
    'Our sustainability roadmap covering packaging, sourcing, water use, and emissions targets.',
  alternates: { canonical: 'https://www.verdebliss.com/sustainability' },
}

const PILLARS = [
  {
    icon: '♻️',
    title: 'Packaging',
    pct: 'Roadmap',
    desc: 'More recyclable and refill-ready primary packaging by 2028.',
  },
  {
    icon: '🌍',
    title: 'Carbon',
    pct: '2030',
    desc: 'Target year for lower-carbon operations and supplier reporting.',
  },
  {
    icon: '💧',
    title: 'Water',
    pct: 'Reduce',
    desc: 'Lower water intensity in formulation and cleaning workflows.',
  },
  {
    icon: '🌱',
    title: 'Sourcing',
    pct: 'Sourcing',
    desc: 'Prefer direct farmer and cooperative partnerships across India.',
  },
]

const COMMITMENTS = [
  {
    title: 'Carbon-neutral operations by 2030',
    body: 'We are building supplier and operational emissions tracking toward a public reduction roadmap.',
  },
  {
    title: 'Zero virgin plastic in primary packaging by 2028',
    body: 'Our packaging roadmap prioritises glass, aluminium, PCR materials, and refill-ready components where operationally feasible.',
  },
  {
    title: 'Living-wage sourcing',
    body: 'We are documenting sourcing standards and supplier payment practices before publishing formal claims.',
  },
  {
    title: 'Refill program (FY27)',
    body: 'Pilot model under evaluation: customers return empty bottles in exchange for future store credit.',
  },
]

export default function SustainabilityPage() {
  return (
    <div className="bg-bg">
      <section className="bg-forest px-4 py-14 text-center">
        <div className="site-container">
          <FadeIn>
            <p className="mb-3 text-[10px] font-semibold tracking-[0.16em] text-sage">
              CLIMATE COMMITMENTS
            </p>
            <h1 className="m-0 mb-4 font-serif text-[clamp(2rem,3.5vw,3rem)] font-normal leading-[1.05] text-white">
              Sustainability
            </h1>
            <p className="mx-auto max-w-[600px] text-center text-sm leading-relaxed text-white/65">
              We measure what we change. What follows is our public roadmap. Evidence documents
              should be requested before relying on specific claims.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="site-container py-14">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          {PILLARS.map((p, i) => (
            <FadeIn key={p.title} delay={i * 0.08}>
              <article className="rounded-2xl border border-border bg-card p-6 text-center transition hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(0,0,0,0.07)]">
                <div className="mb-3 text-3xl" aria-hidden>
                  {p.icon}
                </div>
                <div className="mb-1 font-serif text-2xl font-bold text-forest">{p.pct}</div>
                <h3 className="mb-1.5 font-serif text-sm font-semibold text-text">{p.title}</h3>
                <p className="text-xs leading-relaxed text-muted">{p.desc}</p>
              </article>
            </FadeIn>
          ))}
        </div>
      </section>

      <section className="bg-ivory px-4 py-14">
        <div className="site-container">
          <FadeIn>
            <header className="mb-10 text-center">
              <p className="label-eyebrow mb-2.5">SPECIFIC COMMITMENTS</p>
              <h2 className="h-section">Targets you can hold us to</h2>
            </header>
          </FadeIn>
          <div className="mx-auto grid max-w-[820px] grid-cols-1 gap-4 md:grid-cols-2">
            {COMMITMENTS.map((c, i) => (
              <FadeIn key={c.title} delay={i * 0.07}>
                <article className="rounded-2xl border border-border bg-card p-6 transition hover:shadow-[0_6px_22px_rgba(0,0,0,0.07)]">
                  <h3 className="mb-2 font-serif text-sm font-semibold text-text">{c.title}</h3>
                  <p className="text-xs leading-relaxed text-muted">{c.body}</p>
                </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-forest px-4 py-14 text-center">
        <FadeIn>
          <h2 className="mb-3 font-serif text-[clamp(1.5rem,2.5vw,2rem)] font-normal text-white">
            Request our sustainability roadmap
          </h2>
          <p className="mx-auto mb-7 max-w-[440px] text-center text-sm text-white/55">
            We share roadmap notes and supporting evidence as they become available.
          </p>
          <Link href="/contact" className="btn-terra">
            Request the report <ArrowRight size={15} />
          </Link>
        </FadeIn>
      </section>
    </div>
  )
}
