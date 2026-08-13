export const dynamic = 'force-dynamic'

import CheckoutClient from './CheckoutClient'
import './checkout.css'

export const metadata = {
  title: 'Checkout',
  description: 'Complete your VerdeBliss order securely with Razorpay.',
  robots: { index: false },
  // Without this the root layout's canonical is inherited, pointing every
  // non-overriding page at the homepage.
  alternates: { canonical: '/checkout' },
}

export default function CheckoutPage() {
  return <CheckoutClient />
}
