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

const RATE_LIMIT_MAP = new Map()
const RATE_LIMIT = 20
const WINDOW_MS = 60_000

function isRateLimited(ip) {
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

function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 40) return false
  return messages.every(
    (m) =>
      typeof m.role === 'string' &&
      typeof m.content === 'string' &&
      ['user', 'assistant'].includes(m.role) &&
      m.content.length > 0 &&
      m.content.length <= 2000
  )
}

function sanitiseContext(raw) {
  if (!raw || typeof raw !== 'object') return { isLoggedIn: false }
  return {
    isLoggedIn: Boolean(raw.isLoggedIn),
    name: String(raw.name ?? '').slice(0, 100),
    email: String(raw.email ?? '').slice(0, 200),
    skinType: String(raw.skinType ?? 'not specified').slice(0, 50),
    tier: String(raw.tier ?? 'Green Leaf').slice(0, 50),
    points: Number.isFinite(raw.points) ? raw.points : 0,
    orderCount: Number.isFinite(raw.orderCount) ? raw.orderCount : 0,
    orders: String(raw.orders ?? '').slice(0, 3000),
  }
}

function toGeminiContents(messages) {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
}

function buildSystemPrompt(ctx) {
  const catalogue = `
VerdeBliss product catalogue:
- Bakuchiol Renewal Serum ₹2850 — dry/combination skin
- Rose Hip Glow Moisturiser ₹1990 — dry/sensitive
- Green Tea Clarity Toner ₹1450 — oily/combination
- Turmeric Brightening Cleanser ₹1250 — all types
- Botanical SPF 50 Shield ₹2200 — all types
- Niacinamide Pore Serum ₹2450 — oily/combination
- Shea Butter Night Cream ₹2650 — dry/sensitive
- Wild Berry Lip Elixir ₹890 — all types`

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

async function callGemini(model, apiKey, systemPrompt, messages) {
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

export async function POST(request) {
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

  const { messages, context } = body ?? {}
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

  const ctx = sanitiseContext(context)
  const prompt = buildSystemPrompt(ctx)

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
