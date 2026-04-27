import { Metadata } from 'next'
import Nav from '@/components/layout/Nav'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/features/cart/CartDrawer'
import CookieConsent from '@/components/ui/CookieConsent'
import AuthInitializer from '@/components/ui/AuthInitializer'
import './globals.css'

export const metadata = {
  metadataBase: new URL('https://www.verdebliss.com'),
  title: {
    default: 'VerdeBliss — Certified Organic Skincare India',
    template: '%s | VerdeBliss',
  },
  description: 'Premium certified organic skincare from India. Vegan, cruelty-free botanicals for every skin type. Free shipping above ₹499.',
  keywords: ['organic skincare India', 'natural skincare', 'vegan skincare', 'cruelty-free cosmetics', 'bakuchiol serum', 'niacinamide'],
  authors: [{ name: 'VerdeBliss Cosmetics Private Limited' }],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://www.verdebliss.com',
    siteName: 'VerdeBliss',
    title: 'VerdeBliss — Certified Organic Skincare India',
    description: 'Premium certified organic skincare. Vegan, cruelty-free botanicals for every skin type.',
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
    <html lang="en">
      <head>
        {/* Preload hero LCP image */}
        <link rel="preload" as="image" href="/images/products/serum.webp" fetchPriority="high" />
        {/* Preconnect to font providers */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
        {/* Organization JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'VerdeBliss',
          legalName: 'VerdeBliss Cosmetics Private Limited',
          url: 'https://www.verdebliss.com',
          logo: 'https://www.verdebliss.com/images/logo.webp',
          description: 'Certified organic skincare brand from India.',
          foundingDate: '2019',
          address: { '@type': 'PostalAddress', streetAddress: 'Kharadi', addressLocality: 'Pune', addressRegion: 'Maharashtra', postalCode: '411014', addressCountry: 'IN' },
          contactPoint: { '@type': 'ContactPoint', email: 'hello@verdebliss.in', contactType: 'customer service' },
        }) }} />
        {/* WebSite JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'VerdeBliss',
          url: 'https://www.verdebliss.com',
          potentialAction: { '@type': 'SearchAction', target: 'https://www.verdebliss.com/products?q={search_term_string}', 'query-input': 'required name=search_term_string' },
        }) }} />
      </head>
      <body>
        {/* Skip-to-content (7.3 accessibility) */}
        <a href="#main-content" className="skip-link">Skip to main content</a>
        {/* Initialize auth on client */}
        <AuthInitializer />
        <Nav />
        <CartDrawer />
        <main id="main-content">{children}</main>
        <Footer />
        <CookieConsent />
      </body>
    </html>
  )
}
