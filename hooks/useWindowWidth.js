/**
 * useWindowWidth.js
 * Reactive window width — used for responsive layout decisions.
 * Debounced at 150ms to avoid excessive re-renders on resize.
 */
import { useState, useEffect } from 'react'

export function useWindowWidth() {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280
  )

  useEffect(() => {
    let timer
    const handler = () => {
      clearTimeout(timer)
      timer = setTimeout(() => setWidth(window.innerWidth), 150)
    }
    window.addEventListener('resize', handler)
    return () => { clearTimeout(timer); window.removeEventListener('resize', handler) }
  }, [])

  return width
}

/* Breakpoint helpers — matches tailwind.config breakpoints */
export const BP = {
  mobile:  375,
  tablet:  768,
  desktop: 1280,
}
