import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'
import { assessCodVelocity, mergeCodAssessments, type CodRiskAssessment } from '@/lib/cod-risk'
import { PRODUCTS, PRODUCT_SEARCH_INDEX } from '@/constants/products'

const root = path.resolve(__dirname, '..')
const readRepoFile = (rel: string) => readFileSync(path.join(root, rel), 'utf8')

afterEach(() => {
  vi.unstubAllEnvs()
})

// VB-07 — COD velocity / RTO abuse controls.
describe('COD velocity controls', () => {
  it('allows a first-time COD buyer', () => {
    expect(assessCodVelocity({ recent_orders: 0, open_orders: 0, failed_orders: 0 })).toMatchObject({
      decision: 'allow',
      allowed: true,
    })
  })

  it('blocks outright once prior deliveries have failed', () => {
    const result = assessCodVelocity({ recent_orders: 4, open_orders: 1, failed_orders: 2 })
    expect(result.allowed).toBe(false)
    expect(result.decision).toBe('block')
    expect(result.flags).toContain('cod_prior_failed_deliveries')
  })

  it('routes too many concurrently open COD orders to manual review, not a block', () => {
    const result = assessCodVelocity({ recent_orders: 3, open_orders: 3, failed_orders: 0 })
    expect(result.decision).toBe('manual_review')
    expect(result.allowed).toBe(true)
    expect(result.flags).toContain('cod_open_order_limit')
  })

  it('flags high recent volume even when nothing is still open', () => {
    const result = assessCodVelocity({ recent_orders: 6, open_orders: 0, failed_orders: 0 })
    expect(result.flags).toContain('cod_high_recent_volume')
  })

  it('honours env-tuned thresholds so ops can tighten without a deploy', () => {
    vi.stubEnv('COD_MAX_FAILED_ORDERS', '1')
    expect(assessCodVelocity({ recent_orders: 1, open_orders: 0, failed_orders: 1 }).allowed).toBe(
      false
    )
  })

  it('ignores non-positive threshold overrides rather than blocking everyone', () => {
    vi.stubEnv('COD_MAX_FAILED_ORDERS', '0')
    // A 0 override must fall back to the default, otherwise `failed >= 0` would
    // block every single COD order including first-time buyers.
    expect(assessCodVelocity({ recent_orders: 0, open_orders: 0, failed_orders: 0 }).allowed).toBe(
      true
    )
  })
})

describe('COD assessment merge', () => {
  const allow: CodRiskAssessment = { decision: 'allow', allowed: true, flags: [] }

  it('keeps a base block regardless of clean history', () => {
    const base: CodRiskAssessment = {
      decision: 'block',
      allowed: false,
      reason: 'over cap',
      flags: ['cod_total_above_limit'],
    }
    expect(mergeCodAssessments(base, allow)).toBe(base)
  })

  it('lets a velocity block override an otherwise-fine order', () => {
    const velocity: CodRiskAssessment = {
      decision: 'block',
      allowed: false,
      flags: ['cod_prior_failed_deliveries'],
    }
    expect(mergeCodAssessments(allow, velocity).allowed).toBe(false)
  })

  it('takes the stricter decision and unions the flags', () => {
    const base: CodRiskAssessment = {
      decision: 'manual_review',
      allowed: true,
      flags: ['short_address_line'],
    }
    const velocity: CodRiskAssessment = {
      decision: 'allow',
      allowed: true,
      flags: ['cod_high_recent_volume'],
    }
    const merged = mergeCodAssessments(base, velocity)
    expect(merged.decision).toBe('manual_review')
    expect(merged.flags).toEqual(
      expect.arrayContaining(['short_address_line', 'cod_high_recent_volume'])
    )
  })

  it('does not duplicate a flag both assessments raised', () => {
    const withFlag: CodRiskAssessment = {
      decision: 'manual_review',
      allowed: true,
      flags: ['cod_serviceability_review'],
    }
    expect(mergeCodAssessments(withFlag, { ...withFlag }).flags).toEqual([
      'cod_serviceability_review',
    ])
  })
})

// VB-04 — refunds must have no client INSERT path. The API route writes with
// the service role after checking order ownership; a policy that only checks
// `auth.uid() = user_id` lets a customer open a refund on someone else's order.
describe('refunds write path (VB-04)', () => {
  const schema = readRepoFile('supabase/schema.sql')

  it('declares no INSERT policy on refunds', () => {
    expect(schema).not.toMatch(/create policy[^;]*on public\.refunds\s+for insert/i)
  })

  it('does not grant INSERT on refunds to anon or authenticated', () => {
    const grant = schema
      .split('\n')
      .find((line) => /^grant .*on public\.refunds to .*(anon|authenticated)/i.test(line))
    expect(grant).toBeDefined()
    expect(grant).not.toMatch(/insert/i)
  })

  it('keeps the client from inserting refunds directly', () => {
    const client = readRepoFile('app/refund/RefundClient.tsx')
    expect(client).not.toMatch(/from\(['"]refunds['"]\)\s*\.\s*insert/)
  })
})

// VB-11 — the ledger insert suppresses conflicts, so the balance update must be
// gated on it actually inserting or profiles.points drifts above the ledger.
describe('loyalty credit is gated on the ledger insert (VB-11)', () => {
  it('checks the ledger row count before touching profiles.points', () => {
    const schema = readRepoFile('supabase/schema.sql')
    const fn = schema.slice(schema.indexOf('function public.finalize_commerce_order'))
    const ledgerIdx = fn.indexOf('insert into public.loyalty_ledger')
    const guardIdx = fn.indexOf('get diagnostics v_ledger_rows = row_count', ledgerIdx)
    const pointsIdx = fn.indexOf('set points = points + v_points', ledgerIdx)

    expect(ledgerIdx).toBeGreaterThan(-1)
    expect(guardIdx).toBeGreaterThan(ledgerIdx)
    expect(pointsIdx).toBeGreaterThan(guardIdx)
  })
})

// VB-08 — the slug is a public claim. The product copy says SPF evidence is
// still in review, so the URL must not assert a rating.
describe('SPF claim is not asserted in the URL (VB-08)', () => {
  it('no product slug claims an SPF rating', () => {
    const offenders = PRODUCTS.filter((p) => /spf-?\d+/i.test(p.slug ?? ''))
    expect(offenders).toEqual([])
  })

  it('redirects the retired slug so the indexed claim is replaced', () => {
    const config = readRepoFile('next.config.ts')
    expect(config).toContain('/products/botanical-spf-50-shield')
    expect(config).toContain('/products/botanical-mineral-sun-shield')
    expect(config).toMatch(/permanent:\s*true/)
  })
})

// VB-16 — static shells always carry price 0, so shipping the field put a
// misleading value in every page payload.
describe('nav search index carries no price (VB-16)', () => {
  it('omits price from every entry', () => {
    expect(PRODUCT_SEARCH_INDEX.length).toBeGreaterThan(0)
    for (const entry of PRODUCT_SEARCH_INDEX) {
      expect(entry).not.toHaveProperty('price')
    }
  })

  it('does not render a price in the search palette', () => {
    expect(readRepoFile('components/features/search/SearchBar.tsx')).not.toContain('p.price')
  })
})
