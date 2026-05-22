import Nav from '@/components/layout/Nav'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/features/cart/CartDrawer'
import CookieConsent from '@/components/ui/CookieConsent'
import AuthInitializer from '@/components/ui/AuthInitializer'
import MotionProvider from '@/components/ui/MotionProvider'
import ChatBotLoader from '@/components/ui/ChatBotLoader'
import VercelInsights from '@/components/ui/VercelInsights'
import { StructuredData } from '@/lib/structured-data'
import './globals.css'
import type { ReactNode } from 'react'
import localFont from 'next/font/local'
import { BUSINESS_COMPLIANCE } from '@/constants/businessCompliance'

const sans = localFont({
  src: [
    { path: './fonts/dm-sans-latin.woff2', style: 'normal', weight: '100 900' },
    { path: './fonts/dm-sans-italic-latin.woff2', style: 'italic', weight: '100 900' },
  ],
  display: 'swap',
  variable: '--font-sans',
})

const serif = localFont({
  src: [
    { path: './fonts/cormorant-garamond-latin.woff2', style: 'normal', weight: '300 600' },
    {
      path: './fonts/cormorant-garamond-italic-latin.woff2',
      style: 'italic',
      weight: '300 600',
    },
  ],
  display: 'swap',
  variable: '--font-serif',
})

export const metadata = {
  metadataBase: new URL('https://www.verdebliss.com'),
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' }],
    shortcut: ['/favicon.ico'],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  title: {
    default: 'VerdeBliss — Botanical Skincare India',
    template: '%s | VerdeBliss',
  },
  description:
    'Premium botanical skincare from India. INCI-first formulas for every skin type. Free shipping above ₹499.',
  authors: [{ name: 'VerdeBliss Cosmetics Private Limited' }],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://www.verdebliss.com',
    siteName: 'VerdeBliss',
    title: 'VerdeBliss — Botanical Skincare India',
    description: 'Premium botanical skincare. INCI-first formulas for every skin type.',
    images: [{ url: '/og/home.jpg', width: 1200, height: 630, alt: 'VerdeBliss botanical skincare' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@verdebliss',
    title: 'VerdeBliss — Botanical Skincare India',
    description: 'Premium botanical skincare. INCI-first formulas.',
    images: ['/og/home.jpg'],
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
  description: 'Organic botanical skincare brand from India.',
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

const buildSha =
  process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? 'dev'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`} data-scroll-behavior="smooth">
      <head>
        <meta name="x-build-sha" content={buildSha} />
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
          <VercelInsights />
          <CookieConsent />
        </MotionProvider>
      </body>
    </html>
  )
}
