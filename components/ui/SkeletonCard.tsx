export default function SkeletonCard() {
  return (
    <div
      role="status"
      aria-label="Loading product"
      className="flex animate-pulse flex-col overflow-hidden rounded-2xl border border-border bg-card"
    >
      <div className="aspect-square bg-ivory" />
      <div className="flex flex-col gap-2 p-3.5">
        <div className="h-3 w-16 rounded bg-border" />
        <div className="h-4 w-full rounded bg-border" />
        <div className="h-4 w-2/3 rounded bg-border" />
      </div>
    </div>
  )
}
