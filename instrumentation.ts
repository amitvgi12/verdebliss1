/**
 * Next.js instrumentation hook.
 *
 * The previous Sentry SDK import pulled optional OpenTelemetry/Prisma modules
 * into `next build` page-data collection and caused non-deterministic worker
 * exits in this repo. Production observability is handled through structured
 * log events from `lib/observability.ts` plus platform log drains/alerts.
 * Re-introduce a vendor SDK only after verifying `next build` completes cleanly.
 */
import { validateStartupEnv } from '@/lib/runtime-env'

export async function register() {
  validateStartupEnv()
}

export async function onRequestError(err: unknown) {
  console.error('[EXCEPTION] next_request_error', err)
}
