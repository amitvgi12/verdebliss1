export const dynamic = 'force-dynamic'

import CheckoutClient from './CheckoutClient'
import './checkout.css'

export const metadata = {
  title: 'Checkout',
  description: 'Complete your VerdeBliss order securely with Razorpay.',
  robots: { index: false },
}

export default function CheckoutPage() {
  return <CheckoutClient />
}
