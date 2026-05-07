import Nav from '@/components/layout/Nav'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/features/cart/CartDrawer'
import CookieConsent from '@/components/ui/CookieConsent'
import AuthInitializer from '@/components/ui/AuthInitializer'
import MotionProvider from '@/components/ui/MotionProvider'
import './globals.css'
import { Cormorant_Garamond, DM_Sans } from 'next/font/google'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata = {
  metadataBase: new URL('https://www.verdebliss.com'),
  title: {
    default: 'VerdeBliss — Certified Organic Skincare India',
    template: '%s | VerdeBliss',
  },
  description:
    'Premium certified organic skincare from India. Vegan, cruelty-free botanicals for every skin type. Free shipping above ₹499.',
  keywords: [
    'organic skincare India',
    'natural skincare',
    'vegan skincare',
    'cruelty-free cosmetics',
    'bakuchiol serum',
    'niacinamide',
  ],
  authors: [{ name: 'VerdeBliss Cosmetics Private Limited' }],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://www.verdebliss.com',
    siteName: 'VerdeBliss',
    title: 'VerdeBliss — Certified Organic Skincare India',
    description:
      'Premium certified organic skincare. Vegan, cruelty-free botanicals for every skin type.',
    images: [{ url: '/images/products/serum.webp', width: 800, height: 800 }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@verdebliss',
    title: 'VerdeBliss — Certified Organic Skincare India',
    description: 'Premium certified organic skincare. Vegan, cruelty-free botanicals.',
    images: ['/images/products/serum.webp'],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://www.verdebliss.com' },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
      <head>
        {/* Fonts loaded via next/font below */}
        {/* Organization JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'VerdeBliss',
              legalName: 'VerdeBliss Cosmetics Private Limited',
              url: 'https://www.verdebliss.com',
              logo: 'https://www.verdebliss.com/images/logo.webp',
              description: 'Certified organic skincare brand from India.',
              foundingDate: '2019',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Kharadi',
                addressLocality: 'Pune',
                addressRegion: 'Maharashtra',
                postalCode: '411014',
                addressCountry: 'IN',
              },
              contactPoint: {
                '@type': 'ContactPoint',
                email: 'hello@verdebliss.in',
                contactType: 'customer service',
              },
            }),
          }}
        />
        {/* WebSite JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'VerdeBliss',
              url: 'https://www.verdebliss.com',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://www.verdebliss.com/products?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>
      <body>
        {/* Skip-to-content (7.3 accessibility) */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {/* Initialize auth on client */}
        <AuthInitializer />
        <MotionProvider>
          <Nav />
          <CartDrawer />
          <main id="main-content">{children}</main>
          <Footer />
          <CookieConsent />
        </MotionProvider>
      </body>
    </html>
  )
}
