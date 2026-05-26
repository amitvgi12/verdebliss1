/**
 * GST supply-type determination and tax-line computation.
 *
 * Mirrors the logic in the `create_invoice_for_order` Postgres trigger so the
 * same rules can be unit-tested in CI without a live database connection.
 *
 * Indian GST rule:
 *   seller state === buyer state  →  intra-state  →  CGST + SGST (split equally)
 *   seller state !== buyer state  →  inter-state  →  IGST (single line)
 *
 * Rate: 18 % under HSN chapter 33 (cosmetics / personal care preparations).
 */

export const GST_RATE_COSMETICS = 18

export type SupplyType = 'intra_state' | 'inter_state'

export interface TaxLine {
  type: 'CGST' | 'SGST' | 'IGST'
  rate: number
  amount: number
}

/**
 * Returns 'intra_state' when seller and buyer are in the same GST state,
 * 'inter_state' otherwise.  Comparison is case- and whitespace-insensitive.
 *
 * Throws if sellerState is empty — the trigger enforces the same constraint,
 * so the TypeScript layer should too.
 */
export function determineSupplyType(sellerState: string, buyerState: string): SupplyType {
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

/**
 * Computes GST tax lines from a tax-inclusive subtotal.
 *
 * Back-calculation formula (prices on storefront are tax-inclusive):
 *   tax = subtotal × rate / (100 + rate)
 *
 * Intra-state: CGST = SGST = tax / 2  (rounding remainder goes to SGST)
 * Inter-state: IGST = tax
 */
export function computeGstLines(
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

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
