import { describe, expect, it } from 'vitest'
import { BUSINESS_COMPLIANCE, validateBusinessCompliance } from '@/constants/businessCompliance'
import { PRODUCT_COMPLIANCE } from '@/constants/productCompliance'
import { auditProductDescription } from '@/lib/product-claims'
import { createSupabaseAdmin, hasSupabaseAdminEnv } from '@/lib/supabase-admin'

const PLACEHOLDER_MARKERS = /\b(DEMO|placeholder|Lorem|Demo House|\(Demo\))\b/i
const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
const PINCODE_RE = /^\d{6}$/
const KNOWN_SEED_REVIEW_COPY = [
  'without making my skin feel tight',
  'My dry skin handled this serum well',
  'Lightweight but nourishing',
  'Comfortable mineral SPF',
]
const LAUNCH_MIN_APPROVED_REVIEWS_PER_PRODUCT = Number(
  process.env.LAUNCH_MIN_APPROVED_REVIEWS_PER_PRODUCT ?? '1'
)
const HARD_CERTIFICATION_BADGES = [
  'Vegan',
  'Organic Certified',
  'Certified Organic',
  'Cruelty-Free',
]
const SUPABASE_PAGE_SIZE = 1000

type PagedResult<T> = {
  data: T[] | null
  error: { message: string } | null
}

type ProductReviewCoverageRow = {
  id: string | number
  name: string | null
}

type ApprovedReviewProductRow = {
  product_id: string | number | null
}

type ProductMrpRow = {
  price: unknown
  mrp: unknown
  price_valid_until: string | null
}

type ProductBadgeRow = {
  id: string | number
  name: string | null
  badges: unknown
}

type ProductClaimScanRow = ProductBadgeRow & {
  category: string | null
  description: string | null
  ingredient: string | null
}

type ReviewDisclosureRow = {
  id: string | number
  product_id: string | number | null
  review_source: string | null
  source_disclosure: string | null
}

type InvoiceSellerSnapshotRow = {
  id: string | number
  invoice_number: string | null
  seller_gstin: string | null
  seller_legal_name: string | null
  seller_state: string | null
  created_at: string | null
}

async function fetchAllRows<T>(
  fetchPage: (from: number, to: number) => PromiseLike<PagedResult<T>>
): Promise<T[]> {
  const rows: T[] = []

  for (let from = 0; ; from += SUPABASE_PAGE_SIZE) {
    const to = from + SUPABASE_PAGE_SIZE - 1
    const { data, error } = await fetchPage(from, to)
    if (error) throw new Error(error.message)

    const page = data ?? []
    rows.push(...page)
    if (page.length < SUPABASE_PAGE_SIZE) return rows
  }
}

