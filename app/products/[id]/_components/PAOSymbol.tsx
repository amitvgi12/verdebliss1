/**
 * Period After Opening symbol — required on cosmetic packaging in many
 * markets. Rendered next to the buy box. The "12M" / "6M" inside the open-jar
 * SVG mirrors the printed pictogram on the bottle.
 */
export default function PAOSymbol({ months }: { months: number | string }) {
  return (
    <div className="flex items-center gap-2">
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        aria-label={`Period After Opening: ${months} months`}
        role="img"
      >
        <circle cx="18" cy="18" r="16" fill="none" stroke="var(--color-muted)" strokeWidth="1.5" />
        <text
          x="18"
          y="21"
          textAnchor="middle"
          fontSize="10"
          fill="var(--color-text)"
          fontWeight="600"
        >
          {months}M
        </text>
        <path
          d="M12 7 L12 3 L24 3 L24 7"
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <div>
        <div className="text-[11px] font-semibold text-text">Period After Opening</div>
        <div className="text-[11px] text-muted">Use within {months} months of opening</div>
      </div>
    </div>
  )
}
