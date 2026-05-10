/**
 * Next.js instrumentation entry point. Loaded by Next once per process,
 * before any route handler or page runs. We use it to register Sentry on
 * server (node) and edge runtimes when `SENTRY_DSN` is set.
 *
 * If the DSN is unset, this is a no-op — every callsite still works because
 * `lib/observability.ts` falls back to structured `console` output.
 */
export async function register() {
  if (!process.env.SENTRY_DSN) return

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  } else if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export async function onRequestError(
  err: unknown,
  request: Parameters<typeof import('@sentry/nextjs').captureRequestError>[1],
  context: Parameters<typeof import('@sentry/nextjs').captureRequestError>[2]
) {
  if (!process.env.SENTRY_DSN) return
  const Sentry = await import('@sentry/nextjs')
  Sentry.captureRequestError(err, request, context)
}
