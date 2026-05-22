import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import VercelInsights from '@/components/ui/VercelInsights'
import { CONSENT_STORAGE_KEY, CONSENT_VERSION } from '@/lib/consent'

type PageViewEvent = { type: 'pageview'; url: string }
type AnalyticsProps = {
  beforeSend?: (event: PageViewEvent) => PageViewEvent | null
}

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

  it('always mounts privacy-preserving Vercel telemetry', () => {
    render(<VercelInsights />)

    expect(vercelMocks.speedInsights).toHaveBeenCalledTimes(1)
    expect(vercelMocks.analytics).toHaveBeenCalledTimes(1)
  })

  it('mounts Web Analytics even when optional consent is declined', () => {
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        version: CONSENT_VERSION,
        essential: true,
        analytics: false,
        marketing: false,
        functional_third_party: false,
      })
    )

    render(<VercelInsights />)

    expect(vercelMocks.analytics).toHaveBeenCalledTimes(1)
    expect(vercelMocks.speedInsights).toHaveBeenCalledTimes(1)
  })

  it('strips query strings and hashes before sending page views', () => {
    render(<VercelInsights />)

    const calls = vercelMocks.analytics.mock.calls as unknown as Array<[AnalyticsProps]>
    const props = calls[0]?.[0]

    const event = props?.beforeSend?.({
      type: 'pageview',
      url: 'https://www.verdebliss.com/products?email=test@example.com#details',
    })

    expect(event).toEqual({
      type: 'pageview',
      url: 'https://www.verdebliss.com/products',
    })
  })
})
