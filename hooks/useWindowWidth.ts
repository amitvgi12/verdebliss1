'use client'
import { useEffect, useState } from 'react'

export const BP = { mobile: 480, tablet: 768, desktop: 1024 } as const

export function useWindowWidth(): number {
  const [width, setWidth] = useState(1200)
  useEffect(() => {
    const update = () => setWidth(window.innerWidth)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return width
}
