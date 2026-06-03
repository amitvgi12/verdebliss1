import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Payment sandbox smoke test (audit P1-2): end-to-end money-chain consistency.
 *
 * Exercises the full server-side checkout chain with a stateful in-memory
 * Supabase fake and a mocked Razorpay Orders API — no dev server, no network.
 * It asserts the single most launch-critical invariant the public PDP/schema
 * check cannot prove:
 *
 *   cart line price (DB catalogue, client price ignored)
 *     === normalized checkout total
 *     === Razorpay order amount (paise)
 *     === stored checkout-session amount_paise
 *     === Razorpay verified payment amount
 *     === stored order total (finalize_commerce_order RPC)
 *     === order-confirmation total returned to the client
 *
 * Plus the negative path: a payment whose amount was tampered with is rejected
 * before any order is persisted.
 */

vi.mock('@/lib/supabase-admin', () => ({
  createSupabaseAdmin: vi.fn(),
  hasSupabaseAdminEnv: vi.fn(() => true),
}))

import { createSupabaseAdmin, hasSupabaseAdminEnv } from '@/lib/supabase-admin'
import {
  amountInPaise,
  completeRazorpayCheckout,
  createCheckoutSession,
  createRazorpayOrder,
  normalizeCart,
  type CheckoutAddress,
} from '@/lib/commerce'

const PRODUCT = {
  id: '1',
  name: 'Bakuchiol Renewal Serum',
  price: 1495,
  stock: 100,
  active: true,
  ingredient: 'Bakuchiol',
  emoji: '🌿',
  bg_color: '#EBF0E9',
  image_url: '/images/products/serum.webp',
}

const ADDRESS: CheckoutAddress = {
  name: 'Kavya Menon',
  email: 'kavya@verdebliss.test',
  phone: '9876543210',
  line1: 'Flat 4B, Green Heights',
  line2: 'Kharadi',
  city: 'Pune',
  state: 'Maharashtra',
  pincode: '411014',
}

/**
 * Minimal stateful fake of the Supabase admin client covering exactly the query
 * chains the commerce money path uses:
 *   products:           .select().in()
 *   checkout_sessions:  .insert().select().single() | .select().eq().maybeSingle() | .update().eq()
 *   orders:             .select().eq().maybeSingle()
 *   rpc('finalize_commerce_order', …)
 */
function createStatefulSupabase() {
  const sessionsByOrderId = new Map<string, Record<string, unknown>>()
  const sessionsById = new Map<string, Record<string, unknown>>()
  const ordersByPaymentId = new Map<string, Record<string, unknown>>()
  let sessionSeq = 0
  let orderSeq = 0
  let capturedRpcParams: Record<string, unknown> | null = null

  function builder(table: string) {
    const op: { type: string | null; payload: Record<string, unknown> | null; filters: Record<string, string> } =
      { type: null, payload: null, filters: {} }

    function apply() {
      if (table === 'products') return { data: [PRODUCT], error: null }

      if (table === 'checkout_sessions') {
        if (op.type === 'insert') {
          const id = `sess_${++sessionSeq}`
          const row: Record<string, unknown> = {
            id,
            completed_order_id: null,
            payment_id: null,
            ...(op.payload ?? {}),
          }
          sessionsByOrderId.set(String(row.razorpay_order_id), row)
          sessionsById.set(id, row)
          return { data: row, error: null }
        }
        if (op.type === 'update') {
          const row = sessionsById.get(op.filters.id)
          if (row) Object.assign(row, op.payload ?? {})
          return { data: null, error: null }
        }
        return { data: sessionsByOrderId.get(op.filters.razorpay_order_id) ?? null, error: null }
      }

      if (table === 'orders') {
        return { data: ordersByPaymentId.get(op.filters.payment_id) ?? null, error: null }
      }

      return { data: null, error: null }
    }

    const resolveNow = () => Promise.resolve().then(apply)

    const api = {
      select() {
        if (!op.type) op.type = 'select'
        return api
      },
      insert(row: Record<string, unknown>) {
        op.type = 'insert'
        op.payload = row
        return api
      },
      update(patch: Record<string, unknown>) {
        op.type = 'update'
        op.payload = patch
        return api
      },
      eq(col: string, val: string) {
        op.filters[col] = val
        return api
      },
      in() {
        op.type = 'select'
        return resolveNow()
      },
      single: () => resolveNow(),
      maybeSingle: () => resolveNow(),
      // Supports `await supabase.from('checkout_sessions').update({…}).eq('id', …)`.
      then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
        resolveNow().then(resolve, reject),
    }
    return api
  }

  const client = {
    from: (table: string) => builder(table),
    rpc: async (_name: string, params: Record<string, unknown>) => {
      capturedRpcParams = params
      const orderId = `order_db_${++orderSeq}`
      ordersByPaymentId.set(String(params.p_payment_id), {
        id: orderId,
        points_earned: params.p_award_points ? params.p_points_to_earn : 0,
        subtotal: params.p_subtotal,
        shipping: params.p_shipping,
        total: params.p_total,
        payment_method: params.p_payment_method,
      })
      return {
        data: [{ order_id: orderId, points_awarded: params.p_award_points, idempotent: false }],
        error: null,
      }
    },
  }

  return { client, getRpcParams: () => capturedRpcParams }
}

