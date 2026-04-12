import { C } from '@/constants/theme'

const pulse = {
  background: `linear-gradient(90deg, ${C.ivory} 25%, #ede7de 50%, ${C.ivory} 75%)`,
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.4s infinite',
}

export default function SkeletonCard() {
  return (
    <>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      <div style={{ background: C.card, borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.border}` }}>
        <div style={{ height: 180, ...pulse }} />
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ height: 10, width: '40%', borderRadius: 6, ...pulse }} />
          <div style={{ height: 14, width: '85%', borderRadius: 6, ...pulse }} />
          <div style={{ height: 10, width: '55%', borderRadius: 6, ...pulse }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <div style={{ height: 16, width: '30%', borderRadius: 6, ...pulse }} />
            <div style={{ height: 28, width: '36%', borderRadius: 8, ...pulse }} />
          </div>
        </div>
      </div>
    </>
  )
}
