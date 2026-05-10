/**
 * Sentry browser config. Loaded by `instrumentation-client.ts` (Next 15+).
 *
 * Notes:
 *  - `replaysSessionSampleRate: 0` to avoid the 100KB+ replay bundle hitting
 *    every visitor. Bump for incident replay during specific bugs.
 *  - Razorpay's iframe runs at a separate origin, so its errors won't bubble
 *    here — they appear in Razorpay's own dashboard.
 */
import * as Sentry from '@sentry/nextjs'

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment:
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ??
      process.env.NEXT_PUBLIC_VERCEL_ENV ??
      'development',
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? undefined,

    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.1,

    ignoreErrors: [
      /AbortError/i,
      /ResizeObserver loop limit exceeded/,
      /Non-Error promise rejection captured/,
      // Common content-blocker/extension noise that has nothing to do with us.
      /chrome-extension/,
      /moz-extension/,
    ],
    denyUrls: [/chrome-extension:\/\//, /^moz-extension:\/\//, /^safari-web-extension:\/\//],
  })
}
