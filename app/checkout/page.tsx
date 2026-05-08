export const dynamic = 'force-dynamic'

import CheckoutClient from './CheckoutClient'

export const metadata = {
  title: 'Checkout',
  description: 'Complete your VerdeBliss order securely with Razorpay.',
  robots: { index: false },
}

export default function CheckoutPage() {
  return <CheckoutClient />
}
