const BADGE_STYLES = {
  Vegan:              { bg: '#EBF0E9', color: '#1E5C28' },
  'Cruelty-Free':     { bg: '#F6EDE8', color: '#7A2A0A' },
  'Organic Certified':{ bg: '#FFF5E4', color: '#664A08' },
}

export default function Badge({ label }) {
  const s = BADGE_STYLES[label] ?? { bg: '#F2EAE0', color: '#5C7A52' }
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
      background: s.bg, color: s.color, letterSpacing: '0.05em',
    }}>
      {label.toUpperCase()}
    </span>
  )
}
