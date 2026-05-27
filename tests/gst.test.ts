import { describe, it, expect } from 'vitest'

const GST_RATE_COSMETICS = 18

type SupplyType = 'intra_state' | 'inter_state'

interface TaxLine {
  type: 'CGST' | 'SGST' | 'IGST'
  rate: number
  amount: number
}

function determineSupplyType(sellerState: string, buyerState: string): SupplyType {
  if (!sellerState.trim()) {
    throw new Error(
      'Seller state is required to determine GST supply type. ' +
        'Populate seller_config.state_name before accepting orders.'
    )
  }
  return sellerState.trim().toLowerCase() === buyerState.trim().toLowerCase()
    ? 'intra_state'
    : 'inter_state'
}

function computeGstLines(
  subtotalInclusive: number,
  taxRatePct: number,
  supplyType: SupplyType
): TaxLine[] {
  const taxAmount = round2((subtotalInclusive * taxRatePct) / (100 + taxRatePct))

  if (supplyType === 'intra_state') {
    const half = round2(taxAmount / 2)
    return [
      { type: 'CGST', rate: taxRatePct / 2, amount: half },
      { type: 'SGST', rate: taxRatePct / 2, amount: round2(taxAmount - half) },
    ]
  }

  return [{ type: 'IGST', rate: taxRatePct, amount: taxAmount }]
}

// ── Supply type determination ─────────────────────────────────────────────────

describe('determineSupplyType', () => {
  // ── Core regression cases (the bug this fixes) ────────────────────────

  it('Uttarakhand seller + Uttarakhand buyer → intra_state (CGST/SGST)', () => {
    expect(determineSupplyType('Uttarakhand', 'Uttarakhand')).toBe('intra_state')
  })

  it('Uttarakhand seller + Delhi buyer → inter_state (IGST)', () => {
    expect(determineSupplyType('Uttarakhand', 'Delhi')).toBe('inter_state')
  })

  it('Uttarakhand seller + Maharashtra buyer → inter_state (was wrongly intra_state before fix)', () => {
    // This is the regression: the old hard-coded Maharashtra seller state made
    // MH orders intra-state even though the actual seller is in Uttarakhand.
    expect(determineSupplyType('Uttarakhand', 'Maharashtra')).toBe('inter_state')
  })

  // ── Other inter-state combinations ───────────────────────────────────

  it('Uttarakhand seller + Karnataka buyer → inter_state', () => {
    expect(determineSupplyType('Uttarakhand', 'Karnataka')).toBe('inter_state')
  })

  it('Uttarakhand seller + Tamil Nadu buyer → inter_state', () => {
    expect(determineSupplyType('Uttarakhand', 'Tamil Nadu')).toBe('inter_state')
  })

  // ── Case and whitespace insensitivity ────────────────────────────────

  it('is case-insensitive (UTTARAKHAND === uttarakhand)', () => {
    expect(determineSupplyType('UTTARAKHAND', 'uttarakhand')).toBe('intra_state')
  })

  it('trims leading/trailing whitespace before comparing', () => {
    expect(determineSupplyType('  Uttarakhand  ', '  Uttarakhand  ')).toBe('intra_state')
    expect(determineSupplyType('Uttarakhand', '  Delhi  ')).toBe('inter_state')
  })

  // ── Fail-closed: missing seller state ────────────────────────────────

  it('throws when seller state is an empty string', () => {
    expect(() => determineSupplyType('', 'Uttarakhand')).toThrow('Seller state is required')
  })

  it('throws when seller state is only whitespace', () => {
    expect(() => determineSupplyType('   ', 'Delhi')).toThrow('Seller state is required')
  })

  it('does NOT throw when buyer state is empty (treated as inter_state)', () => {
    // An unknown buyer state defaults to inter-state (conservative: IGST).
    expect(determineSupplyType('Uttarakhand', '')).toBe('inter_state')
  })
})

// ── Tax line computation ──────────────────────────────────────────────────────

