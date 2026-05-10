/**
 * Sentry server runtime — loaded only when `SENTRY_DSN` is set (see
 * instrumentation.ts). Uses defaults that suit a low-volume D2C MVP.
 *
 * Tweakables:
 *  - `tracesSampleRate`: bump for staging perf profiling.
 *  - `profilesSampleRate`: requires the profiling integration package; set
 *    `SENTRY_PROFILING=1` if you opt in.
 *  - `beforeSend`: scrubs sensitive payment data before transport.
 */
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.VERCEL_ENV ?? 'development',
  release: process.env.VERCEL_GIT_COMMIT_SHA ?? undefined,

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  // Limit breadcrumbs so payment-related logs do not flood Sentry events.
  maxBreadcrumbs: 50,
  attachStacktrace: true,

  // Razorpay & Supabase SDKs make a lot of low-signal calls. Filter them out.
  ignoreErrors: [
    /AbortError/i,
    /NEXT_REDIRECT/,
    'TypeError: Failed to fetch',
    'TypeError: NetworkError when attempting to fetch resource',
  ],

  beforeSend(event) {
    // Strip Authorization headers and Razorpay payment payloads. These should
    // never reach a third-party telemetry vendor.
    if (event.request?.headers) {
      delete event.request.headers['authorization']
      delete event.request.headers['Authorization']
      delete event.request.headers['cookie']
      delete event.request.headers['Cookie']
    }
    if (event.request?.data && typeof event.request.data === 'object') {
      const data = event.request.data as Record<string, unknown>
      for (const k of [
        'razorpay_payment_id',
        'razorpay_signature',
        'razorpay_order_id',
        'card',
        'cvv',
        'password',
        'access_token',
      ]) {
        if (k in data) data[k] = '[redacted]'
      }
    }
    return event
  },
})
