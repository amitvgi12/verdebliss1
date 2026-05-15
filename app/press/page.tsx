import Link from 'next/link'
import { Mail, Download, ArrowRight } from 'lucide-react'
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
  },
  {
    outlet: 'Forbes India',
    headline: 'Inside VerdeBliss: How a Pune Kitchen Built a Cult Skincare Brand',
    date: 'January 2026',
  },
  {
    outlet: 'Mint Lounge',
    headline: 'India&apos;s Clean-Beauty Wave Has a New Name',
    date: 'November 2025',
  },
  {
    outlet: 'YourStory',
    headline: 'VerdeBliss Crosses 50,000 Customers Without a Single Influencer Campaign',
    date: 'September 2025',
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
      <section className="bg-forest px-4 py-14 text-center">
        <div className="container-content">
          <FadeIn>
            <p className="mb-3 text-[10px] font-semibold tracking-[0.16em] text-sage">
              PRESS &amp; MEDIA
            </p>
            <h1 className="m-0 mb-4 font-serif text-[clamp(2rem,3.5vw,3rem)] font-normal leading-[1.05] text-white">
              Press Centre
            </h1>
            <p className="mx-auto max-w-[600px] text-center text-sm leading-relaxed text-white/65">
              Media kit, brand assets, founder bios, and recent coverage — everything a journalist
              needs.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Quick contact */}
      <section className="container-content py-10">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-border bg-card p-7">
            <Mail size={22} className="mb-3 text-forest" />
            <h2 className="mb-1 font-serif text-lg font-semibold text-text">Press enquiries</h2>
            <p className="mb-3 text-xs leading-relaxed text-muted">
              For interview requests, samples, and original commentary, please email
            </p>
            <a
              href="mailto:press@verdebliss.com"
              className="font-medium text-forest underline-offset-2 hover:underline"
            >
              press@verdebliss.com
            </a>
            <p className="mt-3 text-[11px] text-muted">Response within 24 hours, Mon–Fri.</p>
          </article>

          <article className="rounded-2xl border border-border bg-card p-7">
            <Download size={22} className="mb-3 text-forest" />
            <h2 className="mb-1 font-serif text-lg font-semibold text-text">Media kit</h2>
            <p className="mb-3 text-xs leading-relaxed text-muted">
              Logos, product photography, founder headshots, and brand guidelines.
            </p>
            <Link href="/contact" className="btn-outline px-5 py-2 text-xs">
              Request media kit
            </Link>
          </article>
        </div>
      </section>

      {/* Quick facts */}
      <section className="bg-ivory px-4 py-16">
        <div className="container-content">
          <header className="mb-8 text-center">
            <p className="label-eyebrow mb-2.5">QUICK FACTS</p>
            <h2 className="h-section">VerdeBliss at a glance</h2>
          </header>
          <dl className="mx-auto grid max-w-[720px] grid-cols-1 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {QUICK_FACTS.map(([label, value]) => (
              <div
                key={label}
                className="flex flex-col gap-1 px-6 py-4 sm:flex-row sm:items-center"
              >
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted sm:w-44">
                  {label}
                </dt>
                <dd className="text-sm text-text">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Recent coverage */}
      <section className="container-content py-16">
        <header className="mb-8 text-center">
          <p className="label-eyebrow mb-2.5">RECENT COVERAGE</p>
          <h2 className="h-section">As featured in</h2>
        </header>
        <div className="mx-auto grid max-w-[820px] grid-cols-1 gap-4 md:grid-cols-2">
          {COVERAGE.map((c) => (
            <article key={c.headline} className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-terra">
                {c.outlet} · {c.date}
              </div>
              <h3 className="font-serif text-base font-semibold leading-snug text-text">
                {c.headline}
              </h3>
            </article>
          ))}
        </div>
      </section>

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
