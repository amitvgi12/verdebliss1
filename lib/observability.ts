/**
 * Tiny observability shim.
 *
 * - In dev / when Sentry is not configured, errors and metrics go to console
 *   with a stable prefix (`[ALERT]` / `[METRIC]`) so log-based alert rules
 *   keep working.
 * - When `process.env.SENTRY_DSN` is set, this file should be edited to
 *   `import * as Sentry from '@sentry/nextjs'` and the bodies replaced with
 *   `Sentry.captureMessage` / `Sentry.captureException`. The call sites here
 *   are designed so that's the only diff.
 */

export type ErrorContext = Record<string, unknown>

export function reportError(eventName: string, context: ErrorContext = {}): void {
  // Stable, machine-parseable signature:
  //   [ALERT] <event_name> {"...": "..."}
  console.error(`[ALERT] ${eventName}`, JSON.stringify(context))
}

export function reportException(error: unknown, context: ErrorContext = {}): void {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined
  console.error(`[EXCEPTION] ${message}`, JSON.stringify({ ...context, stack: stack ?? null }))
}

export function reportMetric(name: string, value: number, context: ErrorContext = {}): void {
  console.log(`[METRIC] ${name}=${value}`, JSON.stringify(context))
}
