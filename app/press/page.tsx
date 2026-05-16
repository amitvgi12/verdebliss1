import Link from 'next/link'
import { Mail, Download, ArrowRight, ExternalLink } from 'lucide-react'
import FadeIn from '@/components/ui/FadeIn'

export const revalidate = 3600

export const metadata = {
  title: 'Press & Media',
  description:
    'Press resources, media kit, founder bios, and press coverage for VerdeBliss — certified organic skincare brand from India.',
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
  ['Certifications', 'USDA Organic · Ecocert · Cruelty-Free International'],
  ['Markets', 'India, UK, UAE, Singapore'],
  ['Customers', '50,000+'],
  ['Team', '34 (Pune R&D + Bangalore HQ)'],
]

export default function PressPage() {
  return (
    <div className="bg-bg">
      {/* Hero */}
      <section className="bg-forest px-4 py-20 text-center">
        <div className="container-content">
          <FadeIn>
            <p className="mb-4 text-[10px] font-semibold tracking-[0.18em] text-sage">
              PRESS &amp; MEDIA
            </p>
            <h1 className="m-0 mb-5 font-serif text-[clamp(2.2rem,4vw,3.4rem)] font-normal leading-[1.02] tracking-[-0.03em] text-white">
              Press Centre
            </h1>
            <p className="mx-auto max-w-[560px] text-center text-[15px] leading-[1.75] text-white/60">
              Media kit, brand assets, founder bios, and recent coverage — everything a journalist
              needs.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Quick contact */}
      <section className="container-content py-12">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FadeIn>
            <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-7 transition hover:shadow-[0_8px_28px_rgba(45,74,50,0.08)]">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-sagePale">
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
            <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-7 transition hover:shadow-[0_8px_28px_rgba(45,74,50,0.08)]">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-terraPale">
                <Download size={20} className="text-terra" />
              </div>
              <h2 className="mb-2 font-serif text-lg font-semibold text-text">Media kit</h2>
              <p className="mb-4 flex-1 text-xs leading-relaxed text-muted">
                Logos, product photography, founder headshots, and brand guidelines — all in one
                download.
              </p>
              <Link href="/contact" className="btn-outline self-start px-5 py-2 text-xs">
                Request media kit
              </Link>
            </article>
          </FadeIn>
        </div>
      </section>

      {/* Quick facts */}
      <section className="bg-ivory px-4 py-14">
        <div className="container-content">
          <FadeIn>
            <header className="mb-8 text-center">
              <p className="label-eyebrow mb-2.5">QUICK FACTS</p>
              <h2 className="h-section">VerdeBliss at a glance</h2>
            </header>
          </FadeIn>
          <FadeIn delay={0.1}>
            <dl className="mx-auto grid max-w-[720px] grid-cols-1 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {QUICK_FACTS.map(([label, value]) => (
                <div
                  key={label}
                  className="flex flex-col gap-1 px-6 py-4 transition hover:bg-ivory sm:flex-row sm:items-center"
                >
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-terra sm:w-44">
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
      <section className="container-content py-14">
        <FadeIn>
          <header className="mb-8 text-center">
            <p className="label-eyebrow mb-2.5">RECENT COVERAGE</p>
            <h2 className="h-section">As featured in</h2>
          </header>
        </FadeIn>
        <div className="mx-auto grid max-w-[860px] grid-cols-1 gap-5 md:grid-cols-2">
          {COVERAGE.map((c, i) => (
            <FadeIn key={c.headline} delay={i * 0.07}>
              <article className="group overflow-hidden rounded-2xl border border-border bg-card shadow-[0_2px_10px_rgba(45,74,50,0.05)] transition hover:-translate-y-1 hover:shadow-[0_10px_32px_rgba(45,74,50,0.1)]">
                {/* Outlet banner */}
                <div
                  className="flex items-center justify-between px-5 py-3"
                  style={{ background: c.outletBg }}
                >
                  <span
                    className="font-sans text-xs font-black uppercase tracking-[0.14em]"
                    style={{ color: c.outletColor }}
                  >
                    {c.outlet}
                  </span>
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: 'rgba(255,255,255,0.45)' }}
                  >
                    {c.date}
                  </span>
                </div>
                {/* Headline */}
                <div className="p-5">
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
      <section className="bg-forest px-4 py-14 text-center">
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
