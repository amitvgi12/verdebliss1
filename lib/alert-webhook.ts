/**
 * Dependency-free error reporter: forwards `reportError` / `reportException`
 * signals to OPS_ALERT_WEBHOOK_URL (the same endpoint the reconciliation cron
 * alerts to), so a production failure reaches a human without the Sentry SDK —
 * which this app removed because it destabilised Next build tracing (see
 * scripts/cleanup-legacy-sentry.mjs).
 *
 * Each alert answers: what failed, when, which release/environment, and the
 * structured context the call site attached (order / payment ids). Emails and
 * phone numbers are scrubbed before sending. The same event is sent at most
 * once per THROTTLE_MS per warm instance, with a count of what was suppressed,
 * so an error loop cannot flood the channel.
 */
import { after } from 'next/server'
import type { ErrorContext, ErrorReporter } from '@/lib/observability'

const THROTTLE_MS = 5 * 60 * 1000
const MAX_FIELD_CHARS = 1500

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
// 10-digit Indian mobiles with optional +91/0 prefix and separators.
const PHONE_RE = /(?:\+?91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}\b/g

export function scrubPii(value: string): string {
  return value.replace(EMAIL_RE, '[email]').replace(PHONE_RE, '[phone]')
}

function serialise(value: unknown): string {
  try {
    return scrubPii(JSON.stringify(value)).slice(0, MAX_FIELD_CHARS)
  } catch {
    return '{}'
  }
}

type Send = (url: string, init: RequestInit) => Promise<unknown>

export function createWebhookReporter(
  url: string,
  options: { send?: Send; now?: () => number } = {}
): ErrorReporter {
  const send: Send = options.send ?? ((target, init) => fetch(target, init))
  const now = options.now ?? Date.now
  const lastSent = new Map<string, number>()
  const suppressed = new Map<string, number>()

  const release = (process.env.VERCEL_GIT_COMMIT_SHA ?? 'unknown').slice(0, 12)
  const environment = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown'

  function deliver(level: 'alert' | 'exception', event: string, context: ErrorContext) {
    const key = `${level}:${event}`
    const at = now()
    const previous = lastSent.get(key)
    if (previous !== undefined && at - previous < THROTTLE_MS) {
      suppressed.set(key, (suppressed.get(key) ?? 0) + 1)
      return
    }
    const repeats = suppressed.get(key) ?? 0
    lastSent.set(key, at)
    suppressed.delete(key)

    const summary = scrubPii(event).slice(0, 300)
    const text = `[${environment}] ${level === 'alert' ? '🚨' : '💥'} ${summary} · release ${release}${
      repeats ? ` · +${repeats} suppressed` : ''
    }`
    const body = JSON.stringify({
      // `text` renders in Slack, `content` in Discord; generic receivers read the rest.
      text,
      content: text,
      event: summary,
      level,
      environment,
      release,
      timestamp: new Date(at).toISOString(),
      suppressedSinceLast: repeats,
      context: serialise(context),
    })

    // Never let alert delivery throw into, or block, the failing request.
    const task = () =>
      Promise.resolve()
        .then(() =>
          send(url, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body,
            signal: AbortSignal.timeout(5000),
          })
        )
        .catch(() => {
          console.warn('[alert-webhook] delivery failed')
        })

    // Inside a request, after() keeps the function alive until delivery
    // finishes; outside one (startup, tests) it throws, so send directly.
    try {
      after(task)
    } catch {
      void task()
    }
  }

  return {
    captureMessage: (message, context = {}) => deliver('alert', message, context),
    captureException: (error, context = {}) =>
      deliver('exception', error instanceof Error ? error.message : String(error), {
        ...context,
        stack: error instanceof Error ? (error.stack ?? null) : null,
      }),
  }
}
