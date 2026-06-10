'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, X } from 'lucide-react'
import LegalModal, { type LegalModalType } from '@/components/ui/LegalModal'
import { COOKIE_PREFERENCES_EVENT, loadStoredConsent, persistConsent } from '@/lib/consent'

interface CookieConsentProps {
  initialOpen?: boolean
}

interface Category {
  id: string
  title: string
  description: string
  locked?: boolean
}

const CATEGORIES: Category[] = [
  {
    id: 'essential',
    title: 'Essential',
    description:
      'Required for core site functionality — cart, login, checkout, and security. Cannot be disabled.',
    locked: true,
  },
  {
    id: 'analytics',
    title: 'Site measurement',
    description:
      'Vercel Web Analytics and Speed Insights provide anonymised page-view and performance metrics without cookies, cross-site tracking, or advertising profiles.',
    locked: true,
  },
  {
    id: 'marketing',
    title: 'Marketing',
    description: 'Personalised offers and product recommendations based on your browsing.',
  },
  {
    id: 'ai',
    title: 'AI support (Google Gemini)',
    description:
      'Allows Verde to send chat messages and, for signed-in order questions, limited account and order context to Google Gemini.',
  },
]

export default function CookieConsent({ initialOpen = false }: CookieConsentProps) {
  const [visible, setVisible] = useState(initialOpen)
  const [marketing, setMarketing] = useState(false)
  const [functionalThirdParty, setFunctionalThirdParty] = useState(false)
  const [openCategory, setOpenCategory] = useState<string | null>(null)
  const [modal, setModal] = useState<LegalModalType | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  const restoreFocus = useCallback(() => {
    window.setTimeout(() => previouslyFocusedRef.current?.focus?.(), 0)
  }, [])

  const syncFromStored = useCallback(() => {
    const stored = loadStoredConsent()
    setMarketing(stored?.marketing ?? false)
    setFunctionalThirdParty(stored?.functional_third_party ?? false)
  }, [])

  const openPreferences = useCallback(() => {
    syncFromStored()
    setVisible(true)
  }, [syncFromStored])

  const acceptAll = () => {
    persistConsent({ analytics: false, marketing: true, functional_third_party: true })
    setVisible(false)
    restoreFocus()
  }

  const acceptSelected = () => {
    persistConsent({ analytics: false, marketing, functional_third_party: functionalThirdParty })
    setVisible(false)
    restoreFocus()
  }

  const decline = () => {
    persistConsent({ analytics: false, marketing: false, functional_third_party: false })
    setVisible(false)
    restoreFocus()
  }

  useEffect(() => {
    if (initialOpen) {
      openPreferences()
      return
    }
    if (loadStoredConsent()) return
    const t = setTimeout(() => setVisible(true), 1200)
    return () => clearTimeout(t)
  }, [initialOpen, openPreferences])

  useEffect(() => {
    window.addEventListener(COOKIE_PREFERENCES_EVENT, openPreferences)
    return () => window.removeEventListener(COOKIE_PREFERENCES_EVENT, openPreferences)
  }, [openPreferences])

  useEffect(() => {
    if (!visible) return

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => {
      const first = getFocusableElements(dialogRef.current)[0]
      first?.focus()
    })

    return () => {
      document.body.style.overflow = ''
      previouslyFocusedRef.current?.focus?.()
    }
  }, [visible])

  useEffect(() => {
    if (!visible) return
    const handler = (e: KeyboardEvent) => {
      if (modal) return
      if (e.key === 'Escape') {
        persistConsent({ analytics: false, marketing: false, functional_third_party: false })
        setVisible(false)
        restoreFocus()
      }
      if (e.key !== 'Tab') return

      const focusable = getFocusableElements(dialogRef.current)
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
  }, [visible, modal, restoreFocus])

  const toggleValue = (id: string) => {
    if (id === 'marketing') setMarketing((v) => !v)
    if (id === 'ai') setFunctionalThirdParty((v) => !v)
  }

  const getValue = (id: string) => {
    if (id === 'marketing') return marketing
    if (id === 'ai') return functionalThirdParty
    return true
  }

  return (
    <>
      {modal && <LegalModal type={modal} onClose={() => setModal(null)} />}
      <AnimatePresence>
        {visible && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[290] bg-black/40 backdrop-blur-[2px]"
              onClick={decline}
            />

            {/* Modal — bottom sheet on mobile so the hero / product imagery
                stays visible behind it; centred card from sm: up. */}
            <div className="pointer-events-none fixed inset-0 z-[300] flex items-end justify-center sm:items-center sm:px-4 sm:py-6">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="cookie-preferences-title"
                aria-describedby="cookie-preferences-description"
                tabIndex={-1}
                className="pointer-events-auto flex max-h-[min(62vh,680px)] w-full max-w-full flex-col overflow-hidden rounded-t-2xl border border-[#E2D6C8] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)] focus:outline-none sm:max-h-[min(88vh,680px)] sm:max-w-[480px] sm:rounded-2xl"
              >
                {/* Header */}
                <div className="relative flex flex-shrink-0 items-start gap-3 border-b border-[#EDE5DA] px-6 pb-4 pt-5">
                  <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-2xl bg-[linear-gradient(90deg,#C8A464,#7D9B76,#2D4A32)]" />
                  <button
                    type="button"
                    onClick={decline}
                    aria-label="Reject optional and close"
                    className="order-2 -mr-1 mt-0.5 flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border border-transparent bg-[#F5F0EA] text-[#888] transition hover:border-[#D8CDBF] hover:bg-[#EDE5DA] hover:text-[#333]"
                  >
                    <X size={15} />
                  </button>
                  <div className="order-1 min-w-0 flex-1">
                    <h2
                      id="cookie-preferences-title"
                      className="font-serif text-[22px] font-semibold leading-tight text-[#1C1C1C]"
                    >
                      Privacy Overview
                    </h2>
                    <p
                      id="cookie-preferences-description"
                      className="mt-1.5 text-[13px] leading-[1.6] text-[#666]"
                    >
                      This site uses cookies and similar technologies to improve your experience.{' '}
                      <button
                        type="button"
                        onClick={() => setModal('cookie')}
                        className="border-none bg-transparent p-0 text-[#2D4A32] underline decoration-[#2D4A32]/30 underline-offset-2 transition hover:decoration-[#2D4A32]"
                      >
                        Cookie policy
                      </button>
                    </p>
                  </div>
                </div>

                {/* Category list */}
                <div className="flex-1 overflow-y-auto">
                  {CATEGORIES.map((cat) => {
                    const isOpen = openCategory === cat.id
                    const value = getValue(cat.id)

                    return (
                      <div key={cat.id} className="border-b border-[#F0EAE0] last:border-b-0">
                        <div className="flex w-full items-center gap-3 px-6 transition hover:bg-[#FAFAF8]">
                          <span id={`cookie-category-${cat.id}-description`} className="sr-only">
                            {cat.description}
                          </span>
                          {/* Row padding lives on the button so the expand
                              control is a ≥44px touch target (WCAG 2.5.8). */}
                          <button
                            type="button"
                            onClick={() => setOpenCategory(isOpen ? null : cat.id)}
                            aria-expanded={isOpen}
                            aria-controls={`cookie-category-${cat.id}`}
                            className="flex min-h-[44px] min-w-0 flex-1 cursor-pointer items-center gap-3 border-none bg-transparent py-3.5 pl-0 pr-0 text-left"
                          >
                            <ChevronRight
                              size={15}
                              aria-hidden="true"
                              className={`flex-shrink-0 text-[#999] transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                            />
                            <span className="flex-1 text-[14px] font-semibold text-[#1C1C1C]">
                              {cat.title}
                            </span>
                          </button>
                          {cat.locked ? (
                            <span className="flex-shrink-0 rounded-full border border-[#2D4A32]/20 bg-[#EEF4EC] px-2.5 py-0.5 text-[11px] font-semibold text-[#2D4A32]">
                              Always on
                            </span>
                          ) : (
                            <label className="relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer items-center">
                              <input
                                type="checkbox"
                                role="switch"
                                checked={value}
                                onChange={() => toggleValue(cat.id)}
                                aria-label={`${cat.title} preference`}
                                aria-describedby={`cookie-category-${cat.id}-description`}
                                className="peer sr-only"
                              />
                              <span
                                aria-hidden="true"
                                className="absolute inset-0 rounded-full bg-[#CCC] transition-colors duration-200 peer-checked:bg-[#2D4A32] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#2D4A32]"
                              />
                              <span
                                aria-hidden="true"
                                className="absolute left-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-5"
                              />
                            </label>
                          )}
                        </div>

                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              id={`cookie-category-${cat.id}`}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <p className="px-6 pb-4 pt-0 text-[12.5px] leading-[1.65] text-[#666]">
                                {cat.description}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>

                {/* Footer buttons */}
                <div className="flex-shrink-0 border-t border-[#EDE5DA] bg-[#FAFAF8] px-6 py-4">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={decline}
                      className="h-10 cursor-pointer rounded-lg border border-[#D8CDBF] bg-white text-[13px] font-semibold text-[#666] transition hover:border-[#999] hover:text-[#333] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2D4A32]"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={acceptSelected}
                      className="h-10 cursor-pointer rounded-lg border border-[#2D4A32]/30 bg-[#EEF4EC] text-[13px] font-semibold text-[#2D4A32] transition hover:border-[#2D4A32] hover:bg-[#DDE9DA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2D4A32]"
                    >
                      Save & accept
                    </button>
                    <button
                      type="button"
                      onClick={acceptAll}
                      className="h-10 cursor-pointer rounded-lg bg-[#2D4A32] text-[13px] font-semibold text-white transition hover:bg-[#203927] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2D4A32]"
                    >
                      Accept all
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function getFocusableElements(root: HTMLElement | null): HTMLElement[] {
  if (!root) return []
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true')
}
