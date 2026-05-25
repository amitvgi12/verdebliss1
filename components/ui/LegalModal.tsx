'use client'
/**
 * LegalModal — Privacy, Terms, Cookies, Returns & Refund.
 *
 * Focus-trapped, scroll-locked, ESC closes, click-outside closes. WCAG dialog.
 */

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { LEGAL_DOCUMENTS } from '@/constants/legal'

export type LegalModalType = 'privacy' | 'terms' | 'cookie' | 'refund'

const DOCUMENT_BY_MODAL_TYPE = {
  privacy: LEGAL_DOCUMENTS.privacy,
  terms: LEGAL_DOCUMENTS.terms,
  cookie: LEGAL_DOCUMENTS.cookie,
  refund: LEGAL_DOCUMENTS.returns,
} as const satisfies Record<LegalModalType, (typeof LEGAL_DOCUMENTS)[keyof typeof LEGAL_DOCUMENTS]>

interface LegalModalProps {
  type: LegalModalType
  onClose: () => void
}

export default function LegalModal({ type, onClose }: LegalModalProps) {
  const doc = DOCUMENT_BY_MODAL_TYPE[type]
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!doc) return
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => {
      const first = dialogRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      first?.focus()
    })
    return () => {
      document.body.style.overflow = ''
      previouslyFocusedRef.current?.focus?.()
    }
  }, [doc])

  useEffect(() => {
    if (!doc) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key !== 'Tab') return
      const focusable = dialogRef.current
        ? Array.from(
            dialogRef.current.querySelectorAll<HTMLElement>(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
          ).filter((el) => !el.hasAttribute('disabled'))
        : []
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [doc, onClose])

  if (!doc) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[400] flex items-center justify-center bg-text/60 p-4"
      >
        <motion.div
          ref={dialogRef}
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          onClick={(e) => e.stopPropagation()}
          className="flex max-h-[90vh] w-full max-w-[680px] flex-col rounded-[20px] bg-warmWhite shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-modal-title"
        >
          <header className="flex flex-shrink-0 items-center justify-between border-b border-border px-6 py-5">
            <div>
              <h2 id="legal-modal-title" className="m-0 font-serif text-2xl font-normal text-text">
                {doc.title}
              </h2>
              <p className="mt-1 text-xs text-muted">Last updated: {doc.updated}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-[34px] w-[34px] flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-transparent"
            >
              <X size={15} className="text-muted" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {doc.sections.map((s) => (
              <section key={s.heading} className="mb-6">
                <h3 className="mb-2 font-serif text-sm font-semibold text-text">{s.heading}</h3>
                {s.body.split('\n\n').map((para, i) => (
                  <p
                    key={i}
                    className="mb-2 whitespace-pre-wrap text-[13px] leading-relaxed text-muted"
                  >
                    {para}
                  </p>
                ))}
              </section>
            ))}
          </div>

          <footer className="flex flex-shrink-0 justify-end border-t border-border px-6 py-3.5">
            <button type="button" onClick={onClose} className="btn-primary px-6 py-2.5">
              I understand
            </button>
          </footer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
