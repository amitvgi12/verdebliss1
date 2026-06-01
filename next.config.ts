import type { NextConfig } from 'next'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)
const hasSentryPackage = canResolvePackage('@sentry/nextjs')
const sentryStubPath = path.resolve(process.cwd(), 'lib/sentry-stub.ts')
const sentryTurbopackStub = './lib/sentry-stub.ts'

/**
 * CSP is set in proxy.ts (route-aware: per-request nonce on always-dynamic
 * routes, 'unsafe-inline' on static/ISR routes whose cached HTML cannot embed a
 * per-request nonce — see `requiresScriptNonce`). Static headers stay here.
 *
 * JSON-LD is served from same-origin schema endpoints so it is covered by
 * `script-src 'self'`. Razorpay's iframe checkout runs at checkout.razorpay.com
 * — its own scripts don't need our CSP nonce because they execute in their own
 * iframe origin.
 */
const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [320, 420, 640, 750, 828, 1080, 1200, 1600, 1920],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }],
  },
  poweredByHeader: false,
  reactStrictMode: true,
  turbopack: {
    root: process.cwd(),
    ...(hasSentryPackage ? {} : { resolveAlias: { '@sentry/nextjs': sentryTurbopackStub } }),
  },

  webpack(config) {
    if (!hasSentryPackage) {
      config.resolve ??= {}
      config.resolve.alias ??= {}
      config.resolve.alias['@sentry/nextjs'] = sentryStubPath
    }
    return config
  },

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
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
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

function canResolvePackage(pkg: string): boolean {
  try {
    require.resolve(pkg)
    return true
  } catch {
    return false
  }
}
