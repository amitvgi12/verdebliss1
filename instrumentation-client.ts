/**
 * Browser instrumentation hook — runs once in the client bundle.
 *
 * Sentry browser SDK is initialised here when NEXT_PUBLIC_SENTRY_DSN is set.
 * Dynamic import avoids including the SDK in the initial JS bundle for users
 * without Sentry configured. Falls back silently when not installed.
 *
 * To enable Sentry: npm install @sentry/nextjs, then set NEXT_PUBLIC_SENTRY_DSN.
 */

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
if (dsn) {
  import('@sentry/nextjs')
    .then((Sentry) => {
      Sentry.init({
        dsn,
        environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? 'production',
        tracesSampleRate: 0.05,
        integrations: [],
      })
    })
    .catch(() => {
      // @sentry/nextjs not installed — browser error reporting uses console only.
    })
}

export {}
