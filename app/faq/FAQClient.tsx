'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { C, FONT } from '@/constants/theme'

interface FAQItem {
  q: string
  a: string
}

export default function FAQClient({ items }: { items: FAQItem[] }) {
  const [open, setOpen] = useState(0)

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      <div
        style={{ background: C.forest, padding: 'clamp(40px,5vw,64px) 16px clamp(40px,5vw,56px)' }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div
            style={{
              fontSize: 10,
              color: C.sage,
              letterSpacing: '0.16em',
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            HELP CENTRE
          </div>
          <h1
            style={{
              fontFamily: FONT.serif,
              fontSize: 'clamp(2rem, 3.5vw, 3rem)',
              color: 'white',
              fontWeight: 400,
              margin: '0 0 12px',
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
            }}
          >
            Frequently Asked Questions
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, lineHeight: 1.7 }}>
            Can&apos;t find what you&apos;re looking for? Email us at hello@verdebliss.com
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 16px 64px' }}>
        {items.map((item: FAQItem, i: number) => {
          const isOpen = open === i
          return (
            <div key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                aria-controls={`faq-${i}`}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  padding: '20px 0',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{item.q}</span>
                <motion.span
                  animate={{ rotate: isOpen ? 45 : 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ flexShrink: 0 }}
                >
                  <Plus size={20} color={C.muted} />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={`faq-${i}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <p
                      style={{ fontSize: 14, color: C.muted, lineHeight: 1.8, padding: '0 0 24px' }}
                    >
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}
