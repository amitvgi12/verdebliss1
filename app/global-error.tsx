'use client'

/**
 * Global error boundary (Next.js App Router convention).
 *
 * Triggered for unhandled errors anywhere in the React tree. We surface a
 * neutral fallback to the user and ship the exception to our observability
 * helper — replace `reportException` with Sentry once `SENTRY_DSN` is set.
 */
import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Stable signature so log-based alerts can match.
    console.error('[EXCEPTION] global_error', error?.message, {
      digest: error?.digest,
      stack: error?.stack,
    })
  }, [error])

  return (
    <html lang="en">
      <body className="bg-bg text-text">
        <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
          <h2 className="mb-3 font-serif text-2xl text-text">Something went wrong</h2>
          <p className="mb-6 text-sm text-muted">
            An unexpected error occurred. Our team has been notified — you can try again or head
            back to the home page.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={reset} className="btn-primary">
              Try again
            </button>
            <Link href="/" className="btn-outline">
              Go home
            </Link>
          </div>
          {error?.digest && (
            <p className="mt-6 text-[11px] text-light">Reference: {error.digest}</p>
          )}
        </div>
      </body>
    </html>
  )
}
