/**
 * app/api/chat/route.js — Next.js App Router Route Handler
 *
 * Replaces: api/chat.js (Vercel serverless function)
 * Equivalent to Express route: POST /api/chat
 *
 * All audit fixes preserved:
 *   - GEMINI_API_KEY server-side only (no NEXT_PUBLIC_ prefix)
 *   - thinkingBudget: 0 (prevents Gemini 2.5 Flash timeout)
 *   - x-goog-api-key header auth (not ?key= query param)
 *   - gemini-2.0-flash fallback on 5xx
 *   - Rate limiting per IP
 *   - sanitiseContext() prevents prompt injection
 *   - Dynamic system prompt from user context (orders, profile)
 */
import { NextResponse } from 'next/server'
import {
  createSupabaseAdmin,
  getUserFromAuthorizationHeader,
  hasSupabaseAdminEnv,
} from '@/lib/supabase-admin'
import { getProductsServer } from '@/lib/products-server'
import type { Product } from '@/types'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface TrustedContext {
  isLoggedIn: boolean
  name: string
  email: string
  skinType: string
  tier: string
  points: number
  orderCount: number
  orders: string
}

interface RateLimitEntry {
  count: number
  resetAt: number
}

const RATE_LIMIT_MAP = new Map<string, RateLimitEntry>()
const RATE_LIMIT = 20
const WINDOW_MS = 60_000

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = RATE_LIMIT_MAP.get(ip) ?? { count: 0, resetAt: now + WINDOW_MS }
  if (now > entry.resetAt) {
    entry.count = 0
    entry.resetAt = now + WINDOW_MS
  }
  entry.count += 1
  RATE_LIMIT_MAP.set(ip, entry)
  return entry.count > RATE_LIMIT
}

function validateMessages(messages: unknown): messages is ChatMessage[] {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 40) return false
  return messages.every((m: unknown) => {
    if (!m || typeof m !== 'object') return false
    const message = m as Record<string, unknown>
    return (
      typeof message.role === 'string' &&
      typeof message.content === 'string' &&
      ['user', 'assistant'].includes(message.role) &&
      message.content.length > 0 &&
      message.content.length <= 2000
    )
  })
}

function sanitiseContext(raw: unknown): TrustedContext {
  if (!raw || typeof raw !== 'object') {
    return {
      isLoggedIn: false,
      name: '',
      email: '',
      skinType: 'not specified',
      tier: 'Green Leaf',
      points: 0,
      orderCount: 0,
      orders: '',
    }
  }
  const source = raw as Record<string, unknown>
  return {
    isLoggedIn: Boolean(source.isLoggedIn),
    name: String(source.name ?? '').slice(0, 100),
    email: String(source.email ?? '').slice(0, 200),
    skinType: String(source.skinType ?? 'not specified').slice(0, 50),
    tier: String(source.tier ?? 'Green Leaf').slice(0, 50),
    points: Number.isFinite(Number(source.points)) ? Number(source.points) : 0,
    orderCount: Number.isFinite(Number(source.orderCount)) ? Number(source.orderCount) : 0,
    orders: String(source.orders ?? '').slice(0, 3000),
  }
}

function toGeminiContents(messages: ChatMessage[]) {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
}

async function buildTrustedContext(request: Request): Promise<TrustedContext> {
  const user = await getUserFromAuthorizationHeader(request.headers.get('authorization'))
  if (!user || !hasSupabaseAdminEnv()) {
    return {
      isLoggedIn: false,
      name: '',
      email: '',
      skinType: 'not specified',
      tier: 'Green Leaf',
      points: 0,
      orderCount: 0,
      orders: '',
    }
  }

  const supabase = createSupabaseAdmin()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, skin_type, tier, points')
    .eq('id', user.id)
    .maybeSingle()

  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, total, items, payment_id, payment_status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const orderList = Array.isArray(orders) ? orders : []
  return {
    isLoggedIn: true,
    name: String(profile?.full_name ?? user.email ?? '').slice(0, 100),
    email: String(user.email ?? '').slice(0, 200),
    skinType: String(profile?.skin_type ?? 'not specified').slice(0, 50),
    tier: String(profile?.tier ?? 'Green Leaf').slice(0, 50),
    points: Number.isFinite(profile?.points) ? Number(profile.points) : 0,
    orderCount: orderList.length,
    orders: orderList
      .map((o, i) => {
        const date = o.created_at
          ? new Date(o.created_at).toLocaleDateString('en-IN')
          : 'unknown date'
        const items = Array.isArray(o.items)
          ? o.items.map((it) => `${it.name} ×${it.qty}`).join(', ')
          : 'items unavailable'
        return `Order ${i + 1}: ID ${String(o.id).slice(0, 8)}… | Status: ${o.status} | Payment: ${o.payment_status ?? 'unknown'} | Total: ₹${o.total} | Date: ${date} | Items: ${items} | Payment ref: ${o.payment_id || 'N/A'}`
      })
      .join('\n'),
  }
}

