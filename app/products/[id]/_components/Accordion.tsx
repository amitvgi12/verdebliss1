'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface AccordionProps {
  id: string
  label: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}

export default function Accordion({ id, label, open, onToggle, children }: AccordionProps) {
  return (
    <div className="border-b border-border">
      <button
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`accordion-${id}`}
        className="flex w-full cursor-pointer items-center justify-between border-none bg-transparent py-4 text-left font-inherit"
      >
        <span className="text-sm font-semibold text-text">{label}</span>
        <motion.span
          animate={{ scale: open ? 1.04 : 1 }}
          transition={{ duration: 0.18 }}
          aria-hidden
          className="block text-[22px] leading-none text-muted"
        >
          {open ? '−' : '+'}
        </motion.span>
      </button>
      {/* Content stays mounted so crawlers and SSR see all accordion text.
          Height + opacity are driven by Framer Motion; overflow-hidden clips it. */}
      <motion.div
        id={`accordion-${id}`}
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className="overflow-hidden"
        aria-hidden={!open}
      >
        <div className="pb-4 text-[13px] leading-relaxed text-muted">{children}</div>
      </motion.div>
    </div>
  )
}
