import Nav from '@/components/layout/Nav'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/features/cart/CartDrawer'
import CookieConsent from '@/components/ui/CookieConsent'
import AuthInitializer from '@/components/ui/AuthInitializer'
import MotionProvider from '@/components/ui/MotionProvider'
import { StructuredData } from '@/lib/structured-data'
import './globals.css'
import type { ReactNode } from 'react'

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

const organisationLd = {
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
    email: 'hello@verdebliss.com',
    contactType: 'customer service',
  },
  hasMerchantReturnPolicy: {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: 'IN',
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: 14,
    returnMethod: 'https://schema.org/ReturnByMail',
    returnFees: 'https://schema.org/FreeReturn',
  },
}

const websiteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'VerdeBliss',
  url: 'https://www.verdebliss.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://www.verdebliss.com/products?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect / DNS-prefetch for the payment iframe so first-checkout RTT is minimal */}
        <link rel="preconnect" href="https://checkout.razorpay.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://checkout.razorpay.com" />
        {/* JSON-LD with nonce — see proxy.ts + lib/structured-data.tsx */}
        <StructuredData data={organisationLd} />
        <StructuredData data={websiteLd} />
      </head>
      <body>
        {/* Skip-to-content (WCAG 2.4.1) */}
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
