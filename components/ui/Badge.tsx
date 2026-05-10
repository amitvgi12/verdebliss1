const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  Vegan: { bg: '#EBF0E9', color: '#1E5C28' },
  'Cruelty-Free': { bg: '#F6EDE8', color: '#7A2A0A' },
  'Organic Certified': { bg: '#FFF5E4', color: '#664A08' },
}

interface BadgeProps {
  label: string
}

export default function Badge({ label }: BadgeProps) {
  const s = BADGE_STYLES[label] ?? { bg: '#F2EAE0', color: '#5C7A52' }
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider"
      style={{ background: s.bg, color: s.color }}
    >
      {label.toUpperCase()}
    </span>
  )
}
