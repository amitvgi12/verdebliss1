import { describe, expect, it } from 'vitest'
import { getClientIp, resolveClientIp } from '@/lib/client-ip'
import { ORIGIN_VERIFIED_CLOUDFLARE, ORIGIN_VERIFIED_HEADER } from '@/lib/origin-trust'

function makeRequest(headers: Record<string, string>): Request {
  return new Request('https://example.com', { headers })
}

describe('resolveClientIp', () => {
  it('prefers cf-connecting-ip only after the proxy verifies Cloudflare origin', () => {
    const r = makeRequest({
      [ORIGIN_VERIFIED_HEADER]: ORIGIN_VERIFIED_CLOUDFLARE,
      'cf-connecting-ip': '203.0.113.10',
      'x-forwarded-for': '198.51.100.5, 10.0.0.1',
      'x-real-ip': '10.0.0.1',
    })
    expect(resolveClientIp(r)).toEqual({ ip: '203.0.113.10', source: 'cf' })
  })

  it('does not trust cf-connecting-ip without the internal origin marker', () => {
    const r = makeRequest({
      'cf-connecting-ip': '203.0.113.10',
      'x-vercel-forwarded-for': '203.0.113.20',
    })
    expect(resolveClientIp(r)).toEqual({ ip: '203.0.113.20', source: 'vercel' })
  })

  it('falls back to x-vercel-forwarded-for when cf is absent', () => {
    const r = makeRequest({
      'x-vercel-forwarded-for': '203.0.113.20',
      'x-forwarded-for': '198.51.100.5',
    })
    expect(resolveClientIp(r)).toEqual({ ip: '203.0.113.20', source: 'vercel' })
  })

  it('falls back to leftmost x-forwarded-for entry', () => {
    const r = makeRequest({ 'x-forwarded-for': '203.0.113.30, 10.0.0.1, 10.0.0.2' })
    expect(resolveClientIp(r)).toEqual({ ip: '203.0.113.30', source: 'xff' })
  })

  it('falls back to x-real-ip if no x-forwarded-for', () => {
    const r = makeRequest({ 'x-real-ip': '203.0.113.40' })
    expect(resolveClientIp(r)).toEqual({ ip: '203.0.113.40', source: 'real-ip' })
  })

  it('does not trust generic forwarding headers when disabled', () => {
    const r = makeRequest({ 'x-forwarded-for': '203.0.113.30', 'x-real-ip': '203.0.113.40' })
    expect(resolveClientIp(r, { trustGenericProxyHeaders: false })).toEqual({
      ip: 'unknown',
      source: 'unknown',
    })
  })

  it("returns 'unknown' when no proxy headers are set", () => {
    const r = makeRequest({})
    expect(resolveClientIp(r)).toEqual({ ip: 'unknown', source: 'unknown' })
  })

  it('treats empty header values as missing', () => {
    const r = makeRequest({ 'x-forwarded-for': '   ', 'x-real-ip': '198.51.100.99' })
    expect(resolveClientIp(r).ip).toBe('198.51.100.99')
  })

  it('getClientIp returns just the IP string', () => {
    const r = makeRequest({
      [ORIGIN_VERIFIED_HEADER]: ORIGIN_VERIFIED_CLOUDFLARE,
      'cf-connecting-ip': '203.0.113.50',
    })
    expect(getClientIp(r)).toBe('203.0.113.50')
  })

  it('does not let a malicious x-forwarded-for override cf-connecting-ip', () => {
    const r = makeRequest({
      [ORIGIN_VERIFIED_HEADER]: ORIGIN_VERIFIED_CLOUDFLARE,
      'cf-connecting-ip': '203.0.113.60',
      // Spoofed by client trying to forge an "internal" IP
      'x-forwarded-for': '10.0.0.1',
    })
    expect(resolveClientIp(r)).toEqual({ ip: '203.0.113.60', source: 'cf' })
  })
})
