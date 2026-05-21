'use client'

import { useEffect, useState } from 'react'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import {
  CONSENT_UPDATED_EVENT,
  hasAnalyticsConsent,
  loadStoredConsent,
  type StoredConsent,
} from '@/lib/consent'

export default function VercelInsights() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    setEnabled(hasAnalyticsConsent())

    const handleConsent = (event: Event) => {
      const detail =
        event instanceof CustomEvent ? (event.detail as StoredConsent | undefined) : undefined
      setEnabled(detail?.analytics ?? loadStoredConsent()?.analytics === true)
    }

    window.addEventListener(CONSENT_UPDATED_EVENT, handleConsent)
    return () => window.removeEventListener(CONSENT_UPDATED_EVENT, handleConsent)
  }, [])

  if (!enabled) return null

  return (
    <>
      <Analytics beforeSend={(event) => (hasAnalyticsConsent() ? event : null)} />
      <SpeedInsights beforeSend={(event) => (hasAnalyticsConsent() ? event : null)} />
    </>
  )
}
