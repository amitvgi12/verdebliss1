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
      <section className="bg-forest px-4 py-20 text-center">
        <div className="site-container">
          <FadeIn>
            <p className="mb-4 text-[10px] font-semibold tracking-[0.18em] text-sage">
              CLIMATE COMMITMENTS
            </p>
            <h1 className="m-0 mb-5 font-serif text-[clamp(2.2rem,4vw,3.4rem)] font-normal leading-[1.02] tracking-[-0.03em] text-white">
              Sustainability
            </h1>
            <p className="mx-auto max-w-[580px] text-center text-[15px] leading-[1.75] text-white/60">
              We measure what we change. What follows is our public roadmap. Evidence documents
              should be requested before relying on specific claims.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Pillars */}
      <section className="site-container py-16">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-5">
          {PILLARS.map((p, i) => (
            <FadeIn key={p.title} delay={i * 0.08}>
              <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_2px_12px_rgba(45,74,50,0.06)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_36px_rgba(45,74,50,0.11)]">
                {/* Accent bar */}
                <div className="h-1 w-full" style={{ background: p.accentBar }} />
                <div className="flex flex-1 flex-col p-6 text-center">
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
      <section className="bg-ivory px-4 py-16">
        <div className="site-container">
          <FadeIn>
            <header className="mb-12 text-center">
              <p className="label-eyebrow mb-3">SPECIFIC COMMITMENTS</p>
              <h2 className="h-section">Targets you can hold us to</h2>
            </header>
          </FadeIn>
          <div className="mx-auto grid max-w-[860px] grid-cols-1 gap-4 md:grid-cols-2">
            {COMMITMENTS.map((c, i) => (
              <FadeIn key={c.title} delay={i * 0.07}>
                <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-7 transition duration-300 hover:shadow-[0_8px_24px_rgba(45,74,50,0.09)]">
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
      <section className="bg-forest px-4 py-16 text-center">
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