describe('pre-launch gates', () => {
  it('blocks launch mode when compliance placeholders remain', () => {
    if (process.env.LAUNCH_MODE !== 'true') return

    const validation = validateBusinessCompliance(BUSINESS_COMPLIANCE, { strict: true })
    expect(validation.errors, validation.errors.join('\n')).toEqual([])
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

  it('blocks launch mode when active PDP review coverage is below the launch target', async () => {
    if (process.env.LAUNCH_MODE !== 'true') return

    expect(hasSupabaseAdminEnv(), 'Launch review coverage gate requires Supabase admin env').toBe(
      true
    )

    const supabase = createSupabaseAdmin()
    const [products, reviews] = await Promise.all([
      fetchAllRows<ProductReviewCoverageRow>((from, to) =>
        supabase.from('products').select('id, name').eq('active', true).range(from, to)
      ),
      fetchAllRows<ApprovedReviewProductRow>((from, to) =>
        supabase.from('reviews').select('product_id').eq('approved', true).range(from, to)
      ),
    ])

    const counts = new Map<string, number>()
    for (const review of reviews) {
      const productId = String(review.product_id)
      counts.set(productId, (counts.get(productId) ?? 0) + 1)
    }

    const undercovered = products
      .map((product) => ({
        id: String(product.id),
        name: String(product.name),
        approvedReviews: counts.get(String(product.id)) ?? 0,
      }))
      .filter((product) => product.approvedReviews < LAUNCH_MIN_APPROVED_REVIEWS_PER_PRODUCT)

    expect(
      undercovered,
      `Every active launch SKU needs at least ${LAUNCH_MIN_APPROVED_REVIEWS_PER_PRODUCT} approved review(s)`
    ).toEqual([])
  })

  it('blocks launch mode when sampling or PR reviews lack disclosure', async () => {
    if (process.env.LAUNCH_MODE !== 'true') return

    expect(hasSupabaseAdminEnv(), 'Launch review disclosure gate requires Supabase admin env').toBe(
      true
    )

    const supabase = createSupabaseAdmin()
    const reviews = await fetchAllRows<ReviewDisclosureRow>((from, to) =>
      supabase
        .from('reviews')
        .select('id, product_id, review_source, source_disclosure')
        .eq('approved', true)
        .in('review_source', ['sampling', 'pr_unit'])
        .range(from, to)
    )

    const undisclosed = reviews
      .filter((review) => !String(review.source_disclosure ?? '').trim())
      .map((review) => ({
        id: review.id,
        productId: review.product_id,
        reviewSource: review.review_source,
      }))

    expect(undisclosed, 'Sampling and PR-unit PDP reviews must disclose source').toEqual([])
  })

  it('blocks launch mode when production products contain unverifiable MRP data', async () => {
    if (process.env.LAUNCH_MODE !== 'true') return

    expect(hasSupabaseAdminEnv(), 'Launch pricing gate requires Supabase admin env').toBe(true)

    const supabase = createSupabaseAdmin()
    const products = await fetchAllRows<ProductMrpRow>((from, to) =>
      supabase
        .from('products')
        .select('id, name, price, mrp, price_valid_until')
        .eq('active', true)
        .not('mrp', 'is', null)
        .range(from, to)
    )

    const now = Date.now()
    const unverifiable = products.filter((product) => {
      const price = Number(product.price)
      const mrp = Number(product.mrp)
      const validUntil = Date.parse(String(product.price_valid_until ?? ''))
      return !Number.isFinite(price) || !Number.isFinite(mrp) || mrp <= price || validUntil <= now
    })

    expect(unverifiable).toEqual([])
  })

  it('blocks launch mode when DEMO_MODE is enabled in production', () => {
    if (process.env.LAUNCH_MODE !== 'true') return
    expect(
      process.env.NEXT_PUBLIC_DEMO_MODE,
      'NEXT_PUBLIC_DEMO_MODE must not be "true" in a production launch'
    ).not.toBe('true')
  })

  it('blocks launch mode when critical production env vars are missing', () => {
    if (process.env.LAUNCH_MODE !== 'true') return
    const required = [
      'RAZORPAY_KEY_ID',
      'RAZORPAY_KEY_SECRET',
      'RAZORPAY_WEBHOOK_SECRET',
      'SUPABASE_SERVICE_ROLE_KEY',
    ]
    const missing = required.filter((k) => !process.env[k])
    expect(missing, `Missing required production env vars: ${missing.join(', ')}`).toHaveLength(0)
  })

  it('blocks launch mode when production product badges use hard certification claims', async () => {
    if (process.env.LAUNCH_MODE !== 'true') return

    expect(hasSupabaseAdminEnv(), 'Launch claim gate requires Supabase admin env').toBe(true)

    const supabase = createSupabaseAdmin()
    const products = await fetchAllRows<ProductBadgeRow>((from, to) =>
      supabase.from('products').select('id, name, badges').eq('active', true).range(from, to)
    )

    const hardClaims = products.flatMap((product) => {
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

  it('blocks launch mode when active production products fail the cosmetic claim scanner', async () => {
    if (process.env.LAUNCH_MODE !== 'true') return

    expect(hasSupabaseAdminEnv(), 'Launch product claim scanner requires Supabase admin env').toBe(
      true
    )

    const supabase = createSupabaseAdmin()
    const products = await fetchAllRows<ProductClaimScanRow>((from, to) =>
      supabase
        .from('products')
        .select('id, name, category, description, ingredient, badges')
        .eq('active', true)
        .range(from, to)
    )

    const violations = products.flatMap((product) => {
      const fields: Array<[string, string]> = [
        ['name', String(product.name ?? '')],
        ['category', String(product.category ?? '')],
        ['description', String(product.description ?? '')],
        ['ingredient', String(product.ingredient ?? '')],
        ['badges', Array.isArray(product.badges) ? product.badges.join(' ') : ''],
      ]

      return fields.flatMap(([field, value]) =>
        auditProductDescription(value).violations.map((violation) => ({
          id: product.id,
          name: product.name,
          field,
          label: violation.label,
          suggestion: violation.suggestion,
        }))
      )
    })

    expect(violations).toEqual([])
  })

  it('blocks launch mode when production seller_config is missing or incomplete', async () => {
    if (process.env.LAUNCH_MODE !== 'true') return

    expect(hasSupabaseAdminEnv(), 'Launch seller_config gate requires Supabase admin env').toBe(
      true
    )

    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('seller_config')
      .select('id, legal_name, gstin, state_name, address_line1, address_city, address_pincode')
      .eq('id', 1)
      .maybeSingle()

    if (error) throw new Error(error.message)
    expect(data, 'seller_config singleton row id=1 is required').toBeTruthy()
    if (!data) return

    const missing = [
      'legal_name',
      'gstin',
      'state_name',
      'address_line1',
      'address_city',
      'address_pincode',
    ].filter((field) => !String(data[field as keyof typeof data] ?? '').trim())

    expect(missing).toEqual([])
    expect(data.gstin).toMatch(GSTIN_RE)
    expect(data.address_pincode).toMatch(PINCODE_RE)
    expect(JSON.stringify(data)).not.toMatch(PLACEHOLDER_MARKERS)
  })

  it('blocks launch mode when production invoices are not snapshotted from seller_config', async () => {
    if (process.env.LAUNCH_MODE !== 'true') return

    expect(hasSupabaseAdminEnv(), 'Launch invoice seller gate requires Supabase admin env').toBe(
      true
    )

    const supabase = createSupabaseAdmin()
    const { data: sellerConfig, error: sellerError } = await supabase
      .from('seller_config')
      .select('legal_name, gstin, state_name, updated_at')
      .eq('id', 1)
      .maybeSingle()

    if (sellerError) throw new Error(sellerError.message)
    expect(sellerConfig, 'seller_config singleton row id=1 is required').toBeTruthy()
    if (!sellerConfig) return

    const invoices = await fetchAllRows<InvoiceSellerSnapshotRow>((from, to) =>
      supabase
        .from('invoices')
        .select(
          'id, invoice_number, seller_gstin, seller_legal_name, seller_state, created_at, status'
        )
        .neq('status', 'cancelled')
        .range(from, to)
    )

    const missingSnapshots = invoices
      .filter(
        (invoice) =>
          !String(invoice.seller_gstin ?? '').trim() ||
          !String(invoice.seller_legal_name ?? '').trim() ||
          !String(invoice.seller_state ?? '').trim()
      )
      .map((invoice) => ({ id: invoice.id, invoiceNumber: invoice.invoice_number }))

    expect(missingSnapshots, 'Invoices must snapshot seller identity from seller_config').toEqual(
      []
    )

    const sellerUpdatedAt = Date.parse(String(sellerConfig.updated_at ?? ''))
    const currentSellerMismatches = invoices
      .filter((invoice) => Date.parse(String(invoice.created_at ?? '')) >= sellerUpdatedAt)
      .filter(
        (invoice) =>
          String(invoice.seller_gstin ?? '').trim() !== String(sellerConfig.gstin).trim() ||
          String(invoice.seller_legal_name ?? '').trim() !==
            String(sellerConfig.legal_name).trim() ||
          String(invoice.seller_state ?? '').trim() !== String(sellerConfig.state_name).trim()
      )
      .map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        sellerGstin: invoice.seller_gstin,
        sellerLegalName: invoice.seller_legal_name,
        sellerState: invoice.seller_state,
      }))

    expect(
      currentSellerMismatches,
      'Invoices created after the latest seller_config update must match seller_config'
    ).toEqual([])
  })
})
