import Nav from '@/components/layout/Nav'
import Footer from '@/components/layout/Footer'
import CartDrawerLoader from '@/components/ui/CartDrawerLoader'
import CookieConsent from '@/components/ui/CookieConsent'
import AuthInitializer from '@/components/ui/AuthInitializer'
import MotionProvider from '@/components/ui/MotionProvider'
import ChatBotLoader from '@/components/ui/ChatBotLoader'
import VercelInsightsLoader from '@/components/ui/VercelInsightsLoader'
import { Toaster } from '@/components/ui/Toast'
import { StructuredData } from '@/lib/structured-data'
import './globals.css'
import type { ReactNode } from 'react'
import localFont from 'next/font/local'
import {
  BUSINESS_COMPLIANCE,
  assertProductionBusinessCompliance,
} from '@/constants/businessCompliance'
import { organizationJsonLd, websiteJsonLd } from '@/lib/site-schema'
import { getProductsServer } from '@/lib/products-server'

assertProductionBusinessCompliance()

const sans = localFont({
  src: [
    { path: './fonts/dm-sans-latin.woff2', style: 'normal', weight: '100 900' },
    { path: './fonts/dm-sans-italic-latin.woff2', style: 'italic', weight: '100 900' },
  ],
  display: 'swap',
  adjustFontFallback: 'Arial',
  fallback: ['Arial', 'Helvetica', 'sans-serif'],
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
  adjustFontFallback: 'Times New Roman',
  fallback: ['Times New Roman', 'Georgia', 'serif'],
  variable: '--font-serif',
})

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2D4A32',
}

export const metadata = {
  metadataBase: new URL('https://www.verdebliss.com'),
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  title: {
    default: 'VerdeBliss — Botanical Skincare India',
    template: '%s | VerdeBliss',
  },
  description:
    'Premium botanical skincare from India. INCI-first formulas for every skin type. Free shipping above ₹499.',
  authors: [{ name: BUSINESS_COMPLIANCE.legalName }],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://www.verdebliss.com',
    siteName: 'VerdeBliss',
    title: 'VerdeBliss — Botanical Skincare India',
    description: 'Premium botanical skincare. INCI-first formulas for every skin type.',
    images: [
      { url: '/og/home.jpg', width: 1200, height: 630, alt: 'VerdeBliss botanical skincare' },
    ],
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

export default async function RootLayout({ children }: { children: ReactNode }) {
  const navProducts = await getProductsServer()

  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`} data-scroll-behavior="smooth">
      <head>
        {/* Preconnect / DNS-prefetch for the payment iframe so first-checkout RTT is minimal */}
        <link rel="preconnect" href="https://checkout.razorpay.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://checkout.razorpay.com" />
        {/* JSON-LD with nonce — see proxy.ts + lib/structured-data.tsx */}
        <StructuredData data={organizationJsonLd()} />
        <StructuredData data={websiteJsonLd()} />
      </head>
      <body>
        {/* Skip-to-content (WCAG 2.4.1) */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {/* Initialize auth on client */}
        <AuthInitializer />
        <MotionProvider>
          <Nav products={navProducts} />
          <main id="main-content">{children}</main>
          <Footer />
          <CartDrawerLoader />
          <ChatBotLoader />
          <VercelInsightsLoader />
          <Toaster />
          <CookieConsent />
        </MotionProvider>
      </body>
    </html>
  )
}
