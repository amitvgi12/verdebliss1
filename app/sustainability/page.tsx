import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const revalidate = 3600

export const metadata = {
  title: 'Sustainability — Our Climate Commitments',
  description:
    'Our roadmap to carbon-neutral operations by 2030. Details on packaging, sourcing, water use, and emissions.',
  alternates: { canonical: 'https://www.verdebliss.com/sustainability' },
}

const PILLARS = [
  {
    icon: '♻️',
    title: 'Packaging',
    pct: '94%',
    desc: 'recyclable primary packaging today. Goal: 100% by 2027.',
  },
  {
    icon: '🌍',
    title: 'Carbon',
    pct: '−42%',
    desc: 'reduction in operational emissions vs 2022 baseline.',
  },
  {
    icon: '💧',
    title: 'Water',
    pct: '−58%',
    desc: 'lower water intensity in formulation since 2020.',
  },
  {
    icon: '🌱',
    title: 'Sourcing',
    pct: '12 co-ops',
    desc: 'direct, fair-trade partnerships across India.',
  },
]

const COMMITMENTS = [
  {
    title: 'Carbon-neutral operations by 2030',
    body: 'We measure scope 1, 2, and 3 emissions annually with a third-party auditor. Our reduction roadmap is published in our annual ESG report.',
  },
  {
    title: 'Zero virgin plastic in primary packaging by 2028',
    body: 'Today, 94% of our primary packaging is glass, aluminium, or PCR plastic. The remaining 6% — mostly droppers and pumps — is on the FY28 reformulation roadmap.',
  },
  {
    title: 'Living-wage sourcing',
    body: 'All farm partners are paid at least 18% above the Fair Trade minimum. We publish farmer payouts as part of our annual disclosure.',
  },
  {
    title: 'Refill program (FY27)',
    body: 'Pilot launching in Pune and Bangalore. Customers return empty bottles in exchange for store credit; refilled units sell at a 15% discount.',
  },
]

export default function SustainabilityPage() {
  return (
    <div className="bg-bg">
      <section className="bg-forest px-4 py-16 text-center">
        <div className="container-content">
          <p className="mb-3 text-[10px] font-semibold tracking-[0.16em] text-sage">
            CLIMATE COMMITMENTS
          </p>
          <h1 className="m-0 mb-4 font-serif text-[clamp(36px,5vw,56px)] font-normal leading-[1.05] text-white">
            Sustainability
          </h1>
          <p className="mx-auto max-w-[600px] text-sm leading-relaxed text-white/65">
            We measure what we change. What follows is our actual progress, not aspirations.
          </p>
        </div>
      </section>

      <section className="container-content py-16">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          {PILLARS.map((p) => (
            <article
              key={p.title}
              className="rounded-2xl border border-border bg-card p-6 text-center"
            >
              <div className="mb-3 text-4xl" aria-hidden>
                {p.icon}
              </div>
              <div className="mb-1 font-serif text-2xl font-bold text-forest">{p.pct}</div>
              <h3 className="mb-1.5 font-serif text-base font-semibold text-text">{p.title}</h3>
              <p className="text-xs leading-relaxed text-muted">{p.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-ivory px-4 py-16">
        <div className="container-content">
          <header className="mb-10 text-center">
            <p className="label-eyebrow mb-2.5">SPECIFIC COMMITMENTS</p>
            <h2 className="h-section">Targets you can hold us to</h2>
          </header>
          <div className="mx-auto grid max-w-[820px] grid-cols-1 gap-4 md:grid-cols-2">
            {COMMITMENTS.map((c) => (
              <article key={c.title} className="rounded-2xl border border-border bg-card p-6">
                <h3 className="mb-2 font-serif text-base font-semibold text-text">{c.title}</h3>
                <p className="text-xs leading-relaxed text-muted">{c.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-forest px-4 py-16 text-center">
        <h2 className="mb-3 font-serif text-[clamp(24px,3vw,32px)] font-normal text-white">
          Read the full ESG report
        </h2>
        <p className="mx-auto mb-7 max-w-[440px] text-sm text-white/55">
          Annual disclosure covering emissions, sourcing, farmer payouts, and packaging composition.
        </p>
        <Link href="/contact" className="btn-terra">
          Request the report <ArrowRight size={15} />
        </Link>
      </section>
    </div>
  )
}
