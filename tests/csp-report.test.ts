import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  reportError: vi.fn(),
}))

vi.mock('@/lib/observability', () => ({
  reportError: mocks.reportError,
}))

import { normalizeReports, POST } from '@/app/api/csp-report/route'

describe('CSP report endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('accepts classic CSP reports and logs sanitized violation data', async () => {
    const response = await POST(
      new Request('https://www.verdebliss.com/api/csp-report', {
        method: 'POST',
        headers: {
          'content-type': 'application/csp-report',
          'user-agent': 'vitest',
        },
        body: JSON.stringify({
          'csp-report': {
            'document-uri': 'https://www.verdebliss.com/',
            'violated-directive': 'style-src',
            'blocked-uri': 'https://example.com/pixel.gif',
            cookie: 'should-not-log',
          },
        }),
      })
    )

    expect(response.status).toBe(204)
    expect(mocks.reportError).toHaveBeenCalledWith('csp_violation', {
      reports: [
        {
          'blocked-uri': 'https://example.com/pixel.gif',
          'document-uri': 'https://www.verdebliss.com/',
          'violated-directive': 'style-src',
        },
      ],
      userAgent: 'vitest',
    })
  })

  it('normalizes Reporting API batches', () => {
    expect(
      normalizeReports([
        {
          type: 'csp-violation',
          url: 'https://www.verdebliss.com/',
          body: {
            'effective-directive': 'script-src',
            'blocked-uri': 'inline',
            token: 'should-not-log',
          },
        },
      ])
    ).toEqual([
      {
        type: 'csp-violation',
        url: 'https://www.verdebliss.com/',
        body: {
          'blocked-uri': 'inline',
          'effective-directive': 'script-src',
        },
      },
    ])
  })
})
