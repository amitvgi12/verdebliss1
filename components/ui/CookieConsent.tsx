/**
 * CookieConsent — GDPR/CCPA banner.
 *
 * - Shown on first visit (no localStorage entry).
 * - Granular preferences: essential (always on), analytics, marketing.
 * - Stores decision in `vb_cookie_consent` (timestamp, version, prefs).
 * - Accessible: role="dialog", focus on render, ESC dismisses.
 * - CSS-driven responsive (no useWindowWidth → no hydration mismatch).
 */
'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, X, ChevronDown } from 'lucide-react'
import LegalModal, { type LegalModalType } from '@/components/ui/LegalModal'

const STORAGE_KEY = 'vb_cookie_consent'
const VERSION = '1.0'

interface ConsentPrefs {
  analytics: boolean
  marketing: boolean
}

interface StoredConsent extends ConsentPrefs {
  timestamp: string
  version: string
  essential: true
}

function loadStored(): StoredConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredConsent) : null
  } catch {
    return null
  }
}

function persist(prefs: ConsentPrefs) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        version: VERSION,
        essential: true,
        analytics: prefs.analytics,
        marketing: prefs.marketing,
      } satisfies StoredConsent)
    )
  } catch {
    /* storage unavailable */
  }
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [modal, setModal] = useState<LegalModalType | null>(null)
  const acceptRef = useRef<HTMLButtonElement | null>(null)

  const acceptAll = () => {
    persist({ analytics: true, marketing: true })
    setVisible(false)
  }

  const acceptSelected = () => {
    persist({ analytics, marketing })
    setVisible(false)
  }

  const decline = () => {
    persist({ analytics: false, marketing: false })
    setVisible(false)
  }

  useEffect(() => {
    if (loadStored()) return
    const t = setTimeout(() => setVisible(true), 1200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (visible) acceptRef.current?.focus()
  }, [visible])

  useEffect(() => {
    if (!visible) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        persist({ analytics: false, marketing: false })
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
            className="fixed bottom-0 left-0 right-0 z-[300] border-t border-border bg-warmWhite p-4 shadow-[0_-8px_28px_rgba(0,0,0,0.08)] sm:bottom-4 sm:left-1/2 sm:max-w-[640px] sm:-translate-x-1/2 sm:rounded-2xl sm:border"
          >
            <div className="mb-3 flex items-start gap-3">
              <Shield size={20} aria-hidden className="flex-shrink-0 text-forest" />
              <div className="flex-1">
                <h2 className="mb-1 font-serif text-base font-semibold text-text">
                  Your privacy matters
                </h2>
                <p className="text-xs leading-relaxed text-muted">
                  We use essential cookies to keep the site working and optional cookies for
                  analytics and personalisation. You&apos;re in control.{' '}
                  <button
                    type="button"
                    onClick={() => setModal('cookie')}
                    className="border-none bg-transparent p-0 font-medium text-forest underline"
                  >
                    Read our cookie policy
                  </button>
                </p>
              </div>
              <button
                type="button"
                onClick={decline}
                aria-label="Reject optional cookies and dismiss"
                className="flex-shrink-0 cursor-pointer rounded-lg border-none bg-transparent p-1 text-muted hover:text-text"
              >
                <X size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setExpanded((s) => !s)}
              aria-expanded={expanded}
              className="mb-2 flex w-full cursor-pointer items-center justify-between gap-2 border-none bg-transparent text-left text-xs font-semibold text-forest"
            >
              <span>Customise preferences</span>
              <ChevronDown
                size={14}
                className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
              />
            </button>

            {expanded && (
              <div className="mb-3 flex flex-col gap-2 rounded-[10px] bg-bg p-3">
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
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={decline}
                className="flex-1 cursor-pointer rounded-[10px] border border-border bg-transparent px-3 py-2.5 text-xs font-semibold text-muted"
              >
                Reject optional
              </button>
              {expanded && (
                <button
                  type="button"
                  onClick={acceptSelected}
                  className="flex-1 cursor-pointer rounded-[10px] border border-forest bg-transparent px-3 py-2.5 text-xs font-semibold text-forest"
                >
                  Save preferences
                </button>
              )}
              <button
                ref={acceptRef}
                type="button"
                onClick={acceptAll}
                className="flex-1 cursor-pointer rounded-[10px] border-none bg-forest px-3 py-2.5 text-xs font-semibold text-white"
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
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={on}
        disabled={locked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-0.5 h-4 w-4 cursor-pointer accent-forest disabled:cursor-not-allowed"
        aria-describedby={`${title}-desc`}
      />
      <span className="flex-1">
        <span className="block text-xs font-semibold text-text">{title}</span>
        <span id={`${title}-desc`} className="block text-[11px] leading-relaxed text-muted">
          {desc}
          {locked && <span className="ml-1 text-forest">(always on)</span>}
        </span>
      </span>
    </label>
  )
}
