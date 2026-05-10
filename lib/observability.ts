/**
 * Lightweight observability shim.
 *
 * Sentry is registered through `instrumentation.ts` when `SENTRY_DSN` is set,
 * which captures request/global errors without importing the Sentry SDK into
 * every route module. These helpers intentionally stay dependency-free so
 * Next's build tracer does not pull Prisma/OpenTelemetry optional packages into
 * page-data collection. Log drains can alert on the stable `[ALERT]` and
 * `[EXCEPTION]` prefixes.
 */

export type ErrorContext = Record<string, unknown>

function logSignal(level: 'error' | 'log', signature: string, payload: ErrorContext) {
  const fn = level === 'error' ? console.error : console.log
  try {
    fn(signature, JSON.stringify(payload))
  } catch {
    fn(signature, '{}')
  }
}

export function reportError(eventName: string, context: ErrorContext = {}): void {
  logSignal('error', `[ALERT] ${eventName}`, context)
}

export function reportException(error: unknown, context: ErrorContext = {}): void {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined
  logSignal('error', `[EXCEPTION] ${message}`, { ...context, stack: stack ?? null })
}

export function reportMetric(name: string, value: number, context: ErrorContext = {}): void {
  logSignal('log', `[METRIC] ${name}=${value}`, context)
}

export function isSentryEnabled(): boolean {
  return Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)
}
