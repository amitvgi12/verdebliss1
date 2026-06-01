import { describe, expect, it } from 'vitest'
import {
  buildContentSecurityPolicy,
  checkCloudflareOriginGate,
  isCloudflareOriginGateProtected,
  requiresScriptNonce,
  withSecurityRequestHeaders,
} from '@/proxy'
import {
  ORIGIN_SECRET_HEADER,
  ORIGIN_VERIFIED_CLOUDFLARE,
  ORIGIN_VERIFIED_HEADER,
} from '@/lib/origin-trust'

function parseDirectives(csp: string): Record<string, string> {
  return Object.fromEntries(
    csp.split('; ').map((directive) => {
      const [name, ...value] = directive.split(' ')
      return [name, value.join(' ')]
    })
  )
}

describe('CSP proxy headers', () => {
  it('forwards the nonce and CSP on request headers for Next script nonce propagation', () => {
    const csp = buildContentSecurityPolicy('test-nonce', { isProduction: true })
    const requestHeaders = withSecurityRequestHeaders(
      new Headers({
        [ORIGIN_SECRET_HEADER]: 'origin-secret',
        [ORIGIN_VERIFIED_HEADER]: 'spoofed',
      }),
      'test-nonce',
      csp
    )

    expect(csp).toContain("'nonce-test-nonce'")
    expect(csp).toContain("'strict-dynamic'")
    expect(csp).not.toContain("'unsafe-eval'")
    expect(requestHeaders.get(ORIGIN_SECRET_HEADER)).toBeNull()
    expect(requestHeaders.get(ORIGIN_VERIFIED_HEADER)).toBeNull()
    expect(requestHeaders.get('x-nonce')).toBe('test-nonce')
    expect(requestHeaders.get('x-csp')).toBe(csp)
    expect(requestHeaders.get('Content-Security-Policy')).toBe(csp)
  })

  it('stamps Cloudflare verification only after the origin gate passes', () => {
    const csp = buildContentSecurityPolicy('test-nonce', { isProduction: true })
    const requestHeaders = withSecurityRequestHeaders(new Headers(), 'test-nonce', csp, {
      cloudflareOriginVerified: true,
    })

    expect(requestHeaders.get(ORIGIN_VERIFIED_HEADER)).toBe(ORIGIN_VERIFIED_CLOUDFLARE)
  })

  it('allows unsafe-eval only outside production for Next development tooling', () => {
    expect(buildContentSecurityPolicy('test-nonce', { isProduction: false })).toContain(
      "'unsafe-eval'"
    )
    expect(buildContentSecurityPolicy('test-nonce', { isProduction: true })).not.toContain(
      "'unsafe-eval'"
    )
  })

  it('keeps inline allowance scoped to styles, never scripts, on nonce routes', () => {
    const directives = parseDirectives(
      buildContentSecurityPolicy('test-nonce', { isProduction: true })
    )

    expect(directives['script-src']).not.toContain("'unsafe-inline'")
    expect(directives['script-src-elem']).not.toContain("'unsafe-inline'")
    expect(directives['style-src']).toContain("'unsafe-inline'")
    expect(directives['style-src-elem']).toContain("'unsafe-inline'")
  })
})

