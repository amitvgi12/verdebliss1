/**
 * CookieConsent — GDPR/CCPA banner.
 *
 * - Shown on first visit (no localStorage entry).
 * - Granular preferences: essential (always on), privacy-preserving site measurement, marketing, optional third-party AI.
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
  const [marketing, setMarketing] = useState(false)
  const [functionalThirdParty, setFunctionalThirdParty] = useState(false)
  const [modal, setModal] = useState<LegalModalType | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)

  const syncFromStored = useCallback(() => {
    const stored = loadStoredConsent()
    setMarketing(stored?.marketing ?? false)
    setFunctionalThirdParty(stored?.functional_third_party ?? false)
  }, [])

  const openPreferences = useCallback(() => {
    syncFromStored()
    setExpanded(true)
    setVisible(true)
  }, [syncFromStored])

  const acceptAll = () => {
    persistConsent({ analytics: false, marketing: true, functional_third_party: true })
    setVisible(false)
  }

  const acceptSelected = () => {
    persistConsent({
      analytics: false,
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
    if (visible) dialogRef.current?.focus()
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
          <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[300] flex justify-center px-3 sm:bottom-6 sm:px-5">
            <motion.div
              initial={{ y: 24, opacity: 0, scale: 0.985 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.985 }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              ref={dialogRef}
              role="dialog"
              aria-modal="false"
              aria-label="Cookie preferences"
              tabIndex={-1}
              className="pointer-events-auto max-h-[min(84vh,760px)] w-full max-w-[900px] overflow-y-auto rounded-[28px] border border-[#D9CCBC] bg-[#FFFCF7] shadow-[0_24px_70px_rgba(28,34,30,0.24)] focus:outline-none"
            >
              <div className="relative overflow-hidden bg-[linear-gradient(135deg,#FFFDF9_0%,#F6EFE6_100%)] px-4 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
                <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#C8A464,#7D9B76,#2D4A32)]" />
                <button
                  type="button"
                  onClick={decline}
                  aria-label="Reject optional cookies and services and dismiss"
                  className="absolute right-3 top-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-transparent bg-white/75 text-muted shadow-sm transition hover:border-border hover:bg-white hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
                >
                  <X size={17} />
                </button>

                <div className="grid gap-4 pr-0 sm:grid-cols-[minmax(0,1fr)_340px] sm:items-center sm:gap-6 sm:pr-10">
                  <div className="flex min-w-0 items-start gap-3.5">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-white bg-sagePale shadow-[0_6px_18px_rgba(45,74,50,0.12)] sm:h-12 sm:w-12">
                      <Shield size={20} aria-hidden className="text-forest" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-gold">
                        Consent Centre
                      </p>
                      <h2 className="font-serif text-[23px] font-semibold leading-none text-text sm:text-[29px]">
                        Your privacy matters
                      </h2>
                      <p className="mt-2 max-w-xl text-[13px] leading-5 text-muted sm:text-sm sm:leading-6">
                        <span className="hidden sm:inline">
                          Essential cookies keep VerdeBliss working. Privacy-preserving site
                          measurement runs without cookies; marketing and AI support stay off unless
                          you choose them.
                        </span>
                        <span className="sm:hidden">
                          Essential cookies keep the site working. Marketing and AI support stay off
                          unless you choose them.
                        </span>{' '}
                        <button
                          type="button"
                          onClick={() => setModal('cookie')}
                          className="border-none bg-transparent p-0 font-semibold text-forest underline decoration-forest/35 underline-offset-4 transition hover:decoration-forest"
                        >
                          Cookie policy
                        </button>
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2.5 sm:justify-self-end">
                    <button
                      type="button"
                      onClick={() => setExpanded((s) => !s)}
                      aria-expanded={expanded}
                      className="mx-auto flex h-11 w-full max-w-[220px] cursor-pointer items-center justify-center gap-2.5 rounded-full border border-[#D8CDBF] bg-white/95 px-4 text-center text-sm font-bold text-forest shadow-sm transition hover:border-forest/35 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
                    >
                      <span>Customise</span>
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-sagePale text-forest">
                        <ChevronDown
                          size={15}
                          className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
                        />
                      </span>
                    </button>

                    {!expanded && (
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={decline}
                          className="h-12 cursor-pointer rounded-full border border-[#D8CDBF] bg-white px-4 text-sm font-bold text-muted transition hover:border-forest/35 hover:bg-[#FBF7F0] hover:text-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
                        >
                          Reject optional
                        </button>
                        <button
                          type="button"
                          onClick={acceptAll}
                          className="h-12 cursor-pointer rounded-full border border-forest bg-forest px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(45,74,50,0.2)] transition hover:-translate-y-0.5 hover:bg-[#203927] hover:shadow-[0_15px_28px_rgba(45,74,50,0.24)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
                        >
                          Accept all
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-5 overflow-hidden rounded-[22px] border border-[#E2D6C8] bg-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                      <ConsentRow
                        title="Essential"
                        desc="Required for cart, login, and checkout."
                        on
                        locked
                      />
                      <ConsentRow
                        title="Site measurement"
                        desc="Vercel Web Analytics and Speed Insights provide anonymized page-view and performance metrics without cookies, cross-site tracking, or advertising profiles."
                        on
                        locked
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

                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={decline}
                        className="min-h-12 cursor-pointer rounded-full border border-[#D8CDBF] bg-white px-4 py-2.5 text-sm font-bold text-muted transition hover:border-forest/35 hover:bg-[#FBF7F0] hover:text-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
                      >
                        Reject optional
                      </button>
                      <button
                        type="button"
                        onClick={acceptSelected}
                        className="min-h-12 cursor-pointer rounded-full border border-forest/40 bg-sagePale px-4 py-2.5 text-sm font-bold text-forest transition hover:border-forest hover:bg-[#DDE9DA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
                      >
                        Save preferences
                      </button>
                      <button
                        type="button"
                        onClick={acceptAll}
                        className="min-h-12 cursor-pointer rounded-full border border-forest bg-forest px-4 py-2.5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(45,74,50,0.2)] transition hover:-translate-y-0.5 hover:bg-[#203927] hover:shadow-[0_15px_28px_rgba(45,74,50,0.24)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
                      >
                        Accept all
                      </button>
                    </div>
                  </motion.div>
                )}
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
    <label
      className={`group grid gap-3 border-b border-[#E6DBCE] px-4 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5 ${
        locked ? 'cursor-default' : 'cursor-pointer transition hover:bg-[#FBF7F0]'
      }`}
    >
      <input
        type="checkbox"
        checked={on}
        disabled={locked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="sr-only"
        aria-describedby={descId}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold leading-5 text-text">{title}</span>
        <span id={descId} className="mt-1 block max-w-[680px] text-xs leading-5 text-muted">
          {desc}
        </span>
      </span>

      {locked ? (
        <span
          aria-hidden
          className="inline-flex h-8 w-fit items-center justify-center rounded-full border border-forest/15 bg-sagePale px-3 text-xs font-bold text-forest sm:justify-self-end"
        >
          Always on
        </span>
      ) : (
        <span
          aria-hidden
          className={`flex h-8 w-14 flex-shrink-0 items-center rounded-full p-1 transition sm:justify-self-end ${
            on ? 'bg-forest' : 'bg-[#D8CDBF]'
          }`}
        >
          <span
            className={`h-6 w-6 rounded-full bg-white shadow-sm transition ${
              on ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </span>
      )}
    </label>
  )
}
