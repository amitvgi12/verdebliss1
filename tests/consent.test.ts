import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  COOKIE_PREFERENCES_EVENT,
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  hasAnalyticsConsent,
  hasFunctionalThirdPartyConsent,
  loadStoredConsent,
  openCookiePreferences,
  persistConsent,
} from '@/lib/consent'

describe('consent storage', () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  it('defaults optional third-party AI consent to false when no decision exists', () => {
    expect(hasFunctionalThirdPartyConsent()).toBe(false)
  })

  it('defaults analytics consent to false when no decision exists', () => {
    expect(hasAnalyticsConsent()).toBe(false)
  })

  it('rejects stale consent records from before the AI consent category existed', () => {
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        version: '1.0',
        essential: true,
        analytics: true,
        marketing: true,
      })
    )

    expect(loadStoredConsent()).toBeNull()
    expect(hasFunctionalThirdPartyConsent()).toBe(false)
  })

  it('persists explicit optional third-party AI consent', () => {
    persistConsent({ analytics: false, marketing: false, functional_third_party: true })

    expect(loadStoredConsent()).toMatchObject({
      version: CONSENT_VERSION,
      essential: true,
      analytics: false,
      marketing: false,
      functional_third_party: true,
    })
    expect(hasFunctionalThirdPartyConsent()).toBe(true)
  })

  it('persists explicit analytics consent', () => {
    persistConsent({ analytics: true, marketing: false, functional_third_party: false })

    expect(hasAnalyticsConsent()).toBe(true)
  })

  it('dispatches an event so footer links can reopen cookie preferences', () => {
    const listener = vi.fn()
    window.addEventListener(COOKIE_PREFERENCES_EVENT, listener)

    openCookiePreferences()

    expect(listener).toHaveBeenCalledTimes(1)
    window.removeEventListener(COOKIE_PREFERENCES_EVENT, listener)
  })
})
