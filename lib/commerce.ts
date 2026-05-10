import crypto from 'node:crypto'
import { PRODUCTS } from '@/constants/products'
import { getShippingCost } from '@/constants/shipping'
import { pointsForSubtotal } from '@/lib/loyalty'
import type { Product } from '@/types'
import { createSupabaseAdmin, hasSupabaseAdminEnv } from '@/lib/supabase-admin'

// COD cap raised from ₹500 (which collided with the ₹499 free-shipping
// threshold and made COD effectively unreachable for any cart of 2+ items)
// to a level usable by real customers.
export const COD_MAX_TOTAL = 2500
export const CURRENCY = 'INR'

export interface CheckoutAddress {
  name: string
  email: string
  phone: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
}

export interface IncomingCartItem {
  id: string
  qty: number
}

export interface NormalizedCartItem {
  id: string
  name: string
  price: number
  qty: number
  ingredient?: string
  emoji?: string
  bg_color?: string
  image_url?: string | null
}

export interface CartTotals {
  subtotal: number
  shipping: number
  total: number
  pointsToEarn: number
}

export interface CheckoutSession {
  id: string
  user_id: string | null
  status: 'pending' | 'completed' | 'expired' | 'failed' | string
  razorpay_order_id: string
  receipt: string
  subtotal: number
  shipping: number
  total: number
  amount_paise: number
  currency: string
  cart_snapshot: NormalizedCartItem[]
  address: CheckoutAddress
  expires_at: string | null
  completed_order_id: string | null
  payment_id: string | null
}

interface RazorpayOrder {
  id: string
  amount: number
  currency: string
  receipt: string
}

interface RazorpayPayment {
  id: string
  amount: number
  currency: string
  order_id: string
  status: string
  captured?: boolean
}

const EMAIL_RE = /\S+@\S+\.\S+/
const PHONE_RE = /^\d{10}$/
const PIN_RE = /^\d{6}$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

function requireSupabaseAdmin() {
  if (!hasSupabaseAdminEnv()) {
    throw new Error('Commerce persistence is not configured')
  }
  return createSupabaseAdmin()
}

function nowPlusMinutes(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString()
}

function parseNumber(value: unknown): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

export function validateAddress(raw: unknown): CheckoutAddress {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const address: CheckoutAddress = {
    name: asText(source.name),
    email: asText(source.email).toLowerCase(),
    phone: asText(source.phone).replace(/\s/g, ''),
    line1: asText(source.line1),
    line2: asText(source.line2),
    city: asText(source.city),
    state: asText(source.state),
    pincode: asText(source.pincode),
  }

  if (!address.name) throw new Error('Full name is required')
  if (!EMAIL_RE.test(address.email)) throw new Error('A valid email is required')
  if (!PHONE_RE.test(address.phone)) throw new Error('A valid 10-digit phone number is required')
  if (!address.line1) throw new Error('Address line 1 is required')
  if (!address.city) throw new Error('City is required')
  if (!address.state) throw new Error('State is required')
  if (!PIN_RE.test(address.pincode)) throw new Error('A valid 6-digit PIN code is required')

  return address
}

export function validateCartItems(raw: unknown): IncomingCartItem[] {
  if (!Array.isArray(raw) || raw.length === 0) throw new Error('Cart is empty')
  if (raw.length > 30) throw new Error('Cart has too many line items')

  const items = raw.map((item) => {
    const source = item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
    const id = asText(source.id)
    const qty = Number(source.qty)
    if (!id) throw new Error('Invalid product in cart')
    if (!Number.isInteger(qty) || qty < 1 || qty > 10) {
      throw new Error(`Invalid quantity for product ${id}`)
    }
    return { id, qty }
  })

  const merged = new Map<string, number>()
  for (const item of items) merged.set(item.id, (merged.get(item.id) ?? 0) + item.qty)
  return [...merged.entries()].map(([id, qty]) => ({ id, qty }))
}

async function queryProductsByIds(ids: string[]): Promise<Product[]> {
  if (!ids.length) return []
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, ingredient, emoji, bg_color, image_url, stock, active')
    .in('id', ids)

  if (error) throw error
  return ((data ?? []) as Product[]).filter((product) => product.active !== false)
}

