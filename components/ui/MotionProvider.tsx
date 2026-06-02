'use client'
import { MotionConfig, MotionGlobalConfig, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

// Under browser automation (Playwright / axe), make all Framer Motion animations
// resolve instantly so accessibility and visual checks evaluate settled final
// states. Without this, axe can sample an element mid-fade (opacity ~0) and
// report a false color-contrast violation for content that is fully legible once
// the animation completes. `navigator.webdriver` is only true for automated
// browsers, so real users are unaffected. Runs at module load (before any motion
// component mounts) and is guarded for SSR where `navigator` is undefined.
if (typeof navigator !== 'undefined' && navigator.webdriver) {
  MotionGlobalConfig.skipAnimations = true
}

/**
 * CRITICAL FIX 2.1 — WCAG 2.3.3
 * Wraps all Framer Motion animations with MotionConfig so that
 * OS-level prefers-reduced-motion is respected for JS animations,
 * not just the CSS @media block.
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  const shouldReduce = useReducedMotion()
  return <MotionConfig reducedMotion={shouldReduce ? 'always' : 'never'}>{children}</MotionConfig>
}
