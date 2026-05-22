import Link from 'next/link'
import { Mail, Download, ArrowRight, ExternalLink } from 'lucide-react'
import FadeIn from '@/components/ui/FadeIn'

export const revalidate = 3600

export const metadata = {
  title: 'Press & Media',
  description:
    'Press resources, media kit, founder bios, and press coverage for VerdeBliss — organic botanical skincare brand from India.',
  alternates: { canonical: 'https://www.verdebliss.com/press' },
}

const COVERAGE = [
  {
    outlet: 'Vogue India',
    headline: 'The Indian Skincare Brand Quietly Going Global',
    date: 'March 2026',
    outletBg: '#2d4a32',
    outletColor: '#bfa06a',
  },
  {
    outlet: 'Forbes India',
    headline: 'Inside VerdeBliss: How a Pune Kitchen Built a Cult Skincare Brand',
    date: 'January 2026',
    outletBg: '#1c221e',
    outletColor: '#7d9b76',
  },
  {
    outlet: 'Mint Lounge',
    headline: "India's Clean-Beauty Wave Has a New Name",
    date: 'November 2025',
    outletBg: '#c07a5a',
    outletColor: '#fdfaf6',
  },
  {
    outlet: 'YourStory',
    headline: 'VerdeBliss Crosses 50,000 Customers Without a Single Influencer Campaign',
    date: 'September 2025',
    outletBg: '#4a6844',
    outletColor: '#bfa06a',
  },
]

const QUICK_FACTS = [
  ['Founded', '2019, Pune'],
  ['Certifications', 'In progress — see verdebliss.com/certifications'],
  ['Markets', 'India, UK, UAE, Singapore'],
  ['Customers', '50,000+'],
  ['Team', '34 (Pune R&D + Bangalore HQ)'],
]

export default function PressPage() {
  return (
    <div className="bg-bg">
      {/* Hero */}
      <section className="editorial-hero press-hero">
        <div className="editorial-hero__inner">
          <FadeIn>
            <p className="editorial-hero__kicker">PRESS &amp; MEDIA</p>
            <h1 className="editorial-hero__title">Press Centre</h1>
            <p className="editorial-hero__copy">
              Media kit, brand assets, founder bios, and recent coverage — everything a journalist
              needs.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Quick contact */}
      <section className="site-container editorial-section">
        <div className="press-contact-grid">
          <FadeIn>
            <article className="press-card soft-card soft-card-hover">
              <div className="press-card__icon bg-sagePale">
                <Mail size={20} className="text-forest" />
              </div>
              <h2 className="mb-2 font-serif text-lg font-semibold text-text">Press enquiries</h2>
              <p className="mb-4 flex-1 text-xs leading-relaxed text-muted">
                For interview requests, samples, and original commentary, please email our press
                team.
              </p>
              <a
                href="mailto:press@verdebliss.com"
                className="inline-flex items-center gap-1.5 font-semibold text-forest underline-offset-2 hover:underline"
              >
                press@verdebliss.com <ExternalLink size={13} />
              </a>
              <p className="mt-2 text-[11px] text-muted">Response within 24 hours, Mon–Fri.</p>
            </article>
          </FadeIn>

          <FadeIn delay={0.08}>
            <article className="press-card soft-card soft-card-hover">
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
                className="inline-flex min-h-11 w-fit items-center justify-center rounded-full border border-forest/45 bg-sagePale px-7 py-3 text-sm font-bold leading-none text-forest shadow-sm transition hover:border-forest hover:bg-forest hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
              >
                Request media kit
              </Link>
            </article>
          </FadeIn>
        </div>
      </section>

      {/* Quick facts */}
      <section className="editorial-section editorial-section--tint px-4">
        <div className="site-container">
          <FadeIn>
            <header className="editorial-section-head">
              <p className="label-eyebrow mb-2.5">QUICK FACTS</p>
              <h2 className="h-section">VerdeBliss at a glance</h2>
            </header>
          </FadeIn>
          <FadeIn delay={0.1}>
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
          </FadeIn>
        </div>
      </section>

      {/* Recent coverage */}
      <section className="site-container editorial-section">
        <FadeIn>
          <header className="editorial-section-head">
            <p className="label-eyebrow mb-2.5">RECENT COVERAGE</p>
            <h2 className="h-section">As featured in</h2>
          </header>
        </FadeIn>
        <div className="press-coverage-grid">
          {COVERAGE.map((c, i) => (
            <FadeIn key={c.headline} delay={i * 0.07}>
              <article className="press-coverage-card overflow-hidden soft-card soft-card-hover">
                {/* Outlet banner */}
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
                {/* Headline */}
                <div className="press-coverage-card__body">
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-terra">
                    PRESS FEATURE
                  </p>
                  <h3 className="font-serif text-base font-semibold leading-snug text-text">
                    &ldquo;{c.headline}&rdquo;
                  </h3>
                </div>
              </article>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="editorial-cta">
        <FadeIn>
          <h2 className="mb-3 font-serif text-[clamp(1.5rem,2.5vw,2rem)] font-normal text-white">
            Working on a story?
          </h2>
          <p className="mx-auto mb-7 max-w-[440px] text-center text-sm text-white/55">
            We respond to every legitimate press enquiry within 24 hours.
          </p>
          <a href="mailto:press@verdebliss.com" className="btn-terra">
            press@verdebliss.com <ArrowRight size={15} />
          </a>
        </FadeIn>
      </section>
    </div>
  )
}
