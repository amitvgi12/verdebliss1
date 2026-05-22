import Link from 'next/link'
import { Mail, Download, ArrowRight, ExternalLink } from 'lucide-react'

export const dynamic = 'force-static'

export const metadata = {
  title: 'Press & Media',
  description:
    'Press resources, media kit, founder bios, and coverage status for VerdeBliss — botanical skincare brand from India.',
  alternates: { canonical: 'https://www.verdebliss.com/press' },
}

const COVERAGE = [
  {
    outlet: 'Coverage status',
    headline: 'Independent press coverage will appear here once published and verifiable.',
    date: 'Pre-launch',
    outletBg: '#2d4a32',
    outletColor: '#bfa06a',
  },
  {
    outlet: 'Claims matrix',
    headline: 'Certification and claim evidence is published in the Trust Centre.',
    date: 'Updated live',
    outletBg: '#1c221e',
    outletColor: '#7d9b76',
  },
  {
    outlet: 'Media assets',
    headline: 'Product photography, logo assets, and founder notes are available on request.',
    date: 'Available',
    outletBg: '#c07a5a',
    outletColor: '#fdfaf6',
  },
]

const QUICK_FACTS = [
  ['Founded', '2019, Pune'],
  ['Certifications', 'In progress — see verdebliss.com/certifications'],
  ['Launch market', 'India'],
  ['Status', 'Pre-launch storefront'],
  ['Catalogue', '8 current formulas'],
]

export default function PressPage() {
  return (
    <div className="bg-bg">
      {/* Hero */}
      <section className="editorial-hero press-hero">
        <div className="editorial-hero__inner">
          <p className="editorial-hero__kicker">PRESS &amp; MEDIA</p>
          <h1 className="editorial-hero__title">Press Centre</h1>
          <p className="editorial-hero__copy">
            Media kit, brand assets, founder notes, and claim evidence — everything a journalist
            needs.
          </p>
        </div>
      </section>

      {/* Quick contact */}
      <section className="site-container editorial-section">
        <div className="press-contact-grid">
          <article className="press-card soft-card">
            <div className="press-card__icon bg-sagePale">
              <Mail size={20} className="text-forest" />
            </div>
            <h2 className="mb-2 font-serif text-lg font-semibold text-text">Press enquiries</h2>
            <p className="mb-4 flex-1 text-xs leading-relaxed text-muted">
              For interview requests, samples, and original commentary, please email our press team.
            </p>
            <a
              href="mailto:press@verdebliss.com"
              className="inline-flex items-center gap-1.5 font-semibold text-forest underline-offset-2 hover:underline"
            >
              press@verdebliss.com <ExternalLink size={13} />
            </a>
            <p className="mt-2 text-[11px] text-muted">Response within 24 hours, Mon–Fri.</p>
          </article>

          <article className="press-card soft-card">
            <div className="press-card__icon bg-terraPale">
              <Download size={20} className="text-terra" />
            </div>
            <h2 className="mb-2 font-serif text-lg font-semibold text-text">Media kit</h2>
            <p className="mb-4 flex-1 text-xs leading-relaxed text-muted">
              Logos, product photography, founder headshots, and brand guidelines — all in one
              download.
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-flex w-fit shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-forest/35 bg-sagePale px-8 py-2.5 text-[13px] font-bold text-forest shadow-[0_8px_18px_rgba(45,74,50,0.1)] transition hover:-translate-y-0.5 hover:border-forest/55 hover:bg-[#DDE9DA] hover:shadow-[0_12px_22px_rgba(45,74,50,0.14)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
            >
              <Download size={15} aria-hidden />
              Request media kit
            </Link>
          </article>
        </div>
      </section>

      {/* Quick facts */}
      <section className="editorial-section editorial-section--tint px-4">
        <div className="site-container">
          <header className="editorial-section-head">
            <p className="label-eyebrow mb-2.5">QUICK FACTS</p>
            <h2 className="h-section">VerdeBliss at a glance</h2>
          </header>
          <dl className="press-facts soft-card divide-y divide-border">
            {QUICK_FACTS.map(([label, value]) => (
              <div key={label} className="transition hover:bg-ivory">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-terra">
                  {label}
                </dt>
                <dd className="text-sm font-medium text-text">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Recent coverage */}
      <section className="site-container editorial-section">
        <header className="editorial-section-head">
          <p className="label-eyebrow mb-2.5">COVERAGE STATUS</p>
          <h2 className="h-section">Press materials without inflated proof.</h2>
        </header>
        <div className="press-coverage-grid">
          {COVERAGE.map((c) => (
            <article key={c.headline} className="press-coverage-card overflow-hidden soft-card">
              <div className="press-coverage-card__banner" style={{ background: c.outletBg }}>
                <span className="press-coverage-card__outlet" style={{ color: c.outletColor }}>
                  {c.outlet}
                </span>
                <span
                  className="press-coverage-card__date"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                  {c.date}
                </span>
              </div>
              <div className="press-coverage-card__body">
                <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-terra">
                  PRESS NOTE
                </p>
                <h3 className="font-serif text-base font-semibold leading-snug text-text">
                  &ldquo;{c.headline}&rdquo;
                </h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="editorial-cta">
        <h2 className="mb-3 font-serif text-[clamp(1.5rem,2.5vw,2rem)] font-normal text-white">
          Working on a story?
        </h2>
        <p className="mx-auto mb-7 max-w-[440px] text-center text-sm text-white/75">
          We respond to every legitimate press enquiry within 24 hours.
        </p>
        <a href="mailto:press@verdebliss.com" className="btn-terra">
          press@verdebliss.com <ArrowRight size={15} />
        </a>
      </section>
    </div>
  )
}
