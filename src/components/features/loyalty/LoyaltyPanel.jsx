import { motion } from 'framer-motion'
import { Award } from 'lucide-react'
import { TIERS } from '@/constants/products'
import { C, FONT } from '@/constants/theme'

export default function LoyaltyPanel({ profile }) {
  const points   = profile?.points ?? 0
  const tier     = TIERS.find((t) => points >= t.min && points <= t.max) ?? TIERS[0]
  const nextTier = TIERS[TIERS.indexOf(tier) + 1]
  const pct      = nextTier ? Math.round(((points - tier.min) / (nextTier.min - tier.min)) * 100) : 100

  return (
    <div style={{ background: `linear-gradient(140deg, ${C.forest} 0%, #3D6344 100%)`, borderRadius: 16, padding: 28, color: 'white' }}>
      {/* Balance */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.12em', marginBottom: 4 }}>LOYALTY POINTS</div>
          <div style={{ fontSize: 48, fontWeight: 700, fontFamily: FONT.serif, lineHeight: 1 }}>{points.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
            = ₹{Math.floor(points / 100) * 50} redeemable value
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 99, padding: '6px 14px', fontSize: 11, fontWeight: 700, border: '1px solid rgba(255,255,255,0.18)', letterSpacing: '0.04em' }}>
          {tier.emoji} {tier.name}
        </div>
      </div>

      {/* Progress bar */}
      {nextTier && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
            <span>{points} pts</span><span>{nextTier.min} pts</span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.12)', borderRadius: 99, overflow: 'hidden' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2, ease: 'easeOut' }}
              style={{ height: '100%', background: C.gold, borderRadius: 99 }} />
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
            {nextTier.min - points} pts until {nextTier.name}
          </div>
        </div>
      )}

      {/* Earn rates */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, textAlign: 'center' }}>
          {[['50 pts', 'First Purchase'], ['20 pts', 'Per Review'], ['1 pt', 'Per ₹10 Spent']].map(([v, l]) => (
            <div key={l}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.gold }}>{v}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', marginTop: 2, lineHeight: 1.3 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