async function fetchProductsByIds(ids: string[]): Promise<Product[]> {
  const staticProducts = PRODUCTS.filter((product) => ids.includes(product.id))
  if (!hasSupabaseAdminEnv()) return staticProducts

  const dbProducts: Product[] = []
  const found = new Set<string>()

  try {
    // Support both production UUID rows and static text IDs without sending
    // invalid text values to legacy UUID product tables.
    const uuidIds = ids.filter((id) => UUID_RE.test(id))
    const textIds = ids.filter((id) => !UUID_RE.test(id))

    if (uuidIds.length) {
      const products = await queryProductsByIds(uuidIds)
      for (const product of products) {
        dbProducts.push(product)
        found.add(product.id)
      }
    }

    const unresolvedTextIds = textIds.filter((id) => !found.has(id))
    if (unresolvedTextIds.length) {
      const products = await queryProductsByIds(unresolvedTextIds)
      for (const product of products) {
        dbProducts.push(product)
        found.add(product.id)
      }
    }
  } catch (error) {
    console.warn('[commerce] Product DB lookup fell back where possible:', error)
  }

  const merged = new Map<string, Product>()
  for (const product of staticProducts) merged.set(product.id, product)
  for (const product of dbProducts) merged.set(product.id, product)
  return [...merged.values()]
}

export async function normalizeCart(rawItems: unknown) {
  const incoming = validateCartItems(rawItems)
  const ids = incoming.map((item) => item.id)
  const products = await fetchProductsByIds(ids)
  const byId = new Map(products.map((product) => [product.id, product]))

  const items: NormalizedCartItem[] = incoming.map((item) => {
    const product = byId.get(item.id)
    if (!product) throw new Error(`Product not found: ${item.id}`)
    if (typeof product.stock === 'number' && product.stock < item.qty) {
      throw new Error(`${product.name} has only ${product.stock} item(s) left`)
    }
    return {
      id: product.id,
      name: product.name,
      price: Number(product.price),
      qty: item.qty,
      ingredient: product.ingredient,
      emoji: product.emoji,
      bg_color: product.bg_color,
      image_url: product.image_url ?? null,
    }
  })

  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.price * item.qty, 0))
  const shipping = roundMoney(getShippingCost(subtotal))
  const total = roundMoney(subtotal + shipping)
  const pointsToEarn = pointsForSubtotal(subtotal)

  return { items, totals: { subtotal, shipping, total, pointsToEarn } satisfies CartTotals }
}

export function toOrderSnapshot(items: NormalizedCartItem[]) {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    qty: item.qty,
    ingredient: item.ingredient,
    emoji: item.emoji,
    bg_color: item.bg_color,
    image_url: item.image_url,
  }))
}

export function amountInPaise(total: number): number {
  return Math.round(total * 100)
}

