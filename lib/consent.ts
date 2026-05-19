export const CONSENT_STORAGE_KEY = 'vb_cookie_consent'
export const CONSENT_VERSION = '1.1'
export const CONSENT_UPDATED_EVENT = 'vb:consent-updated'
export const COOKIE_PREFERENCES_EVENT = 'vb:cookie-preferences'

export interface ConsentPrefs {
  analytics: boolean
  marketing: boolean
  functional_third_party: boolean
}

export interface StoredConsent extends ConsentPrefs {
  timestamp: string
  version: string
  essential: true
}

function isStoredConsent(value: unknown): value is StoredConsent {
  if (!value || typeof value !== 'object') return false
  const consent = value as Partial<StoredConsent>
  return (
    consent.version === CONSENT_VERSION &&
    consent.essential === true &&
    typeof consent.timestamp === 'string' &&
    typeof consent.analytics === 'boolean' &&
    typeof consent.marketing === 'boolean' &&
    typeof consent.functional_third_party === 'boolean'
  )
}

export function loadStoredConsent(): StoredConsent | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isStoredConsent(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function persistConsent(prefs: ConsentPrefs): StoredConsent | null {
  if (typeof window === 'undefined') return null

  const next = {
    timestamp: new Date().toISOString(),
    version: CONSENT_VERSION,
    essential: true,
    ...prefs,
  } satisfies StoredConsent

  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent<StoredConsent>(CONSENT_UPDATED_EVENT, { detail: next }))
    return next
  } catch {
    return null
  }
}

export function hasFunctionalThirdPartyConsent(): boolean {
  return loadStoredConsent()?.functional_third_party === true
}

export function openCookiePreferences() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(COOKIE_PREFERENCES_EVENT))
}