describe('Cloudflare origin gate', () => {
  it('protects app API routes but leaves exempt endpoints alone', () => {
    expect(isCloudflareOriginGateProtected('/api/checkout/cod')).toBe(true)
    expect(isCloudflareOriginGateProtected('/api/version')).toBe(false)
    expect(isCloudflareOriginGateProtected('/api/csp-report')).toBe(false)
    expect(isCloudflareOriginGateProtected('/api/webhooks/razorpay')).toBe(false)
    expect(isCloudflareOriginGateProtected('/products')).toBe(false)
  })

  it('allows an unconfigured gate when production fail-closed mode is not enabled', () => {
    expect(
      checkCloudflareOriginGate('/api/checkout/cod', new Headers(), {
        NODE_ENV: 'production',
      })
    ).toEqual({ allowed: true, verified: false })
  })

  it('fails closed when production requires the gate but the secret is missing', () => {
    expect(
      checkCloudflareOriginGate('/api/checkout/cod', new Headers(), {
        NODE_ENV: 'production',
        CF_ORIGIN_GATE_REQUIRED: 'true',
      })
    ).toEqual({
      allowed: false,
      verified: false,
      status: 503,
      message: 'Origin protection is not configured',
    })
  })

  it('rejects protected API requests with an invalid Cloudflare origin secret', () => {
    expect(
      checkCloudflareOriginGate(
        '/api/checkout/cod',
        new Headers({ [ORIGIN_SECRET_HEADER]: 'wrong' }),
        {
          NODE_ENV: 'production',
          CF_ORIGIN_SECRET: 'expected',
        }
      )
    ).toEqual({ allowed: false, verified: false, status: 403, message: 'Forbidden' })
  })

  it('marks protected API requests verified when the Cloudflare secret matches', () => {
    expect(
      checkCloudflareOriginGate(
        '/api/checkout/cod',
        new Headers({ [ORIGIN_SECRET_HEADER]: 'expected' }),
        {
          NODE_ENV: 'production',
          CF_ORIGIN_SECRET: 'expected',
        }
      )
    ).toEqual({ allowed: true, verified: true })
  })
})

describe('CSP for static/ISR routes (useNonce: false)', () => {
  // Statically generated / ISR-cached pages bake their <script> tags ahead of
  // the request, so they cannot carry a per-request nonce. Under 'strict-dynamic'
  // those nonce-less scripts are blocked and the page renders blank, so these
  // routes must fall back to 'unsafe-inline'. Regression guard for the bug where
  // strict CSP was applied to every route and blanked the public storefront.
  it('uses unsafe-inline scripts without a nonce or strict-dynamic', () => {
    const directives = parseDirectives(
      buildContentSecurityPolicy('', { isProduction: true, useNonce: false })
    )

    expect(directives['script-src']).toContain("'unsafe-inline'")
    expect(directives['script-src-elem']).toContain("'unsafe-inline'")
    expect(directives['script-src']).not.toContain('strict-dynamic')
    expect(directives['script-src-elem']).not.toContain('strict-dynamic')
    expect(directives['script-src']).not.toContain('nonce-')
  })

  it('keeps the rest of the policy locked down', () => {
    const directives = parseDirectives(
      buildContentSecurityPolicy('', { isProduction: true, useNonce: false })
    )

    expect(directives['default-src']).toBe("'self'")
    expect(directives['object-src']).toBe("'none'")
    expect(directives['frame-ancestors']).toBe("'none'")
    expect(directives['base-uri']).toBe("'self'")
  })
})

describe('requiresScriptNonce route classification', () => {
  it('enforces a nonce on always-dynamic auth, checkout, and form routes', () => {
    for (const path of [
      '/account',
      '/account/orders',
      '/account/orders/abc/invoice',
      '/checkout',
      '/contact',
      '/quiz',
      '/refund',
    ]) {
      expect(requiresScriptNonce(path)).toBe(true)
    }
  })

  it('falls back to the inline policy for static and ISR public routes', () => {
    for (const path of [
      '/',
      '/products',
      '/products/bakuchiol-serum',
      '/blog',
      '/blog/some-article',
      '/faq',
      '/our-story',
      '/ingredients',
      '/sustainability',
      '/certifications',
      '/privacy-policy',
      '/terms',
      '/shipping-policy',
      '/returns-refunds',
      '/cookie-policy',
      '/press',
    ]) {
      expect(requiresScriptNonce(path)).toBe(false)
    }
  })

  it('does not treat unrelated prefixes as nonce routes', () => {
    // A route that merely starts with the same letters must not match.
    expect(requiresScriptNonce('/accounts-payable')).toBe(false)
    expect(requiresScriptNonce('/quizzes')).toBe(false)
  })
})
