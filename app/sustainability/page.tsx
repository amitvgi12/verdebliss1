import Link from 'next/link'
import { ArrowRight, Recycle, Globe, Droplets, Sprout } from 'lucide-react'
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
    Icon: Recycle,
    title: 'Packaging',
    target: '2028',
    label: 'ZERO VIRGIN PLASTIC',
    desc: 'More recyclable and refill-ready primary packaging by 2028.',
    iconBg: '#EAF0E8',
    iconColor: '#2d4a32',
    accentBar: '#2d4a32',
  },
  {
    Icon: Globe,
    title: 'Carbon',
    target: '2030',
    label: 'CARBON-NEUTRAL TARGET',
    desc: 'Target year for lower-carbon operations and full supplier reporting.',
    iconBg: '#E3F2E8',
    iconColor: '#4a6844',
    accentBar: '#4a6844',
  },
  {
    Icon: Droplets,
    title: 'Water',
    target: '−30%',
    label: 'WATER INTENSITY',
    desc: 'Lower water intensity in formulation and cleaning workflows.',
    iconBg: '#E0F0FA',
    iconColor: '#2a6b8c',
    accentBar: '#2a6b8c',
  },
  {
    Icon: Sprout,
    title: 'Sourcing',
    target: '12',
    label: 'FARMER COOPERATIVES',
    desc: 'Direct partnerships with co-ops across Karnataka, Kerala, and Sikkim.',
    iconBg: '#EDF5E8',
    iconColor: '#3a5e2e',
    accentBar: '#3a5e2e',
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
      {/* Hero */}
      <section className="editorial-hero">
        <div className="editorial-hero__inner">
          <FadeIn>
            <p className="editorial-hero__kicker">CLIMATE COMMITMENTS</p>
            <h1 className="editorial-hero__title">Sustainability</h1>
            <p className="editorial-hero__copy">
              We measure what we change. What follows is our public roadmap. Evidence documents
              should be requested before relying on specific claims.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Pillars */}
      <section className="site-container editorial-section">
        <div className="sustainability-grid">
          {PILLARS.map((p, i) => (
            <FadeIn key={p.title} delay={i * 0.08}>
              <article className="sustainability-card soft-card soft-card-hover">
                {/* Accent bar */}
                <div className="h-1 w-full" style={{ background: p.accentBar }} />
                <div className="sustainability-card__body">
                  <div
                    className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ background: p.iconBg }}
                    aria-hidden
                  >
                    <p.Icon size={26} style={{ color: p.iconColor }} />
                  </div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-terra">
                    {p.label}
                  </p>
                  <p
                    className="mb-1 font-serif text-[2.4rem] font-semibold leading-none"
                    style={{ color: p.iconColor }}
                  >
                    {p.target}
                  </p>
                  <h3 className="mb-2 font-serif text-sm font-semibold text-text">{p.title}</h3>
                  <p className="text-[12px] leading-relaxed text-muted">{p.desc}</p>
                </div>
              </article>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Commitments */}
      <section className="editorial-section editorial-section--tint px-4">
        <div className="site-container">
          <FadeIn>
            <header className="editorial-section-head">
              <p className="label-eyebrow mb-3">SPECIFIC COMMITMENTS</p>
              <h2 className="h-section">Targets you can hold us to</h2>
            </header>
          </FadeIn>
          <div className="commitment-grid">
            {COMMITMENTS.map((c, i) => (
              <FadeIn key={c.title} delay={i * 0.07}>
                <article className="sustainability-commitment-card soft-card soft-card-hover">
                  <div className="mb-4 h-[3px] w-10 rounded-full bg-terra" aria-hidden />
                  <h3 className="mb-2 font-serif text-[15px] font-semibold text-text">{c.title}</h3>
                  <p className="flex-1 text-[13px] leading-[1.75] text-muted">{c.body}</p>
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
