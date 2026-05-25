import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { LegalDocument } from '@/constants/legal'
import { BUSINESS_COMPLIANCE } from '@/constants/businessCompliance'

export default function LegalPage({ doc, cta }: { doc: LegalDocument; cta?: React.ReactNode }) {
  return (
    <article className="bg-bg">
      <header className="legal-hero px-4">
        <div className="site-container-narrow">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-sage hover:text-white"
          >
            <ArrowLeft size={14} /> Back to VerdeBliss
          </Link>
          <p className="premium-kicker">LEGAL & TRUST CENTRE</p>
          <h1>{doc.title}</h1>
          <p>{doc.description}</p>
          <p className="mt-5 text-xs uppercase tracking-[0.16em] text-white/45">
            Last updated: {doc.updated}
          </p>
        </div>
      </header>
      <div className="site-container-narrow page-section legal-page-body">
        {doc.sections.map((section) => (
          <section key={section.heading} className="legal-section-card">
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
          </section>
        ))}
        {cta}
        <div className="legal-contact-card">
          <h2>Questions?</h2>
          <p>
            Contact{' '}
            <a href={`mailto:${BUSINESS_COMPLIANCE.emails.support}`}>
              {BUSINESS_COMPLIANCE.emails.support}
            </a>{' '}
            for general support or{' '}
            <a href={`mailto:${BUSINESS_COMPLIANCE.emails.privacy}`}>
              {BUSINESS_COMPLIANCE.emails.privacy}
            </a>{' '}
            for privacy-specific requests.
          </p>
        </div>
      </div>
    </article>
  )
}
