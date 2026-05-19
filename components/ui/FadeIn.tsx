'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

interface FadeInProps {
  children: ReactNode
  delay?: number
  direction?: 'up' | 'left' | 'none'
  className?: string
}

export default function FadeIn({ children, delay = 0, direction = 'up', className }: FadeInProps) {
  const shouldReduce = useReducedMotion()

  // When the user prefers reduced motion, skip the whileInView pattern entirely.
  // motion.div with whileInView starts at opacity:0 and only snaps visible on
  // scroll entry — still jarring for vestibular disorders even with skipAnimations.
  if (shouldReduce) {
    return <div className={className}>{children}</div>
  }

  const y = direction === 'up' ? 24 : 0
  const x = direction === 'left' ? -24 : 0

  return (
    <motion.div
      initial={{ opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: '-48px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
