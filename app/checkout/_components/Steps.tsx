/**
 * Three-step checkout progress indicator. Pure presentational component.
 */

const STEPS = ['Address', 'Review', 'Payment'] as const

export default function Steps({ current }: { current: number }) {
  return (
    <ol className="mb-8 flex items-center" aria-label="Checkout progress">
      {STEPS.map((label, i) => {
        const isDone = i < current
        const isCurrent = i === current
        const isReached = i <= current
        return (
          <li
            key={label}
            className={`flex items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}
            aria-current={isCurrent ? 'step' : undefined}
          >
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition ${
                  isReached ? 'bg-forest text-white' : 'bg-border text-muted'
                }`}
              >
                {isDone ? '✓' : i + 1}
              </div>
              <span
                className={`whitespace-nowrap text-[10px] transition ${
                  isReached ? 'text-forest' : 'text-muted'
                } ${isCurrent ? 'font-semibold' : 'font-normal'}`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-2 mb-4 h-px flex-1 transition ${isDone ? 'bg-forest' : 'bg-border'}`}
                aria-hidden
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
