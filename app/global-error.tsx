'use client'

/**
 * Global error boundary (Next.js App Router convention) — owns the entire
 * <html> when triggered. Catches catastrophic errors that escape the layout.
 */
import { useEffect } from 'react'
import Link from 'next/link'
import { reportException } from '@/lib/observability'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    reportException(error, { boundary: 'global', digest: error?.digest })
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
