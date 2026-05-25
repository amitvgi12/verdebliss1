import { describe, expect, it } from 'vitest'
import { buildContentSecurityPolicy, withSecurityRequestHeaders } from '@/proxy'

describe('CSP proxy headers', () => {
  it('forwards the nonce and CSP on request headers for Next script nonce propagation', () => {
    const csp = buildContentSecurityPolicy('test-nonce', { isProduction: true })
    const requestHeaders = withSecurityRequestHeaders(new Headers(), 'test-nonce', csp)

    expect(csp).toContain("'nonce-test-nonce'")
    expect(csp).toContain("'strict-dynamic'")
    expect(csp).not.toContain("'unsafe-eval'")
    expect(requestHeaders.get('x-nonce')).toBe('test-nonce')
    expect(requestHeaders.get('x-csp')).toBe(csp)
    expect(requestHeaders.get('Content-Security-Policy')).toBe(csp)
  })

  it('allows unsafe-eval only outside production for Next development tooling', () => {
    expect(buildContentSecurityPolicy('test-nonce', { isProduction: false })).toContain(
      "'unsafe-eval'"
    )
    expect(buildContentSecurityPolicy('test-nonce', { isProduction: true })).not.toContain(
      "'unsafe-eval'"
    )
  })
})
