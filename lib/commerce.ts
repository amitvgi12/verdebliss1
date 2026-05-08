import crypto from 'node:crypto'
import { PRODUCTS } from '@/constants/products'
import { getShippingCost } from '@/constants/shipping'
import type { Product } from '@/types'
import { createSupabaseAdmin, hasSupabaseAdminEnv } from '@/lib/supabase-admin'

export const COD_MAX_TOTAL = 500
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

const EMAIL_RE = /\S+@\S+\.\S+/
const PHONE_RE = /^\d{10}$/
const PIN_RE = /^\d{6}$/

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
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

async function fetchProductsByIds(ids: string[]): Promise<Product[]> {
  if (!hasSupabaseAdminEnv()) return PRODUCTS.filter((product) => ids.includes(product.id))

  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, ingredient, emoji, bg_color, image_url, stock')
      .in('id', ids)

    if (error || !data?.length) return PRODUCTS.filter((product) => ids.includes(product.id))
    return data as Product[]
  } catch {
    return PRODUCTS.filter((product) => ids.includes(product.id))
  }
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
  const pointsToEarn = Math.floor(subtotal / 10)

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

export async function createRazorpayOrder(
  amount: number,
  receipt: string,
  notes: Record<string, string>
) {
  const keyId = process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) throw new Error('Razorpay server credentials are not configured')

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
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
  return data as { id: string; amount: number; currency: string; receipt: string }
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
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
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
}) {
  if (!hasSupabaseAdminEnv()) {
    return {
      id: input.paymentId,
      pointsAwarded: false,
      storage: 'skipped_no_supabase_service_role' as const,
    }
  }

  const supabase = createSupabaseAdmin()
  const snapshot = toOrderSnapshot(input.items)
  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      user_id: input.userId,
      status: input.status,
      subtotal: input.totals.subtotal,
      shipping: input.totals.shipping,
      total: input.totals.total,
      points_earned: input.awardPoints ? input.totals.pointsToEarn : 0,
      items: snapshot,
      address: {
        ...input.address,
        payment_method: input.paymentMethod,
      },
      payment_id: input.paymentId,
      payment_order_id: input.paymentOrderId ?? null,
      payment_status: input.paymentStatus,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  if (order?.id) {
    await supabase.from('payment_events').insert({
      order_id: order.id,
      provider: input.paymentMethod === 'Cash on Delivery' ? 'cod' : 'razorpay',
      provider_order_id: input.paymentOrderId,
      provider_payment_id: input.paymentId,
      event_type: input.paymentStatus,
      amount: input.totals.total,
      currency: CURRENCY,
      verified: input.paymentStatus === 'paid',
      payload: {
        payment_method: input.paymentMethod,
        status: input.status,
      },
    })

    await supabase.from('order_items').insert(
      input.items.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.qty,
        unit_price: item.price,
        line_total: roundMoney(item.price * item.qty),
      }))
    )
  }

  let pointsAwarded = false
  if (input.awardPoints && input.userId && input.totals.pointsToEarn > 0 && order?.id) {
    await supabase.from('loyalty_ledger').insert({
      user_id: input.userId,
      order_id: order.id,
      event_type: 'order_payment_verified',
      points_delta: input.totals.pointsToEarn,
      reason: `Verified payment ${input.paymentId}`,
    })

    await supabase.rpc('apply_loyalty_points', {
      p_user_id: input.userId,
      p_points: input.totals.pointsToEarn,
    })
    pointsAwarded = true
  }

  return { id: order?.id ?? input.paymentId, pointsAwarded, storage: 'supabase' as const }
}
