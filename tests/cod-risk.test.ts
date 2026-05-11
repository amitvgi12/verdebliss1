import { afterEach, describe, expect, it, vi } from 'vitest'
import { COD_MAX_TOTAL } from '@/constants/checkout'
import { assessCodRisk } from '@/lib/cod-risk'
import type { CheckoutAddress, NormalizedCartItem } from '@/lib/commerce'

const address: CheckoutAddress = {
  name: 'Amit Kumar',
  email: 'amit@example.com',
  phone: '9876501234',
  line1: 'Flat 21 Green Park Road',
  city: 'Pune',
  state: 'Maharashtra',
  pincode: '411014',
}

const items: NormalizedCartItem[] = [
  { id: '1', name: 'Bakuchiol Renewal Serum', price: 250, qty: 1 },
]

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('COD risk assessment', () => {
  it('allows normal COD orders below the configured cap', () => {
    const result = assessCodRisk(
      address,
      { subtotal: 250, shipping: 79, total: 329, pointsToEarn: 25 },
      items
    )
    expect(result).toEqual({ decision: 'allow', allowed: true, flags: [] })
  })

  it('blocks COD orders above the configured cap', () => {
    const result = assessCodRisk(
      address,
      { subtotal: COD_MAX_TOTAL + 1, shipping: 0, total: COD_MAX_TOTAL + 1, pointsToEarn: 0 },
      items
    )
    expect(result.allowed).toBe(false)
    expect(result.flags).toContain('cod_total_above_limit')
  })

  it('blocks low-entropy phone numbers', () => {
    const result = assessCodRisk(
      { ...address, phone: '1111111111' },
      { subtotal: 250, shipping: 79, total: 329, pointsToEarn: 25 },
      items
    )
    expect(result.allowed).toBe(false)
    expect(result.flags).toContain('low_entropy_phone')
  })

  it('routes configured COD serviceability areas to manual review', () => {
    vi.stubEnv('COD_REVIEW_PIN_PREFIXES', '411')
    const result = assessCodRisk(
      address,
      { subtotal: 250, shipping: 79, total: 329, pointsToEarn: 25 },
      items
    )
    expect(result.allowed).toBe(true)
    expect(result.decision).toBe('manual_review')
    expect(result.flags).toContain('cod_serviceability_review')
  })
})
