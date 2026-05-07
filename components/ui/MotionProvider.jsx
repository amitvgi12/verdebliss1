'use client'
import { MotionConfig, useReducedMotion } from 'framer-motion'

/**
 * CRITICAL FIX 2.1 — WCAG 2.3.3
 * Wraps all Framer Motion animations with MotionConfig so that
 * OS-level prefers-reduced-motion is respected for JS animations,
 * not just the CSS @media block.
 */
export default function MotionProvider({ children }) {
  const shouldReduce = useReducedMotion()
  return <MotionConfig reducedMotion={shouldReduce ? 'always' : 'never'}>{children}</MotionConfig>
}
