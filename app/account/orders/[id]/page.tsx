export const dynamic = 'force-dynamic'

import OrderDetailClient from './OrderDetailClient'

export const metadata = {
  title: 'Order Details — VerdeBliss',
  robots: { index: false },
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <OrderDetailClient orderId={id} />
}
