import LegalPage from '@/components/layout/LegalPage'
import { LEGAL_DOCUMENTS } from '@/constants/legal'

const doc = LEGAL_DOCUMENTS.shipping

export const metadata = {
  title: doc.title,
  description: doc.description,
  alternates: { canonical: 'https://www.verdebliss.com/shipping-policy' },
}

export default function Page() {
  return <LegalPage doc={doc} />
}
