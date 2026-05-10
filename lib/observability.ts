/**
 * Observability shim.
 *
 * Calling sites use `reportError`, `reportException`, `reportMetric`. Behaviour:
 *   - If `SENTRY_DSN` is set, events are forwarded to Sentry SDK.
 *   - Always also emit a structured console line so log-based alert rules
 *     (Vercel log drains, Datadog, Logflare) keep working as a fallback.
 *
 * The Sentry SDK is dynamically loaded inside the helpers so unit tests and
 * dev environments without `SENTRY_DSN` do not pay the cost of importing it.
 */

export type ErrorContext = Record<string, unknown>

const SENTRY_ENABLED = Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)

let sentryModule: typeof import('@sentry/nextjs') | null = null
let sentryLoadAttempted = false

async function getSentry() {
  if (!SENTRY_ENABLED) return null
  if (sentryModule) return sentryModule
  if (sentryLoadAttempted) return null
  sentryLoadAttempted = true
  try {
    sentryModule = await import('@sentry/nextjs')
    return sentryModule
  } catch {
    return null
  }
}

function logSignal(level: 'error' | 'log', signature: string, payload: ErrorContext) {
  // Stable, machine-parseable signature — `[ALERT] <event_name> {...}`.
  // Existing log-based alerts that match on these prefixes continue to fire
  // even without Sentry.
  const fn = level === 'error' ? console.error : console.log
  try {
    fn(signature, JSON.stringify(payload))
  } catch {
    fn(signature, '{}')
  }
}

export function reportError(eventName: string, context: ErrorContext = {}): void {
  logSignal('error', `[ALERT] ${eventName}`, context)
  void getSentry().then((Sentry) => {
    if (!Sentry) return
    Sentry.captureMessage(eventName, {
      level: 'error',
      extra: context,
      tags: { observability: 'reportError' },
    })
  })
}

export function reportException(error: unknown, context: ErrorContext = {}): void {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined
  logSignal('error', `[EXCEPTION] ${message}`, { ...context, stack: stack ?? null })
  void getSentry().then((Sentry) => {
    if (!Sentry) return
    if (error instanceof Error) {
      Sentry.captureException(error, { extra: context })
    } else {
      Sentry.captureMessage(message, { level: 'error', extra: context })
    }
  })
}

export function reportMetric(name: string, value: number, context: ErrorContext = {}): void {
  logSignal('log', `[METRIC] ${name}=${value}`, context)
  // Sentry's metrics API was deprecated; use spans/measurements via
  // `setMeasurement` from within a transaction if you need them. Most
  // operational metrics are better served by Vercel Analytics or PostHog.
}

export function isSentryEnabled(): boolean {
  return SENTRY_ENABLED
}
