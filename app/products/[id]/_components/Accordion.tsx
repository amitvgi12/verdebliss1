'use client'

import { motion, AnimatePresence } from 'framer-motion'
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
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key={id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div id={`accordion-${id}`} className="pb-4 text-[13px] leading-relaxed text-muted">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
