export const dynamic = 'force-dynamic'

import RefundClient from './RefundClient'

export const metadata = {
  title: 'Request a Refund',
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://www.verdebliss.com/refund' },
}

export default function Page() {
  return <RefundClient />
}
