/**
 * Lightweight observability shim.
 *
 * These helpers intentionally stay dependency-free so Next's build tracer
 * does not pull optional observability packages into page-data collection.
 * Production deployments should route stdout/stderr to the platform log drain
 * and alert on the stable `[ALERT]`, `[EXCEPTION]`, and `[METRIC]` prefixes.
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
