'use client'

/**
 * Route-level error boundary. Catches errors in pages without taking the
 * shell (Nav, Footer) down with them. Reserves global-error.tsx for the
 * truly catastrophic case where the layout itself crashes.
 */
import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[EXCEPTION] route_error', error?.message, {
      digest: error?.digest,
      stack: error?.stack,
    })
  }, [error])

  return (
    <div className="container-content py-20 text-center">
      <h2 className="mb-3 font-serif text-2xl text-text">Something went wrong here</h2>
      <p className="mb-6 text-sm text-muted">
        We&apos;ve logged the issue. Please try again, or browse our other pages.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/" className="btn-outline">
          Go home
        </Link>
      </div>
      {error?.digest && <p className="mt-6 text-[11px] text-light">Reference: {error.digest}</p>}
    </div>
  )
}
