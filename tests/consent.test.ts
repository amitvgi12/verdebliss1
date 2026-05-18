import { afterEach, describe, expect, it } from 'vitest'
import {
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  hasFunctionalThirdPartyConsent,
  loadStoredConsent,
  persistConsent,
} from '@/lib/consent'

describe('consent storage', () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  it('defaults optional third-party AI consent to false when no decision exists', () => {
    expect(hasFunctionalThirdPartyConsent()).toBe(false)
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
})
