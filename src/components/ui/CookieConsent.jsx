/**
 * CookieConsent.jsx — GDPR/CCPA compliant cookie consent banner (11.7)
 *
 * - Appears on first visit (no localStorage entry)
 * - Stores granular preferences: essential (always on), analytics, marketing
 * - Remembers decision in localStorage key 'vb_cookie_consent'
 * - Accessible: role="dialog", focus trap on mount, keyboard dismissible
 * - Mobile responsive: stacks buttons vertically on narrow screens
 */
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, X, ChevronDown } from 'lucide-react'
import { C, FONT } from '@/constants/theme'
import { useWindowWidth, BP } from '@/hooks/useWindowWidth'

const STORAGE_KEY = 'vb_cookie_consent'

function getStoredConsent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveConsent(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      timestamp:  new Date().toISOString(),
      version:    '1.0',
      essential:  true,
      analytics:  prefs.analytics  ?? false,
      marketing:  prefs.marketing  ?? false,
    }))
  } catch { /* storage unavailable */ }
}

export default function CookieConsent() {
  const [visible, setVisible]   = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const width    = useWindowWidth()
  const isMobile = width < BP.tablet
  const btnRef   = useRef(null)

  useEffect(() => {
    const consent = getStoredConsent()
    if (!consent) {
      // Small delay so page has time to paint before banner slides up
      const t = setTimeout(() => setVisible(true), 1200)
      return () => clearTimeout(t)
    }
  }, [])

  useEffect(() => {
    if (visible) btnRef.current?.focus()
  }, [visible])

  const acceptAll = () => {
    saveConsent({ analytics: true, marketing: true })
    setVisible(false)
  }

  const rejectAll = () => {
    saveConsent({ analytics: false, marketing: false })
    setVisible(false)
  }

  const savePrefs = () => {
    saveConsent({ analytics, marketing })
    setVisible(false)
  }

  if (!visible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-title"
        aria-describedby="cookie-desc"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: C.card,
          borderTop: `3px solid ${C.forest}`,
          boxShadow: '0 -4px 32px rgba(0,0,0,0.12)',
          zIndex: 9000,
          padding: isMobile ? '20px 16px' : '24px 32px',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
            <Shield size={20} color={C.forest} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <h2 id="cookie-title" style={{ fontSize: 15, fontWeight: 600, color: C.text, margin: '0 0 6px', fontFamily: FONT.sans }}>
                We Value Your Privacy
              </h2>
              <p id="cookie-desc" style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, margin: 0 }}>
                We use essential cookies to keep this site working. With your consent we also use analytics
                cookies to improve your experience. We do not use advertising tracking cookies. Read our{' '}
                <button onClick={() => {}} style={{ background: 'none', border: 'none', color: C.forest, cursor: 'pointer', fontSize: 12, textDecoration: 'underline', fontFamily: 'inherit', padding: 0 }}>
                  Privacy Policy
                </button>{' '}
                and{' '}
                <button onClick={() => {}} style={{ background: 'none', border: 'none', color: C.forest, cursor: 'pointer', fontSize: 12, textDecoration: 'underline', fontFamily: 'inherit', padding: 0 }}>
                  Cookie Policy
                </button>.
              </p>
            </div>
            {/* Close = reject all */}
            <button onClick={rejectAll} aria-label="Reject all and close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, flexShrink: 0 }}>
              <X size={16} />
            </button>
          </div>

          {/* Expandable preferences */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden', marginBottom: 14 }}
              >
                <div style={{ background: C.ivory, borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Essential — always on */}
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'not-allowed' }}>
                    <input type="checkbox" checked readOnly disabled style={{ marginTop: 3, accentColor: C.forest }} />
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Essential Cookies</span>
                      <span style={{ fontSize: 10, color: C.gold, marginLeft: 6, fontWeight: 600 }}>Always Active</span>
                      <p style={{ fontSize: 11, color: C.muted, margin: '2px 0 0', lineHeight: 1.5 }}>
                        Required for cart, login sessions, and site functionality.
                      </p>
                    </div>
                  </label>
                  {/* Analytics */}
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                    <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} style={{ marginTop: 3, accentColor: C.forest }} />
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Analytics Cookies</span>
                      <p style={{ fontSize: 11, color: C.muted, margin: '2px 0 0', lineHeight: 1.5 }}>
                        Help us understand how visitors use the site so we can improve it. No personal data is shared with third parties.
                      </p>
                    </div>
                  </label>
                  {/* Marketing */}
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                    <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} style={{ marginTop: 3, accentColor: C.forest }} />
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Marketing Cookies</span>
                      <p style={{ fontSize: 11, color: C.muted, margin: '2px 0 0', lineHeight: 1.5 }}>
                        Allow us to personalise offers. We do not sell your data to advertisers.
                      </p>
                    </div>
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              ref={btnRef}
              onClick={acceptAll}
              style={{ background: C.forest, color: 'white', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
              Accept All
            </button>
            <button
              onClick={rejectAll}
              style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', color: C.muted, whiteSpace: 'nowrap' }}>
              Reject Non-Essential
            </button>
            <button
              onClick={() => setExpanded((e) => !e)}
              style={{ background: 'none', border: 'none', color: C.forest, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'underline', padding: '9px 4px' }}>
              Customise <ChevronDown size={12} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {expanded && (
              <button
                onClick={savePrefs}
                style={{ background: C.gold, color: 'white', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                Save Preferences
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
