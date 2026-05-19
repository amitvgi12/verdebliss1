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
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 24 }}
            role="dialog"
            aria-modal="false"
            aria-label="Cookie preferences"
            className="fixed bottom-0 left-0 right-0 z-[300] border-t border-border bg-warmWhite p-4 shadow-[0_-10px_30px_rgba(28,34,30,0.12)] sm:bottom-5 sm:left-1/2 sm:right-auto sm:w-[min(calc(100vw-2rem),620px)] sm:-translate-x-1/2 sm:rounded-2xl sm:border sm:p-5"
          >
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-sagePale">
                <Shield size={19} aria-hidden className="text-forest" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="mb-1 font-serif text-[1.15rem] font-semibold leading-tight text-text">
                  Your privacy matters
                </h2>
                <p className="max-w-[490px] text-[13px] leading-relaxed text-muted">
                  We use essential cookies to keep the site working. Optional analytics, marketing,
                  and AI support stay off unless you choose them. You&apos;re in control.{' '}
                  <button
                    type="button"
                    onClick={() => setModal('cookie')}
                    className="border-none bg-transparent p-0 font-medium text-forest underline decoration-forest/40 underline-offset-2"
                  >
                    Read our cookie policy
                  </button>
                </p>
              </div>
              <button
                type="button"
                onClick={decline}
                aria-label="Reject optional cookies and services and dismiss"
                className="flex-shrink-0 cursor-pointer rounded-full border-none bg-transparent p-1.5 text-muted transition hover:bg-bg hover:text-text"
              >
                <X size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setExpanded((s) => !s)}
              aria-expanded={expanded}
              className="mb-3 flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-border bg-bg px-3 py-2.5 text-left text-[13px] font-semibold text-forest transition hover:border-forest/30"
            >
              <span>Customise preferences</span>
              <ChevronDown
                size={14}
                className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
              />
            </button>

            {expanded && (
              <div className="mb-4 grid gap-2 rounded-xl border border-border bg-bg p-3.5">
                <ConsentRow
                  title="Essential"
                  desc="Required for cart, login, and checkout."
                  on
                  locked
                />
                <ConsentRow
                  title="Analytics (first-party)"
                  desc="Anonymous usage data. No third-party tracking."
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
            )}

            <div className={`grid gap-2 ${expanded ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
              <button
                type="button"
                onClick={decline}
                className="min-h-11 cursor-pointer rounded-xl border border-border bg-transparent px-4 py-2.5 text-sm font-semibold text-muted transition hover:border-forest/30 hover:text-forest"
              >
                Reject optional
              </button>
              {expanded && (
                <button
                  type="button"
                  onClick={acceptSelected}
                  className="min-h-11 cursor-pointer rounded-xl border border-forest bg-transparent px-4 py-2.5 text-sm font-semibold text-forest transition hover:bg-sagePale"
                >
                  Save preferences
                </button>
              )}
              <button
                ref={acceptRef}
                type="button"
                onClick={acceptAll}
                className="min-h-11 cursor-pointer rounded-xl border-none bg-forest px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(45,74,50,0.18)] transition hover:bg-[#203927]"
              >
                Accept all
              </button>
            </div>
          </motion.div>
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
    <label className="flex cursor-pointer items-start gap-3 rounded-lg px-1 py-1">
      <input
        type="checkbox"
        checked={on}
        disabled={locked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-0.5 h-4 w-4 cursor-pointer accent-forest disabled:cursor-not-allowed"
        aria-describedby={descId}
      />
      <span className="flex-1">
        <span className="block text-[13px] font-semibold text-text">{title}</span>
        <span id={descId} className="block text-xs leading-relaxed text-muted">
          {desc}
          {locked && <span className="ml-1 text-forest">(always on)</span>}
        </span>
      </span>
    </label>
  )
}
