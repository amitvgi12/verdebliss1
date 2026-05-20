import type { NextConfig } from 'next'

/**
 * CSP is set in proxy.ts (per-request nonce). Static headers stay here.
 *
 * `unsafe-inline` for scripts has been removed. JSON-LD blocks are emitted via
 * <script nonce={...}> (see app/layout.tsx and lib/seo.tsx). Razorpay's iframe
 * checkout runs at checkout.razorpay.com — its own scripts don't need our CSP
 * nonce because they execute in their own iframe origin.
 */
const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }],
  },
  poweredByHeader: false,
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          // X-XSS-Protection is deprecated and, in older browsers, can
          // introduce vulnerabilities. CSP (set in proxy.ts) replaces it.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: [
              'accelerometer=()',
              'autoplay=()',
              'camera=()',
              'display-capture=()',
              'encrypted-media=()',
              'fullscreen=(self)',
              'geolocation=()',
              'gyroscope=()',
              'magnetometer=()',
              'microphone=()',
              'midi=()',
              'payment=(self "https://checkout.razorpay.com")',
              'picture-in-picture=()',
              'publickey-credentials-get=()',
              'sync-xhr=()',
              'usb=()',
              'xr-spatial-tracking=()',
              'interest-cohort=()',
            ].join(', '),
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/products',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/products/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=86400',
          },
        ],
      },
    ]
  },
}

export default nextConfig
