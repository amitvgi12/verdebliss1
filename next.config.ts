import type { NextConfig } from 'next'

/**
 * CSP is set in middleware (per-request nonce). Static headers stay here.
 *
 * `unsafe-inline` for scripts has been removed. JSON-LD blocks are emitted via
 * <script nonce={...}> (see app/layout.tsx and lib/seo.tsx). Razorpay's iframe
 * checkout runs at checkout.razorpay.com — its own scripts don't need our CSP
 * nonce because they execute in their own iframe origin.
 */
const nextConfig: NextConfig = {
  // Default Next.js build defaults restored; the previous config's `cpus: 1`
  // and `workerThreads: false` threw away parallelism for no real reason.
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }],
  },
  compress: true,
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
          // introduce vulnerabilities. CSP (set in middleware) replaces it.
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
        source: '/_next/static/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/images/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]
  },
}

export default nextConfig
