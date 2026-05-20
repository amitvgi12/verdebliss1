import { describe, expect, it } from 'vitest'
import { BUSINESS_COMPLIANCE } from '@/constants/businessCompliance'
import { PRODUCT_COMPLIANCE } from '@/constants/productCompliance'

const PLACEHOLDER_MARKERS = /\b(DEMO|placeholder|Lorem|Demo House|\(Demo\))\b/i

describe('pre-launch gates', () => {
  it('blocks launch mode when compliance placeholders remain', () => {
    if (process.env.LAUNCH_MODE !== 'true') return

    expect(JSON.stringify(BUSINESS_COMPLIANCE)).not.toMatch(PLACEHOLDER_MARKERS)
    expect(JSON.stringify(PRODUCT_COMPLIANCE)).not.toMatch(PLACEHOLDER_MARKERS)
  })
})
