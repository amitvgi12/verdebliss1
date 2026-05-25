/**
 * Lightweight observability shim.
 *
 * Emits stable `[ALERT]`, `[EXCEPTION]`, and `[METRIC]` log-line prefixes that
 * log-drain tooling (Datadog, Logflare, Vercel log filters) can match against.
 *
 * When a structured error reporter is registered via `setErrorReporter` (e.g.
 * Sentry, wired at startup from `instrumentation.ts`), every `reportError` and
 * `reportException` call is forwarded to it in addition to the stdout signal.
 * This dual-path design means log-drain alerting keeps working even if the SDK
 * is not installed or fails to initialise.
 *
 * To enable Sentry: set SENTRY_DSN and install @sentry/nextjs.
 * instrumentation.ts calls `setErrorReporter` at startup when DSN is present.
 */

export type ErrorContext = Record<string, unknown>

export interface ErrorReporter {
  captureException: (error: unknown, context?: ErrorContext) => void
  captureMessage: (message: string, context?: ErrorContext) => void
}

let _reporter: ErrorReporter | null = null

/**
 * Register a structured error reporter (e.g. Sentry). Called once from
 * instrumentation.ts after the SDK is initialised. Safe to call multiple times;
 * later calls replace the previous reporter.
 */
export function setErrorReporter(reporter: ErrorReporter): void {
  _reporter = reporter
}

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
  _reporter?.captureMessage(`[ALERT] ${eventName}`, context)
}

export function reportException(error: unknown, context: ErrorContext = {}): void {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined
  logSignal('error', `[EXCEPTION] ${message}`, { ...context, stack: stack ?? null })
  _reporter?.captureException(error, context)
}

export function reportMetric(name: string, value: number, context: ErrorContext = {}): void {
  logSignal('log', `[METRIC] ${name}=${value}`, context)
  // Metrics are not forwarded to the reporter: Sentry has no native metric
  // capture, and forwarding count/gauge metrics is outside the SDK's scope.
}
