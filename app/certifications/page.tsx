import Link from 'next/link'
import { ArrowRight, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import FadeIn from '@/components/ui/FadeIn'
import { BUSINESS_COMPLIANCE } from '@/constants/businessCompliance'

export const revalidate = 3600

export const metadata = {
  title: 'Certifications & Trust Centre',
  description:
    'Transparency about VerdeBliss certification status, evidence requirements, and formulation standards. Updated as each claim is independently verified.',
  openGraph: {
    title: 'Certifications & Trust Centre | VerdeBliss',
    description:
      'Current certification status, evidence requirements, and formulation standards for VerdeBliss claims.',
    url: 'https://www.verdebliss.com/certifications',
    images: [{ url: '/og/home.jpg', width: 1200, height: 630, alt: 'VerdeBliss Trust Centre' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Certifications & Trust Centre | VerdeBliss',
    description:
      'Current certification status, evidence requirements, and formulation standards for VerdeBliss claims.',
    images: ['/og/home.jpg'],
  },
  alternates: { canonical: 'https://www.verdebliss.com/certifications' },
}

type EvidenceStatus = 'pending' | 'in-progress' | 'verified'

interface ClaimRow {
  claim: string
  requiredProof: string
  status: EvidenceStatus
  note?: string
}

const CLAIMS: ClaimRow[] = [
  {
    claim: 'Organic botanical ingredients',
    requiredProof: 'Issuer name, certificate/licence ID, product or ingredient scope, expiry date',
    status: 'in-progress',
    note: 'Sourcing standards documented; third-party audit in progress.',
  },
  {
    claim: 'Vegan-friendly formulation',
    requiredProof:
      'Issuer listing URL or certificate ID confirming no animal-derived ingredients at any stage',
    status: 'in-progress',
    note: 'Most formulas are vegan-friendly. Wild Berry Lip Elixir contains Beeswax and is not vegan. Formal certification scope is being documented.',
  },
  {
    claim: 'Cruelty-free positioning',
    requiredProof:
      'Leaping Bunny or equivalent listing confirming no animal testing by brand, suppliers, or labs',
    status: 'in-progress',
    note: 'No animal testing is conducted or commissioned. Application to certifying body in progress.',
  },
  {
    claim: 'Dermatologist-reviewed',
    requiredProof:
      'Lab or dermatologist report: name of assessor, date, test method, product scope',
    status: 'pending',
    note: 'Internal skin-compatibility testing conducted. Independent dermatologist evidence file is in review.',
  },
  {
    claim: 'SPF rating efficacy',
    requiredProof:
      'SPF test lab report: lab name, accreditation, test standard (ISO 24444 or equivalent), batch/formula scope',
    status: 'pending',
    note: 'Botanical Mineral Sun Shield contains 20% non-nano Zinc Oxide. Independent SPF-rating efficacy evidence is in review.',
  },
  {
    claim: 'Recyclable / eco-friendly packaging',
    requiredProof:
      'FSC licence or equivalent packaging certification: licence number, scope, packaging type covered',
    status: 'pending',
    note: 'Recyclable packaging materials in use. Formal FSC or equivalent evidence file is being prepared.',
  },
]

const STATUS_CONFIG: Record<
  EvidenceStatus,
  { label: string; color: string; bg: string; Icon: typeof Clock }
> = {
  verified: { label: 'Verified', color: '#2d6a4f', bg: '#e8f5e9', Icon: CheckCircle2 },
  'in-progress': { label: 'Audit underway', color: '#7d5a00', bg: '#fff8e1', Icon: Clock },
  pending: { label: 'Evidence file', color: '#5d6548', bg: '#eef3e8', Icon: AlertCircle },
}

export default function CertificationsPage() {
  return (
    <div className="bg-bg">
      {/* Hero */}
      <section className="editorial-hero">
        <div className="editorial-hero__inner">
          <FadeIn>
            <p className="editorial-hero__kicker">TRANSPARENCY</p>
            <h1 className="editorial-hero__title">Certifications & Trust Centre</h1>
            <p className="editorial-hero__copy">
              Every claim we make should be tied to verifiable evidence. This page publishes the
              current status of each claim — what we say, what proof is required, and where we are
              in obtaining it. We update this page as each certification is confirmed.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Notice */}
      <section className="site-container" style={{ paddingTop: '2rem', paddingBottom: '1rem' }}>
        <FadeIn>
          <div
            style={{
              background: '#fff8e1',
              border: '1px solid #ffe082',
              borderRadius: 12,
              padding: '16px 20px',
              fontSize: 13,
              color: '#5d4200',
              lineHeight: 1.7,
              maxWidth: 760,
              marginInline: 'auto',
            }}
          >
            <strong>Before third-party certificates are issued:</strong> product pages and marketing
            copy use positioning language — &ldquo;organic botanical ingredients&rdquo;,
            &ldquo;vegan-friendly where formulation permits&rdquo;, &ldquo;no animal testing
            stance&rdquo; — rather than certification assertions. We will replace positioning
            language with verified claim language as each third-party certificate is issued and
            published here.
          </div>
        </FadeIn>
      </section>

      {/* Claims matrix */}
      <section className="site-container editorial-section">
        <FadeIn>
          <header className="editorial-section-head">
            <p className="label-eyebrow mb-3">CLAIMS MATRIX</p>
            <h2 className="h-section">Claim-by-claim evidence status</h2>
          </header>
        </FadeIn>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            maxWidth: 860,
            marginInline: 'auto',
          }}
        >
          {CLAIMS.map((row, i) => {
            const cfg = STATUS_CONFIG[row.status]
            const Icon = cfg.Icon
            return (
              <FadeIn key={row.claim} delay={i * 0.05}>
                <article
                  style={{
                    background: '#fff',
                    border: '1px solid #e5e0d8',
                    borderRadius: 14,
                    padding: '20px 22px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 12,
                      flexWrap: 'wrap',
                    }}
                  >
                    <h3
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: 16,
                        fontWeight: 600,
                        color: '#1c221e',
                        margin: 0,
                      }}
                    >
                      {row.claim}
                    </h3>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        padding: '4px 12px',
                        borderRadius: 99,
                        background: cfg.bg,
                        color: cfg.color,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Icon size={12} />
                      {cfg.label}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, color: '#5a6654', lineHeight: 1.7 }}>
                    <strong style={{ color: '#1c221e' }}>Required proof: </strong>
                    {row.requiredProof}
                  </div>

                  {row.note && (
                    <div
                      style={{
                        fontSize: 12,
                        color: '#7a7060',
                        lineHeight: 1.6,
                        borderTop: '1px solid #f0ebe3',
                        paddingTop: 8,
                        fontStyle: 'italic',
                      }}
                    >
                      {row.note}
                    </div>
                  )}
                </article>
              </FadeIn>
            )
          })}
        </div>
      </section>

      {/* What we publish when verified */}
      <section className="editorial-section editorial-section--tint px-4">
        <div className="site-container" style={{ maxWidth: 760 }}>
          <FadeIn>
            <header className="editorial-section-head">
              <p className="label-eyebrow mb-3">VERIFICATION STANDARD</p>
              <h2 className="h-section">What we publish when a claim is verified</h2>
            </header>
          </FadeIn>
          <FadeIn delay={0.05}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 16,
              }}
            >
              {[
                {
                  label: 'Organic',
                  items: [
                    'Issuing body',
                    'Certificate/licence ID',
                    'Product scope',
                    'Expiry date',
                    'Verification URL',
                  ],
                },
                {
                  label: 'Vegan / Cruelty-free',
                  items: [
                    'Issuing body',
                    'Listing URL or cert ID',
                    'Brand scope confirmed',
                    'Supplier scope',
                    'Renewal date',
                  ],
                },
                {
                  label: 'Derma-Tested',
                  items: [
                    'Lab or assessor name',
                    'Test method and standard',
                    'Date of assessment',
                    'Products covered',
                  ],
                },
                {
                  label: 'SPF rating efficacy',
                  items: [
                    'Lab name and accreditation',
                    'Test standard (e.g. ISO 24444)',
                    'Formula/batch scope',
                    'Report date',
                  ],
                },
                {
                  label: 'Eco/FSC Packaging',
                  items: [
                    'FSC licence number',
                    'Packaging type scope',
                    'Supplier chain',
                    'Renewal date',
                  ],
                },
              ].map((section) => (
                <div
                  key={section.label}
                  style={{
                    background: '#fff',
                    border: '1px solid #e5e0d8',
                    borderRadius: 12,
                    padding: '16px 18px',
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      color: '#6b7a5e',
                      marginBottom: 8,
                      textTransform: 'uppercase',
                    }}
                  >
                    {section.label}
                  </p>
                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    {section.items.map((item) => (
                      <li
                        key={item}
                        style={{
                          fontSize: 12,
                          color: '#5a6654',
                          lineHeight: 1.6,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 6,
                        }}
                      >
                        <CheckCircle2
                          size={11}
                          style={{ color: '#6b7a5e', marginTop: 3, flexShrink: 0 }}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section className="editorial-cta">
        <FadeIn>
          <h2 className="mb-3 font-serif text-[clamp(1.5rem,2.5vw,2rem)] font-normal text-white">
            Questions about our formulations?
          </h2>
          <p className="mx-auto mb-7 max-w-[440px] text-center text-sm text-white/55">
            Email us at {BUSINESS_COMPLIANCE.emails.support} or browse product pages for full INCI
            lists.
          </p>
          <Link href="/products" className="btn-terra">
            Browse products <ArrowRight size={15} />
          </Link>
        </FadeIn>
      </section>
    </div>
  )
}
