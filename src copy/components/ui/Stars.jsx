import { C } from '@/constants/theme'

export default function Stars({ rating, size = 12 }) {
  return (
    <span style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 12 12" fill={i <= Math.round(rating) ? C.gold : '#E4DAD0'}>
          <polygon points="6,1 7.5,4.5 11.5,5 8.5,7.5 9.5,11 6,9 2.5,11 3.5,7.5 0.5,5 4.5,4.5" />
        </svg>
      ))}
    </span>
  )
}
