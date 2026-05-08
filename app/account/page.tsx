export const dynamic = 'force-dynamic'

import AccountClient from './AccountClient'

export const metadata = {
  title: 'My Account',
  description: 'Manage your VerdeBliss account, orders, wishlist and loyalty points.',
  robots: { index: false },
}

export default function AccountPage() {
  return <AccountClient />
}
