import Nav from '@/components/layout/Nav'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/features/cart/CartDrawer'
import CookieConsent from '@/components/ui/CookieConsent'
import AuthInitializer from '@/components/ui/AuthInitializer'
import MotionProvider from '@/components/ui/MotionProvider'
import ChatBotLoader from '@/components/ui/ChatBotLoader'
import { StructuredData } from '@/lib/structured-data'
import './globals.css'
import type { ReactNode } from 'react'
import { Cormorant_Garamond, DM_Sans } from 'next/font/google'
import { BUSINESS_COMPLIANCE } from '@/constants/businessCompliance'

const sans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-serif',
})

export const metadata = {
  metadataBase: new URL('https://www.verdebliss.com'),
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut: ['/favicon.svg'],
  },
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
  legalName: BUSINESS_COMPLIANCE.legalName,
  url: 'https://www.verdebliss.com',
  logo: 'https://www.verdebliss.com/images/logo.webp',
  description: 'Certified organic skincare brand from India.',
  foundingDate: '2019',
  address: {
    '@type': 'PostalAddress',
    ...BUSINESS_COMPLIANCE.registeredOffice,
  },
  identifier: [
    { '@type': 'PropertyValue', name: 'CIN', value: BUSINESS_COMPLIANCE.cin },
    { '@type': 'PropertyValue', name: 'GSTIN', value: BUSINESS_COMPLIANCE.gstin },
  ],
  contactPoint: [
    {
      '@type': 'ContactPoint',
      email: BUSINESS_COMPLIANCE.supportEmail,
      telephone: BUSINESS_COMPLIANCE.helpline.display,
      contactType: 'customer service',
      availableLanguage: ['en'],
      hoursAvailable: BUSINESS_COMPLIANCE.helpline.hours,
    },
    {
      '@type': 'ContactPoint',
      email: BUSINESS_COMPLIANCE.grievanceOfficer.email,
      contactType: 'grievance officer',
    },
  ],
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
    <html lang="en" className={`${sans.variable} ${serif.variable}`} data-scroll-behavior="smooth">
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
          <main id="main-content">{children}</main>
          <Footer />
          <CartDrawer />
          <ChatBotLoader />
          <CookieConsent />
        </MotionProvider>
      </body>
    </html>
  )
}
