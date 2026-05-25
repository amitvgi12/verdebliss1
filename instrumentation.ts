/**
 * Next.js instrumentation hook — runs once per worker at cold start.
 *
 * Server-side Sentry is initialised here when SENTRY_DSN is set.
 * The dynamic import keeps @sentry/nextjs out of the static module graph so
 * Next's page-data tracer does not pull optional OpenTelemetry deps into every
 * page bundle. If the package is not installed the catch block falls back to
 * stdout-only observability — no downtime, no crash.
 *
 * To enable Sentry: npm install @sentry/nextjs, then set SENTRY_DSN.
 */
import { validateStartupEnv } from '@/lib/runtime-env'

export async function register() {
  validateStartupEnv()

  const dsn = process.env.SENTRY_DSN
  if (!dsn) return

  try {
    const [Sentry, { setErrorReporter }] = await Promise.all([
      import('@sentry/nextjs'),
      import('@/lib/observability'),
    ])

    Sentry.init({
      dsn,
      environment: process.env.SENTRY_ENVIRONMENT ?? 'production',
      // Low sample rate: structured log events already carry full context.
      // Raise once Sentry dashboards are baselined.
      tracesSampleRate: 0.05,
      // No auto-instrumentation integrations: avoids pulling OpenTelemetry
      // modules into the Next.js edge build which caused worker-exit instability
      // in earlier scaffolding attempts.
      integrations: [],
    })

    setErrorReporter({
      captureException: (err, ctx) => void Sentry.captureException(err, { extra: ctx }),
      captureMessage: (msg, ctx) => void Sentry.captureMessage(msg, { extra: ctx }),
    })
  } catch {
    // @sentry/nextjs not installed or init failed — stdout fallback stays active.
    console.warn(
      '[observability] Sentry server init skipped — package not installed or DSN invalid'
    )
  }
}

export async function onRequestError(err: unknown) {
  // Route through reportException so the registered reporter (Sentry) also
  // receives the error, not just the raw console.error path.
  const { reportException } = await import('@/lib/observability')
  reportException(err, { source: 'next_request_error' })
}
