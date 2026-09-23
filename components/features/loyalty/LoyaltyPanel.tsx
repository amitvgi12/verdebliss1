import { motion } from 'framer-motion'
import { TIERS, type LoyaltyTier } from '@/constants/products'
import { C, FONT } from '@/constants/theme'
import { tierForPoints } from '@/lib/loyalty'
import type { CustomerProfile } from '@/types'

interface LoyaltyPanelProps {
  profile?: CustomerProfile | null
}

export default function LoyaltyPanel({ profile }: LoyaltyPanelProps) {
  const points = profile?.points ?? 0
  const tierName = tierForPoints(points)
  const tier: LoyaltyTier = TIERS.find((t) => t.name === tierName) ?? TIERS[0]!
  const nextTier = TIERS[TIERS.indexOf(tier) + 1]
  const pct = nextTier ? Math.round(((points - tier.min) / (nextTier.min - tier.min)) * 100) : 100

  return (
    <div
      style={{
        background: `linear-gradient(140deg, ${C.forest} 0%, #3D6344 100%)`,
        borderRadius: 16,
        padding: 28,
        color: 'white',
      }}
    >
      {/* Balance */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 20,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.55)',
              letterSpacing: '0.12em',
              marginBottom: 4,
            }}
          >
            LOYALTY POINTS
          </div>
          <div style={{ fontSize: 48, fontWeight: 700, fontFamily: FONT.serif, lineHeight: 1 }}>
            {points.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
            Redemption is not live yet — your balance is saved
          </div>
        </div>
        <div
          style={{
            background: 'rgba(255,255,255,0.12)',
            borderRadius: 99,
            padding: '6px 14px',
            fontSize: 11,
            fontWeight: 700,
            border: '1px solid rgba(255,255,255,0.18)',
            letterSpacing: '0.04em',
          }}
        >
          {tier.emoji} {tier.name}
        </div>
      </div>

      {/* Progress bar */}
      {nextTier && (
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 10,
              color: 'rgba(255,255,255,0.5)',
              marginBottom: 6,
            }}
          >
            <span>{points} pts</span>
            <span>{nextTier.min} pts</span>
          </div>
          <div
            style={{
              height: 6,
              background: 'rgba(255,255,255,0.12)',
              borderRadius: 99,
              overflow: 'hidden',
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              style={{ height: '100%', background: C.gold, borderRadius: 99 }}
            />
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
            {nextTier.min - points} pts until {nextTier.name}
          </div>
        </div>
      )}

      {/* Earn rates */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 10,
            textAlign: 'center',
          }}
        >
          {/* Only rules the server actually applies (lib/loyalty.ts + the
              finalize/lifecycle RPCs). Never list a bonus that isn't credited. */}
          {[
            ['1 pt', 'Per ₹20 of products'],
            ['Prepaid', 'Credited on payment'],
            ['COD', 'Credited on delivery'],
          ].map(([v, l]) => (
            <div key={l}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.gold }}>{v}</div>
              <div
                style={{
                  fontSize: 9,
                  color: 'rgba(255,255,255,0.45)',
                  marginTop: 2,
                  lineHeight: 1.3,
                }}
              >
                {l}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
