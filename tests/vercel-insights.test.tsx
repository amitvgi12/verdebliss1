import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import VercelInsights from '@/components/ui/VercelInsights'
import { CONSENT_STORAGE_KEY, CONSENT_VERSION } from '@/lib/consent'

const vercelMocks = vi.hoisted(() => ({
  analytics: vi.fn(() => null),
  speedInsights: vi.fn(() => null),
}))

vi.mock('@vercel/analytics/next', () => ({
  Analytics: vercelMocks.analytics,
}))

vi.mock('@vercel/speed-insights/next', () => ({
  SpeedInsights: vercelMocks.speedInsights,
}))

describe('VercelInsights', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vercelMocks.analytics.mockClear()
    vercelMocks.speedInsights.mockClear()
  })

  it('always mounts Speed Insights performance telemetry', () => {
    render(<VercelInsights />)

    expect(vercelMocks.speedInsights).toHaveBeenCalledTimes(1)
    expect(vercelMocks.analytics).not.toHaveBeenCalled()
  })

  it('mounts Web Analytics only after analytics consent', () => {
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        version: CONSENT_VERSION,
        essential: true,
        analytics: true,
        marketing: false,
        functional_third_party: false,
      })
    )

    render(<VercelInsights />)

    expect(vercelMocks.analytics).toHaveBeenCalledTimes(1)
    expect(vercelMocks.speedInsights).toHaveBeenCalledTimes(1)
  })
})
