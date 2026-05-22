import { normalizeProductBadgeLabel } from '@/lib/product-claims'

const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  'Vegan-friendly': { bg: '#EBF0E9', color: '#1E5C28' },
  'Cruelty-free*': { bg: '#F6EDE8', color: '#7A2A0A' },
  'Organic botanicals': { bg: '#FFF5E4', color: '#664A08' },
}

interface BadgeProps {
  label: string
}

export default function Badge({ label }: BadgeProps) {
  const displayLabel = normalizeProductBadgeLabel(label) ?? label
  const s = BADGE_STYLES[displayLabel] ?? { bg: '#F2EAE0', color: '#5C7A52' }
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider"
      style={{ background: s.bg, color: s.color }}
    >
      {displayLabel.toUpperCase()}
    </span>
  )
}