describe('computeGstLines', () => {
  // ── Intra-state → CGST + SGST ────────────────────────────────────────

  it('intra_state produces two lines: CGST and SGST', () => {
    const lines = computeGstLines(1000, GST_RATE_COSMETICS, 'intra_state')
    expect(lines).toHaveLength(2)
    expect(lines[0].type).toBe('CGST')
    expect(lines[1].type).toBe('SGST')
  })

  it('CGST and SGST each carry half the rate (9% each for 18% GST)', () => {
    const lines = computeGstLines(1000, GST_RATE_COSMETICS, 'intra_state')
    expect(lines[0].rate).toBe(9)
    expect(lines[1].rate).toBe(9)
  })

  it('CGST + SGST amounts sum to the total back-calculated tax', () => {
    const subtotal = 849
    const lines = computeGstLines(subtotal, GST_RATE_COSMETICS, 'intra_state')
    const expectedTax = round2((subtotal * GST_RATE_COSMETICS) / (100 + GST_RATE_COSMETICS))
    expect(round2(lines[0].amount + lines[1].amount)).toBe(expectedTax)
  })

  it('CGST and SGST amounts are equal (or differ by at most ₹0.01 due to rounding)', () => {
    const lines = computeGstLines(1000, GST_RATE_COSMETICS, 'intra_state')
    expect(Math.abs(lines[0].amount - lines[1].amount)).toBeLessThanOrEqual(0.01)
  })

  // ── Inter-state → IGST ───────────────────────────────────────────────

  it('inter_state produces one line: IGST', () => {
    const lines = computeGstLines(1000, GST_RATE_COSMETICS, 'inter_state')
    expect(lines).toHaveLength(1)
    expect(lines[0].type).toBe('IGST')
  })

  it('IGST carries the full rate (18%)', () => {
    const lines = computeGstLines(1000, GST_RATE_COSMETICS, 'inter_state')
    expect(lines[0].rate).toBe(18)
  })

  it('IGST amount equals back-calculated tax from inclusive subtotal', () => {
    const subtotal = 499
    const lines = computeGstLines(subtotal, GST_RATE_COSMETICS, 'inter_state')
    const expected = round2((subtotal * GST_RATE_COSMETICS) / (100 + GST_RATE_COSMETICS))
    expect(lines[0].amount).toBe(expected)
  })

  // ── Known amounts ────────────────────────────────────────────────────

  it('₹118 inclusive subtotal → ₹18 total GST (exact whole-number case)', () => {
    const cgstSgst = computeGstLines(118, GST_RATE_COSMETICS, 'intra_state')
    expect(round2(cgstSgst[0].amount + cgstSgst[1].amount)).toBe(18)

    const igst = computeGstLines(118, GST_RATE_COSMETICS, 'inter_state')
    expect(igst[0].amount).toBe(18)
  })

  it('₹590 inclusive subtotal → ₹90 total GST', () => {
    const igst = computeGstLines(590, GST_RATE_COSMETICS, 'inter_state')
    expect(igst[0].amount).toBe(90)
  })

  // ── End-to-end: Uttarakhand seller scenarios ─────────────────────────

  it('Uttarakhand buyer order: supply type is intra_state → CGST+SGST lines', () => {
    const supply = determineSupplyType('Uttarakhand', 'Uttarakhand')
    const lines = computeGstLines(590, GST_RATE_COSMETICS, supply)
    expect(supply).toBe('intra_state')
    expect(lines.map((l) => l.type)).toEqual(['CGST', 'SGST'])
  })

  it('Delhi buyer order: supply type is inter_state → IGST line', () => {
    const supply = determineSupplyType('Uttarakhand', 'Delhi')
    const lines = computeGstLines(590, GST_RATE_COSMETICS, supply)
    expect(supply).toBe('inter_state')
    expect(lines.map((l) => l.type)).toEqual(['IGST'])
  })

  it('Maharashtra buyer order: supply type is inter_state → IGST line (regression)', () => {
    const supply = determineSupplyType('Uttarakhand', 'Maharashtra')
    const lines = computeGstLines(590, GST_RATE_COSMETICS, supply)
    expect(supply).toBe('inter_state')
    expect(lines.map((l) => l.type)).toEqual(['IGST'])
  })
})

// ── Fail-closed: missing seller state propagates through full pipeline ────────

describe('fail-closed behaviour', () => {
  it('empty seller state throws before any tax is computed', () => {
    expect(() => {
      const supply = determineSupplyType('', 'Uttarakhand')
      computeGstLines(1000, GST_RATE_COSMETICS, supply as SupplyType)
    }).toThrow('Seller state is required')
  })

  it('whitespace-only seller state throws before any tax is computed', () => {
    expect(() => {
      determineSupplyType('  ', 'Delhi')
    }).toThrow('Seller state is required')
  })
})

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
