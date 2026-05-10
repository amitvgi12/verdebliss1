import { describe, expect, it } from 'vitest'
import { getClientIp, resolveClientIp } from '@/lib/client-ip'

function makeRequest(headers: Record<string, string>): Request {
  return new Request('https://example.com', { headers })
}

describe('resolveClientIp', () => {
  it('prefers cf-connecting-ip when present', () => {
    const r = makeRequest({
      'cf-connecting-ip': '203.0.113.10',
      'x-forwarded-for': '198.51.100.5, 10.0.0.1',
      'x-real-ip': '10.0.0.1',
    })
    expect(resolveClientIp(r)).toEqual({ ip: '203.0.113.10', source: 'cf' })
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

  it("returns 'unknown' when no proxy headers are set", () => {
    const r = makeRequest({})
    expect(resolveClientIp(r)).toEqual({ ip: 'unknown', source: 'unknown' })
  })

  it('treats empty header values as missing', () => {
    const r = makeRequest({ 'x-forwarded-for': '   ', 'x-real-ip': '198.51.100.99' })
    expect(resolveClientIp(r).ip).toBe('198.51.100.99')
  })

  it('getClientIp returns just the IP string', () => {
    const r = makeRequest({ 'cf-connecting-ip': '203.0.113.50' })
    expect(getClientIp(r)).toBe('203.0.113.50')
  })

  it('does not let a malicious x-forwarded-for override cf-connecting-ip', () => {
    const r = makeRequest({
      'cf-connecting-ip': '203.0.113.60',
      // Spoofed by client trying to forge an "internal" IP
      'x-forwarded-for': '10.0.0.1',
    })
    expect(resolveClientIp(r)).toEqual({ ip: '203.0.113.60', source: 'cf' })
  })
})
