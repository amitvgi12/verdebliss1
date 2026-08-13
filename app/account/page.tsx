export const dynamic = 'force-dynamic'

import AccountClient from './AccountClient'

export const metadata = {
  title: 'My Account',
  description: 'Manage your VerdeBliss account, orders, wishlist and loyalty points.',
  robots: { index: false },
  // Without this the root layout's canonical is inherited, pointing every
  // non-overriding page at the homepage.
  alternates: { canonical: '/account' },
}

export default function AccountPage() {
  return <AccountClient />
}
