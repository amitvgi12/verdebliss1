import AccountClient from './AccountClient'

export const metadata = {
  title: 'My Account',
  description: 'Manage your VerdeBliss account, orders, wishlist and loyalty points.',
  robots: { index: false },
}

export default function Page() {
  return <AccountClient />
}
  