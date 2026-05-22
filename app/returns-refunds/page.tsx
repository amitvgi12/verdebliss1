import Link from 'next/link'
import LegalPage from '@/components/layout/LegalPage'
import { LEGAL_DOCUMENTS } from '@/constants/legal'

const doc = LEGAL_DOCUMENTS.returns

export const metadata = {
  title: doc.title,
  description: doc.description,
  openGraph: {
    title: `${doc.title} | VerdeBliss`,
    description: doc.description,
    url: 'https://www.verdebliss.com/returns-refunds',
    images: [{ url: '/og/home.jpg', width: 1200, height: 630, alt: 'VerdeBliss returns policy' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${doc.title} | VerdeBliss`,
    description: doc.description,
    images: ['/og/home.jpg'],
  },
  alternates: { canonical: 'https://www.verdebliss.com/returns-refunds' },
}

const refundCta = (
  <div className="legal-section-card legal-section-card--cta">
    <p className="text-sm font-medium text-text">Already have an order?</p>
    <Link href="/refund" className="legal-cta-link">
      File a refund request →
    </Link>
  </div>
)

export default function Page() {
  return <LegalPage doc={doc} cta={refundCta} />
}
