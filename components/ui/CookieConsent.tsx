/**
 * CookieConsent — GDPR/CCPA banner.
 *
 * - Shown on first visit (no localStorage entry).
 * - Granular preferences: essential (always on), analytics, marketing, optional third-party AI.
 * - Stores decision in `vb_cookie_consent` (timestamp, version, prefs).
 * - Accessible: role="dialog", focus on render, ESC dismisses.
 * - CSS-driven responsive (no useWindowWidth → no hydration mismatch).
 */
'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, X, ChevronDown } from 'lucide-react'
import LegalModal, { type LegalModalType } from '@/components/ui/LegalModal'
import { COOKIE_PREFERENCES_EVENT, loadStoredConsent, persistConsent } from '@/lib/consent'

interface CookieConsentProps {
  initialOpen?: boolean
}

export default function CookieConsent({ initialOpen = false }: CookieConsentProps) {
  const [visible, setVisible] = useState(initialOpen)
  const [expanded, setExpanded] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [functionalThirdParty, setFunctionalThirdParty] = useState(false)
  const [modal, setModal] = useState<LegalModalType | null>(null)
  const acceptRef = useRef<HTMLButtonElement | null>(null)

  const syncFromStored = useCallback(() => {
    const stored = loadStoredConsent()
    setAnalytics(stored?.analytics ?? false)
    setMarketing(stored?.marketing ?? false)
    setFunctionalThirdParty(stored?.functional_third_party ?? false)
  }, [])

  const openPreferences = useCallback(() => {
    syncFromStored()
    setExpanded(true)
    setVisible(true)
  }, [syncFromStored])

  const acceptAll = () => {
    persistConsent({ analytics: true, marketing: true, functional_third_party: true })
    setVisible(false)
  }

  const acceptSelected = () => {
    persistConsent({
      analytics,
      marketing,
      functional_third_party: functionalThirdParty,
    })
    setVisible(false)
  }

  const decline = () => {
    persistConsent({ analytics: false, marketing: false, functional_third_party: false })
    setVisible(false)
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
    if (visible) acceptRef.current?.focus()
  }, [visible])

  useEffect(() => {
    if (!visible) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        persistConsent({ analytics: false, marketing: false, functional_third_party: false })
        setVisible(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [visible])

  return (
    <>
      {modal && <LegalModal type={modal} onClose={() => setModal(null)} />}
      <AnimatePresence>
        {visible && (
          <div className="pointer-events-none fixed inset-x-0 bottom-3 z-[300] flex justify-center px-3 sm:bottom-5 sm:px-5">
            <motion.div
              initial={{ y: 28, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 28, opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              role="dialog"
              aria-modal="false"
              aria-label="Cookie preferences"
              className="pointer-events-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-[#E2D6C8] bg-[#FFFCF7] shadow-[0_24px_70px_rgba(28,34,30,0.22)]"
            >
              <div className="relative overflow-hidden border-b border-[#E8DDCF] bg-[linear-gradient(135deg,#FFFDF9_0%,#F3EBE1_100%)] px-5 py-5 sm:px-6">
                <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#C8A464,#7D9B76,#2D4A32)]" />
                <button
                  type="button"
                  onClick={decline}
                  aria-label="Reject optional cookies and services and dismiss"
                  className="absolute right-3 top-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-transparent bg-white/70 text-muted transition hover:border-border hover:bg-white hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
                >
                  <X size={17} />
                </button>

                <div className="flex items-start gap-4 pr-9">
                  <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-white bg-sagePale shadow-sm">
                    <Shield size={24} aria-hidden className="text-forest" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
                      Consent Centre
                    </p>
                    <h2 className="font-serif text-2xl font-semibold leading-none text-text sm:text-3xl">
                      Your privacy matters
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-muted sm:text-[15px]">
                      We use essential cookies to keep the site working. Optional analytics,
                      marketing, and AI support stay off unless you choose them. You&apos;re in
                      control.{' '}
                      <button
                        type="button"
                        onClick={() => setModal('cookie')}
                        className="border-none bg-transparent p-0 font-semibold text-forest underline decoration-forest/35 underline-offset-4 transition hover:decoration-forest"
                      >
                        Read our cookie policy
                      </button>
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-4 sm:p-5">
                <button
                  type="button"
                  onClick={() => setExpanded((s) => !s)}
                  aria-expanded={expanded}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-2xl border border-[#E2D6C8] bg-white px-4 py-3 text-left transition hover:border-forest/35 hover:bg-[#FBF7F0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
                >
                  <span>
                    <span className="block text-sm font-bold text-forest">
                      Customise preferences
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                      Essential stays on. Everything else is your choice.
                    </span>
                  </span>
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sagePale text-forest">
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
                    />
                  </span>
                </button>

                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid gap-2.5 rounded-2xl border border-[#E2D6C8] bg-[#F8F2EA] p-3">
                      <ConsentRow
                        title="Essential"
                        desc="Required for cart, login, and checkout."
                        on
                        locked
                      />
                      <ConsentRow
                        title="Analytics (first-party)"
                        desc="Vercel Web Analytics and Speed Insights for anonymous page and performance metrics."
                        on={analytics}
                        onChange={setAnalytics}
                      />
                      <ConsentRow
                        title="Marketing"
                        desc="Personalised offers and product recommendations."
                        on={marketing}
                        onChange={setMarketing}
                      />
                      <ConsentRow
                        title="AI support (Google Gemini)"
                        desc="Allows Verde to send chat messages and, for signed-in order questions, limited account and order context to Google Gemini."
                        on={functionalThirdParty}
                        onChange={setFunctionalThirdParty}
                      />
                    </div>
                  </motion.div>
                )}

                <div className={`grid gap-3 ${expanded ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                  <button
                    type="button"
                    onClick={decline}
                    className="min-h-12 cursor-pointer rounded-2xl border border-[#D8CDBF] bg-white px-5 py-3 text-sm font-bold text-muted transition hover:border-forest/35 hover:bg-[#FBF7F0] hover:text-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
                  >
                    Reject optional
                  </button>
                  {expanded && (
                    <button
                      type="button"
                      onClick={acceptSelected}
                      className="min-h-12 cursor-pointer rounded-2xl border border-forest bg-sagePale px-5 py-3 text-sm font-bold text-forest transition hover:bg-[#DDE9DA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
                    >
                      Save preferences
                    </button>
                  )}
                  <button
                    ref={acceptRef}
                    type="button"
                    onClick={acceptAll}
                    className="min-h-12 cursor-pointer rounded-2xl border border-forest bg-forest px-5 py-3 text-sm font-bold text-white shadow-[0_14px_26px_rgba(45,74,50,0.22)] transition hover:bg-[#203927] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
                  >
                    Accept all
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

interface ConsentRowProps {
  title: string
  desc: string
  on: boolean
  locked?: boolean
  onChange?: (next: boolean) => void
}

function ConsentRow({ title, desc, on, locked = false, onChange }: ConsentRowProps) {
  const descId = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-desc`

  return (
    <label className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-[#E5DBCF] bg-white px-4 py-3 shadow-sm transition hover:border-forest/25">
      <input
        type="checkbox"
        checked={on}
        disabled={locked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="sr-only"
        aria-describedby={descId}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-text">{title}</span>
        <span id={descId} className="mt-0.5 block text-xs leading-relaxed text-muted">
          {desc}
          {locked && <span className="ml-1 text-forest">(always on)</span>}
        </span>
      </span>
      <span
        aria-hidden
        className={`flex h-7 w-12 flex-shrink-0 items-center rounded-full p-1 transition ${
          on ? 'bg-forest' : 'bg-[#D8CDBF]'
        } ${locked ? 'opacity-75' : ''}`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${
            on ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </span>
    </label>
  )
}
