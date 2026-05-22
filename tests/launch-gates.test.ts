import { describe, expect, it } from 'vitest'
import { BUSINESS_COMPLIANCE } from '@/constants/businessCompliance'
import { PRODUCT_COMPLIANCE } from '@/constants/productCompliance'
import { createSupabaseAdmin, hasSupabaseAdminEnv } from '@/lib/supabase-admin'

const PLACEHOLDER_MARKERS = /\b(DEMO|placeholder|Lorem|Demo House|\(Demo\))\b/i
const KNOWN_SEED_REVIEW_COPY = [
  'without making my skin feel tight',
  'My dry skin handled this serum well',
  'Lightweight but nourishing',
  'Comfortable mineral SPF',
]
const HARD_CERTIFICATION_BADGES = [
  'Vegan',
  'Organic Certified',
  'Certified Organic',
  'Cruelty-Free',
]

describe('pre-launch gates', () => {
  it('blocks launch mode when compliance placeholders remain', () => {
    if (process.env.LAUNCH_MODE !== 'true') return

    expect(JSON.stringify(BUSINESS_COMPLIANCE)).not.toMatch(PLACEHOLDER_MARKERS)
    expect(JSON.stringify(PRODUCT_COMPLIANCE)).not.toMatch(PLACEHOLDER_MARKERS)
  })

  it('blocks launch mode when known seeded review copy remains in production data', async () => {
    if (process.env.LAUNCH_MODE !== 'true') return

    expect(hasSupabaseAdminEnv(), 'Launch review gate requires Supabase admin env').toBe(true)

    const supabase = createSupabaseAdmin()
    const filters = KNOWN_SEED_REVIEW_COPY.map((copy) => `body.ilike.%${copy}%`).join(',')
    const { count, error } = await supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .or(filters)

    if (error) throw new Error(error.message)
    expect(count ?? 0).toBe(0)
  })

  it('blocks launch mode when production products contain unverifiable MRP data', async () => {
    if (process.env.LAUNCH_MODE !== 'true') return

    expect(hasSupabaseAdminEnv(), 'Launch pricing gate requires Supabase admin env').toBe(true)

    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, mrp, price_valid_until')
      .eq('active', true)
      .not('mrp', 'is', null)

    if (error) throw new Error(error.message)

    const now = Date.now()
    const unverifiable = (data ?? []).filter((product) => {
      const price = Number(product.price)
      const mrp = Number(product.mrp)
      const validUntil = Date.parse(String(product.price_valid_until ?? ''))
      return !Number.isFinite(price) || !Number.isFinite(mrp) || mrp <= price || validUntil <= now
    })

    expect(unverifiable).toEqual([])
  })

  it('blocks launch mode when production product badges use hard certification claims', async () => {
    if (process.env.LAUNCH_MODE !== 'true') return

    expect(hasSupabaseAdminEnv(), 'Launch claim gate requires Supabase admin env').toBe(true)

    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('products')
      .select('id, name, badges')
      .eq('active', true)

    if (error) throw new Error(error.message)

    const hardClaims = (data ?? []).flatMap((product) => {
      const badges = Array.isArray(product.badges) ? product.badges : []
      return badges
        .filter((badge) =>
          HARD_CERTIFICATION_BADGES.some(
            (claim) => String(badge).trim().toLowerCase() === claim.toLowerCase()
          )
        )
        .map((badge) => ({ id: product.id, name: product.name, badge }))
    })

    expect(hardClaims).toEqual([])
  })
})