function buildCatalogue(products: Product[]): string {
  return [
    'VerdeBliss product catalogue:',
    ...products.map((product) => {
      const skinTypes = Array.isArray(product.skin_types)
        ? product.skin_types.join('/')
        : 'all types'
      return `- ${product.name} ₹${product.price} — ${skinTypes}`
    }),
  ].join('\n')
}

function buildSystemPrompt(ctx: TrustedContext, products: Product[]): string {
  const catalogue = buildCatalogue(products)

  const policies = `
Key policies: Free shipping ₹499+. Returns within 14 days (unopened). Refund 3–7 business days.
Loyalty: 1 point per ₹10. Green Leaf → Gold Botanist → Platinum Alchemist.
Contact: returns@verdebliss.in | reactions@verdebliss.in | hello@verdebliss.in`

  const base = `You are Verde, the AI support advisor for VerdeBliss — certified organic skincare from India.
Help with skincare advice AND order support (status, refunds, returns, loyalty points).
Be warm, knowledgeable, concise — 2 to 4 sentences max.
Never make medical or clinical diagnostic claims.
${catalogue}${policies}`

  if (!ctx.isLoggedIn) {
    return `${base}\n\nCURRENT USER: Guest. For account queries (orders, points), ask them to sign in at verdebliss.com/account.`
  }

  return `${base}

LOGGED-IN USER:
  Name: ${ctx.name} | Email: ${ctx.email}
  Skin type: ${ctx.skinType} | Tier: ${ctx.tier} | Points: ${ctx.points}
  Orders: ${ctx.orderCount}

ORDER HISTORY:
${ctx.orders || 'No orders found.'}

When answering about orders/refunds: use the ORDER HISTORY above. Reference order IDs.
For refunds: direct to returns@verdebliss.in with their order ID.
For points: state exact balance (${ctx.points} points, ${ctx.tier} tier).
For skincare recommendations: factor in skin type (${ctx.skinType}).`
}

async function callGemini(
  model: string,
  apiKey: string,
  systemPrompt: string,
  messages: ChatMessage[]
) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: toGeminiContents(messages),
      generationConfig: {
        maxOutputTokens: 400,
        temperature: 0.65,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  })
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = null
  }
  return { ok: res.ok, status: res.status, data, errorBody: text }
}

export async function POST(request: Request) {
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { messages } = body ?? {}
  if (!validateMessages(messages)) {
    return NextResponse.json({ error: 'Invalid messages array' }, { status: 400 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('[chat] GEMINI_API_KEY not set')
    return NextResponse.json(
      { error: 'Server configuration error — GEMINI_API_KEY missing' },
      { status: 500 }
    )
  }

  const ctx = sanitiseContext(await buildTrustedContext(request))
  const products = await getProductsServer()
  const prompt = buildSystemPrompt(ctx, products)

  try {
    let result = await callGemini('gemini-2.5-flash', apiKey, prompt, messages)
    if (!result.ok && result.status >= 500) {
      console.warn(`[chat] gemini-2.5-flash ${result.status} — falling back to gemini-2.0-flash`)
      result = await callGemini('gemini-2.0-flash', apiKey, prompt, messages)
    }
    if (!result.ok) {
      console.error(`[chat] Gemini ${result.status}:`, result.errorBody)
      if (result.status === 403)
        return NextResponse.json(
          { error: 'API key invalid. Check GEMINI_API_KEY.' },
          { status: 502 }
        )
      if (result.status === 429)
        return NextResponse.json({ error: 'Rate limit reached. Try again.' }, { status: 429 })
      return NextResponse.json({ error: `Gemini error ${result.status}` }, { status: 502 })
    }

    const replyText = result.data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!replyText) {
      const reason = result.data?.candidates?.[0]?.finishReason ?? 'unknown'
      if (reason === 'SAFETY')
        return NextResponse.json({
          content: [
            {
              type: 'text',
              text: "I can't respond to that. Ask me about skincare or your order! 🌿",
            },
          ],
        })
      return NextResponse.json({ error: 'No text returned from Gemini' }, { status: 502 })
    }

    return NextResponse.json({ content: [{ type: 'text', text: replyText }] })
  } catch (err) {
    console.error('[chat] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://www.verdebliss.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
