/**
 * Root loading state — used by Next.js App Router during streaming SSR.
 * Keeps the shell visible while route segments resolve.
 */
export default function Loading() {
  return (
    <div className="container-content py-20" role="status" aria-label="Loading">
      <div className="mb-8 h-8 w-48 animate-pulse rounded-md bg-border" aria-hidden />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-border bg-card"
            aria-hidden
          >
            <div className="aspect-square animate-pulse bg-ivory" />
            <div className="space-y-2 p-3.5">
              <div className="h-3 w-16 animate-pulse rounded bg-border" />
              <div className="h-4 w-full animate-pulse rounded bg-border" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-border" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