function razorpayAuthHeader(): string {
  const keyId = process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) throw new Error('Razorpay server credentials are not configured')
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`
}

export async function createRazorpayOrder(
  amount: number,
  receipt: string,
  notes: Record<string, string>
): Promise<RazorpayOrder> {
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: razorpayAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountInPaise(amount),
      currency: CURRENCY,
      receipt,
      notes,
      payment_capture: true,
    }),
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      data?.error?.description ?? `Razorpay order creation failed (${response.status})`
    throw new Error(message)
  }
  return data as RazorpayOrder
}

export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPayment> {
  const response = await fetch(
    `https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`,
    {
      method: 'GET',
      headers: { Authorization: razorpayAuthHeader() },
    }
  )
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const message = data?.error?.description ?? `Razorpay payment fetch failed (${response.status})`
    throw new Error(message)
  }
  return data as RazorpayPayment
}

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!secret) throw new Error('Razorpay secret is not configured')
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')

  if (expected.length !== signature.length) return false
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

export function verifyRazorpayWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) throw new Error('Razorpay webhook secret is not configured')
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  if (expected.length !== signature.length) return false
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

export async function createCheckoutSession(input: {
  userId: string | null
  address: CheckoutAddress
  items: NormalizedCartItem[]
  totals: CartTotals
  razorpayOrder: RazorpayOrder
  receipt: string
}): Promise<CheckoutSession> {
  const supabase = requireSupabaseAdmin()
  const amountPaise = amountInPaise(input.totals.total)

  // Checkout sessions are the trusted server-side cart snapshot. Verification
  // and webhooks must load this row instead of trusting browser-supplied items.
  const { data, error } = await supabase
    .from('checkout_sessions')
    .insert({
      user_id: input.userId,
      status: 'pending',
      razorpay_order_id: input.razorpayOrder.id,
      receipt: input.receipt,
      subtotal: input.totals.subtotal,
      shipping: input.totals.shipping,
      total: input.totals.total,
      amount_paise: amountPaise,
      currency: input.razorpayOrder.currency || CURRENCY,
      cart_snapshot: toOrderSnapshot(input.items),
      address: input.address,
      expires_at: nowPlusMinutes(30),
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return normaliseCheckoutSession(data)
}

function normaliseCheckoutSession(row: Record<string, unknown>): CheckoutSession {
  return {
    id: String(row.id),
    user_id: row.user_id ? String(row.user_id) : null,
    status: String(row.status ?? 'pending'),
    razorpay_order_id: String(row.razorpay_order_id),
    receipt: String(row.receipt ?? ''),
    subtotal: parseNumber(row.subtotal),
    shipping: parseNumber(row.shipping),
    total: parseNumber(row.total),
    amount_paise: Number(row.amount_paise ?? amountInPaise(parseNumber(row.total))),
    currency: String(row.currency ?? CURRENCY),
    cart_snapshot: Array.isArray(row.cart_snapshot)
      ? (row.cart_snapshot as NormalizedCartItem[])
      : [],
    address: (row.address ?? {}) as CheckoutAddress,
    expires_at: row.expires_at ? String(row.expires_at) : null,
    completed_order_id: row.completed_order_id ? String(row.completed_order_id) : null,
    payment_id: row.payment_id ? String(row.payment_id) : null,
  }
}

export async function getCheckoutSessionByRazorpayOrderId(
  razorpayOrderId: string
): Promise<CheckoutSession> {
  const supabase = requireSupabaseAdmin()
  const { data, error } = await supabase
    .from('checkout_sessions')
    .select('*')
    .eq('razorpay_order_id', razorpayOrderId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Checkout session not found for payment order')
  return normaliseCheckoutSession(data)
}

export interface PersistedOrderResult {
  id: string
  pointsAwarded: boolean
  storage: 'supabase'
  idempotent?: boolean
}

async function getExistingOrderByPaymentId(paymentId: string) {
  if (!paymentId || !hasSupabaseAdminEnv()) return null
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('orders')
    .select('id, points_earned, subtotal, shipping, total')
    .eq('payment_id', paymentId)
    .maybeSingle()
  if (error) return null
  return data as {
    id: string
    points_earned?: number
    subtotal?: number
    shipping?: number
    total?: number
  } | null
}

export async function persistOrder(input: {
  userId: string | null
  status: string
  paymentStatus: string
  paymentMethod: string
  paymentId: string
  paymentOrderId?: string | null
  address: CheckoutAddress
  items: NormalizedCartItem[]
  totals: CartTotals
  awardPoints: boolean
  rawPaymentPayload?: Record<string, unknown>
}): Promise<PersistedOrderResult> {
  const existing = await getExistingOrderByPaymentId(input.paymentId)
  if (existing) {
    return {
      id: existing.id,
      pointsAwarded: Boolean(existing.points_earned),
      storage: 'supabase',
      idempotent: true,
    }
  }

  const supabase = requireSupabaseAdmin()

  // Production order finalisation is delegated to one Postgres RPC. The order,
  // line items, stock movement, payment event, and loyalty ledger commit in a
  // single database transaction, so failed inventory or duplicate payment checks
  // cannot leave a partially-finalised order.
  const { data, error } = await supabase.rpc('finalize_commerce_order', {
    p_user_id: input.userId,
    p_status: input.status,
    p_payment_status: input.paymentStatus,
    p_payment_method: input.paymentMethod,
    p_payment_id: input.paymentId,
    p_payment_order_id: input.paymentOrderId ?? null,
    p_address: {
      ...input.address,
      payment_method: input.paymentMethod,
    },
    p_items: toOrderSnapshot(input.items),
    p_subtotal: input.totals.subtotal,
    p_shipping: input.totals.shipping,
    p_total: input.totals.total,
    p_points_to_earn: input.totals.pointsToEarn,
    p_award_points: input.awardPoints,
    p_raw_payment_payload: input.rawPaymentPayload ?? {
      payment_method: input.paymentMethod,
      status: input.status,
    },
  })

  if (error) {
    const duplicate = await getExistingOrderByPaymentId(input.paymentId)
    if (duplicate) {
      return {
        id: duplicate.id,
        pointsAwarded: Boolean(duplicate.points_earned),
        storage: 'supabase',
        idempotent: true,
      }
    }
    throw new Error(error.message)
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row?.order_id) throw new Error('Order finalisation did not return an order id')

  return {
    id: String(row.order_id),
    pointsAwarded: Boolean(row.points_awarded),
    storage: 'supabase',
    idempotent: Boolean(row.idempotent),
  }
}

export async function completeRazorpayCheckout(input: {
  razorpayOrderId: string
  razorpayPaymentId: string
  payment?: RazorpayPayment
  rawPaymentPayload?: Record<string, unknown>
}) {
  const session = await getCheckoutSessionByRazorpayOrderId(input.razorpayOrderId)

  if (session.completed_order_id) {
    return {
      orderId: session.completed_order_id,
      pointsAwarded: false,
      totals: {
        subtotal: session.subtotal,
        shipping: session.shipping,
        total: session.total,
        pointsToEarn: pointsForSubtotal(session.subtotal),
      },
      idempotent: true,
    }
  }

  if (session.expires_at && new Date(session.expires_at).getTime() < Date.now()) {
    throw new Error('Checkout session expired. Please start checkout again.')
  }

  const payment = input.payment ?? (await fetchRazorpayPayment(input.razorpayPaymentId))
  if (payment.order_id !== input.razorpayOrderId) {
    throw new Error('Payment does not belong to this checkout session')
  }
  if (payment.amount !== session.amount_paise || payment.currency !== session.currency) {
    throw new Error('Payment amount or currency mismatch')
  }
  if (!['captured', 'authorized'].includes(payment.status)) {
    throw new Error(`Payment is not complete. Current status: ${payment.status}`)
  }

  const totals: CartTotals = {
    subtotal: session.subtotal,
    shipping: session.shipping,
    total: session.total,
    pointsToEarn: pointsForSubtotal(session.subtotal),
  }

  const order = await persistOrder({
    userId: session.user_id,
    status: 'Processing',
    paymentStatus: 'paid',
    paymentMethod: 'Razorpay',
    paymentId: input.razorpayPaymentId,
    paymentOrderId: input.razorpayOrderId,
    address: session.address,
    items: session.cart_snapshot,
    totals,
    awardPoints: Boolean(session.user_id),
    rawPaymentPayload: input.rawPaymentPayload ?? { payment },
  })

  const supabase = requireSupabaseAdmin()
  await supabase
    .from('checkout_sessions')
    .update({
      status: 'completed',
      completed_order_id: order.id,
      payment_id: input.razorpayPaymentId,
    })
    .eq('id', session.id)

  return {
    orderId: order.id,
    pointsAwarded: order.pointsAwarded,
    totals,
    idempotent: Boolean(order.idempotent),
  }
}

export async function recordPaymentEvent(input: {
  providerOrderId?: string | null
  providerPaymentId?: string | null
  eventType: string
  amount?: number | null
  currency?: string | null
  verified: boolean
  payload: Record<string, unknown>
  orderId?: string | null
}) {
  if (!hasSupabaseAdminEnv()) return
  const supabase = createSupabaseAdmin()
  const { error } = await supabase.from('payment_events').insert({
    order_id: input.orderId ?? null,
    provider: 'razorpay',
    provider_order_id: input.providerOrderId ?? null,
    provider_payment_id: input.providerPaymentId ?? null,
    event_type: input.eventType,
    amount: input.amount ?? null,
    currency: input.currency ?? CURRENCY,
    verified: input.verified,
    payload: input.payload,
  })

  // Razorpay retries webhooks. Duplicate event rows are intentionally ignored;
  // any other persistence error is logged for operational investigation.
  if (error && error.code !== '23505') {
    console.warn('[commerce] Could not record payment event:', error.message)
  }
}

export async function recordReconciliationFailure(input: {
  eventType: string
  providerOrderId: string | null
  providerPaymentId: string | null
  payload: Record<string, unknown>
  failureReason: string
}) {
  if (!hasSupabaseAdminEnv()) return
  try {
    const supabase = createSupabaseAdmin()
    const { error } = await supabase.from('payment_reconciliation_failures').insert({
      provider: 'razorpay',
      event_type: input.eventType,
      provider_order_id: input.providerOrderId,
      provider_payment_id: input.providerPaymentId,
      payload: input.payload,
      failure_reason: input.failureReason,
      resolved: false,
      retry_count: 0,
    })
    if (error) {
      // We're already in a failure path; do not throw — preserve webhook 200.
      console.warn('[commerce] Could not persist reconciliation failure:', error.message)
    }
  } catch (err) {
    console.warn('[commerce] DLQ insert threw:', err instanceof Error ? err.message : String(err))
  }
}