let capturedRazorpayAmount: number | null = null

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('RAZORPAY_KEY_ID', 'rzp_test_money_chain')
  vi.stubEnv('RAZORPAY_KEY_SECRET', 'secret_money_chain')
  vi.mocked(hasSupabaseAdminEnv).mockReturnValue(true)
  capturedRazorpayAmount = null

  // Mock the Razorpay Orders API: echo the requested amount back as the order.
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, init?: { body?: string }) => {
      const body = init?.body ? (JSON.parse(init.body) as { amount: number; receipt: string }) : null
      capturedRazorpayAmount = body?.amount ?? null
      return {
        ok: true,
        status: 200,
        json: async () => ({
          id: 'order_rzp_money_chain',
          amount: body?.amount,
          currency: 'INR',
          receipt: body?.receipt,
        }),
      }
    })
  )
})

/** Runs cart → Razorpay order → checkout session, returning the chain context. */
async function buildSession(qty = 2) {
  const supabase = createStatefulSupabase()
  vi.mocked(createSupabaseAdmin).mockReturnValue(supabase.client as never)

  // Client deliberately sends a bogus price; it must be ignored in favour of DB.
  const { items, totals } = await normalizeCart([{ id: PRODUCT.id, qty, price: 1 }])

  const razorpayOrder = await createRazorpayOrder(totals.total, 'vb_receipt_test', {
    customer_email: ADDRESS.email,
    user_id: 'guest',
  })

  const session = await createCheckoutSession({
    userId: null,
    address: ADDRESS,
    items,
    totals,
    razorpayOrder,
    receipt: 'vb_receipt_test',
  })

  return { supabase, items, totals, razorpayOrder, session }
}

describe('checkout money-chain consistency (payment sandbox smoke)', () => {
  it('keeps a single amount consistent from cart through order confirmation', async () => {
    const { supabase, items, totals, razorpayOrder, session } = await buildSession(2)

    // Client-supplied price ignored — line price comes from the DB catalogue.
    expect(items[0].price).toBe(PRODUCT.price)
    expect(totals.subtotal).toBe(PRODUCT.price * 2) // 2990
    expect(totals.total).toBe(2990) // free shipping above ₹499

    const expectedPaise = amountInPaise(totals.total) // 299000

    // Razorpay order amount (what we asked Razorpay to charge).
    expect(capturedRazorpayAmount).toBe(expectedPaise)
    expect(razorpayOrder.amount).toBe(expectedPaise)

    // Stored checkout-session amount.
    expect(session.amount_paise).toBe(expectedPaise)

    // Razorpay verified payment carries the exact session amount.
    const completed = await completeRazorpayCheckout({
      razorpayOrderId: razorpayOrder.id,
      razorpayPaymentId: 'pay_money_chain',
      payment: {
        id: 'pay_money_chain',
        amount: session.amount_paise,
        currency: 'INR',
        order_id: razorpayOrder.id,
        status: 'captured',
        method: 'upi',
      },
    })

    // Stored order total (finalize_commerce_order RPC) and confirmation total.
    const rpc = supabase.getRpcParams()
    expect(rpc?.p_total).toBe(totals.total)
    expect(completed.totals.total).toBe(totals.total)
    expect(completed.orderId).toMatch(/^order_db_/)

    // The one invariant, stated explicitly across every layer.
    expect(amountInPaise(rpc?.p_total as number)).toBe(expectedPaise)
    expect(amountInPaise(completed.totals.total)).toBe(expectedPaise)
  })

  it('rejects a tampered payment amount before any order is persisted', async () => {
    const { supabase, razorpayOrder, session } = await buildSession(2)

    await expect(
      completeRazorpayCheckout({
        razorpayOrderId: razorpayOrder.id,
        razorpayPaymentId: 'pay_tampered',
        payment: {
          id: 'pay_tampered',
          amount: session.amount_paise - 100, // ₹1 less than charged
          currency: 'INR',
          order_id: razorpayOrder.id,
          status: 'captured',
          method: 'upi',
        },
      })
    ).rejects.toThrow('Payment amount or currency mismatch')

    // No order row was finalised.
    expect(supabase.getRpcParams()).toBeNull()
  })

  it('rejects a payment that belongs to a different Razorpay order', async () => {
    const { supabase, razorpayOrder, session } = await buildSession(1)

    await expect(
      completeRazorpayCheckout({
        razorpayOrderId: razorpayOrder.id,
        razorpayPaymentId: 'pay_foreign',
        payment: {
          id: 'pay_foreign',
          amount: session.amount_paise,
          currency: 'INR',
          order_id: 'order_some_other_session',
          status: 'captured',
          method: 'card',
        },
      })
    ).rejects.toThrow('Payment does not belong to this checkout session')

    expect(supabase.getRpcParams()).toBeNull()
  })
})
