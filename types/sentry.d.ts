/**
 * Minimal ambient declaration for @sentry/nextjs.
 *
 * This lets TypeScript compile the dynamic import in instrumentation.ts without
 * requiring the package to be installed. When @sentry/nextjs IS installed, its
 * own type declarations take precedence and this file has no effect.
 *
 * To enable Sentry: npm install @sentry/nextjs, then set SENTRY_DSN.
 */
declare module '@sentry/nextjs' {
  export interface SentryInitOptions {
    dsn: string
    environment?: string
    tracesSampleRate?: number
    integrations?: unknown[]
  }
  export interface SentryContext {
    extra?: Record<string, unknown>
  }
  export function init(options: SentryInitOptions): void
  export function captureException(err: unknown, context?: SentryContext): string
  export function captureMessage(msg: string, context?: SentryContext): string
}
