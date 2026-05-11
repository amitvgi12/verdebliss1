import LegalPage from '@/components/layout/LegalPage'
import { LEGAL_DOCUMENTS } from '@/constants/legal'

const doc = LEGAL_DOCUMENTS.terms

export const metadata = {
  title: doc.title,
  description: doc.description,
  alternates: { canonical: 'https://www.verdebliss.com/terms' },
}

export default function Page() {
  return <LegalPage doc={doc} />
}
