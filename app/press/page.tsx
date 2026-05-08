export const dynamic = 'force-dynamic'

import PressClient from './PressClient'

export const metadata = {
  title: 'Press & Media — VerdeBliss',
  description: 'Press coverage, media kit and brand assets for VerdeBliss organic skincare.',
  alternates: { canonical: 'https://www.verdebliss.com/press' },
}

export default function PressPage() {
  return <PressClient />
}
