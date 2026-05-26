'use client'
import { ExternalLink, Package, Truck, MapPin, CheckCircle, Clock } from 'lucide-react'
import { C, FONT } from '@/constants/theme'

export interface TrackingInfo {
  status: string
  tracking_id?: string | null
  courier_partner?: string | null
  tracking_url?: string | null
  estimated_delivery?: string | null
  created_at: string
  shipped_at?: string | null
  out_for_delivery_at?: string | null
  delivered_at?: string | null
}

type Stage = {
  key: string
  label: string
  sublabel?: string
  icon: React.ReactNode
}

const STAGES: Stage[] = [
  { key: 'placed', label: 'Order Placed', icon: <Clock size={16} /> },
  { key: 'confirmed', label: 'Order Confirmed', icon: <Package size={16} /> },
  { key: 'shipped', label: 'Shipped', icon: <Truck size={16} /> },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: <MapPin size={16} /> },
  { key: 'delivered', label: 'Delivered', icon: <CheckCircle size={16} /> },
]

function getActiveStageIndex(status: string): number {
  switch (status) {
    case 'Delivered':
      return 4
    case 'Out for Delivery':
      return 3
    case 'Shipped':
      return 2
    case 'Processing':
    case 'COD Pending':
      return 1
    default:
      return 0
  }
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatEstimated(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  })
}

function stageTimestamp(stageKey: string, info: TrackingInfo): string {
  switch (stageKey) {
    case 'placed':
      return formatDate(info.created_at)
    case 'confirmed':
      return formatDate(info.created_at)
    case 'shipped':
      return formatDate(info.shipped_at)
    case 'out_for_delivery':
      return formatDate(info.out_for_delivery_at)
    case 'delivered':
      return formatDate(info.delivered_at)
    default:
      return ''
  }
}

export default function DeliveryTracker({ info }: { info: TrackingInfo }) {
  const activeIdx = getActiveStageIndex(info.status)
  const isCancelled = ['Cancelled', 'Refunded', 'Cancellation Requested'].includes(info.status)

  if (isCancelled) return null

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: 24,
        marginBottom: 20,
        fontFamily: FONT.sans,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Truck size={16} color={C.sage} />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Delivery Tracking</span>
        </div>
        {info.estimated_delivery && activeIdx < 4 && (
          <span
            style={{
              fontSize: 12,
              color: C.goldText,
              background: C.goldPale,
              padding: '4px 10px',
              borderRadius: 99,
              fontWeight: 600,
            }}
          >
            Expected by {formatEstimated(info.estimated_delivery)}
          </span>
        )}
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative' }}>
        {STAGES.map((stage, idx) => {
          const isCompleted = idx <= activeIdx
          const isActive = idx === activeIdx
          const timestamp = stageTimestamp(stage.key, info)

          return (
            <div
              key={stage.key}
              style={{
                display: 'flex',
                gap: 14,
                position: 'relative',
                paddingBottom: idx < STAGES.length - 1 ? 20 : 0,
              }}
            >
              {/* Connector line */}
              {idx < STAGES.length - 1 && (
                <div
                  style={{
                    position: 'absolute',
                    left: 15,
                    top: 32,
                    width: 2,
                    height: 'calc(100% - 12px)',
                    background: idx < activeIdx ? C.sage : C.border,
                    borderRadius: 2,
                  }}
                />
              )}

              {/* Circle */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isCompleted ? (isActive ? C.forest : C.sage) : C.ivory,
                  border: isActive
                    ? `2px solid ${C.forest}`
                    : `2px solid ${isCompleted ? C.sage : C.border}`,
                  color: isCompleted ? '#fff' : C.light,
                  zIndex: 1,
                  transition: 'all 0.2s',
                }}
              >
                {stage.icon}
              </div>

              {/* Label */}
              <div style={{ paddingTop: 4 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: isActive ? 700 : isCompleted ? 600 : 400,
                    color: isCompleted ? C.text : C.light,
                  }}
                >
                  {stage.label}
                </div>
                {timestamp && (
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{timestamp}</div>
                )}
                {!timestamp && !isCompleted && (
                  <div style={{ fontSize: 11, color: C.light, marginTop: 2 }}>Pending</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Courier info + track button */}
      {info.tracking_id && (
        <div
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div>
            {info.courier_partner && (
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 2 }}>
                Courier:{' '}
                <span style={{ fontWeight: 600, color: C.text }}>{info.courier_partner}</span>
              </div>
            )}
            <div style={{ fontSize: 12, color: C.muted }}>
              AWB:{' '}
              <span style={{ fontWeight: 600, color: C.text, letterSpacing: '0.04em' }}>
                {info.tracking_id}
              </span>
            </div>
          </div>

          {info.tracking_url && (
            <a
              href={info.tracking_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: C.forest,
                color: '#fff',
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Track on {info.courier_partner ?? 'Courier'} <ExternalLink size={12} />
            </a>
          )}
        </div>
      )}
    </div>
  )
}
