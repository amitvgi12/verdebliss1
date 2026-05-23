export const dynamic = 'force-dynamic'

import InvoiceClient from './InvoiceClient'

export const metadata = {
  title: 'Invoice — VerdeBliss',
  robots: { index: false },
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <InvoiceClient orderId={id} />
}
