/**
 * api/chat.js — Vercel Serverless Function
 * Proxies to Google Gemini (gemini-2.5-flash).
 *
 * New in this version:
 *   Accepts `context` from the client — user profile + order history.
 *   Builds a dynamic system prompt so Gemini can answer:
 *     "Where is my order?"   "How many loyalty points do I have?"
 *     "Can I get a refund?"  "Update my skin type"  etc.
 *
 * Security:
 *   - Only non-sensitive fields are accepted from the client (no raw addresses).
 *   - Context is injected into the SYSTEM prompt only — not the message history.
 *   - Input length is validated to prevent prompt injection.
 *   - GEMINI_API_KEY stays server-side (no VITE_ prefix).
 */

const RATE_LIMIT_MAP = new Map()
const RATE_LIMIT     = 20
const WINDOW_MS      = 60_000

function isRateLimited(ip) {
  const now   = Date.now()
  const entry = RATE_LIMIT_MAP.get(ip) ?? { count: 0, resetAt: now + WINDOW_MS }
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + WINDOW_MS }
  entry.count += 1
  RATE_LIMIT_MAP.set(ip, entry)
  return entry.count > RATE_LIMIT
}

function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 40) return false
  return messages.every(
    (m) =>
      typeof m.role    === 'string' &&
      typeof m.content === 'string' &&
      ['user', 'assistant'].includes(m.role) &&
      m.content.length > 0 &&
      m.content.length <= 2000
  )
}

/** Sanitise and validate the context object coming from the client */
function sanitiseContext(raw) {
  if (!raw || typeof raw !== 'object') return { isLoggedIn: false }
  return {
    isLoggedIn:  Boolean(raw.isLoggedIn),
    name:        String(raw.name  ?? '').slice(0, 100),
    email:       String(raw.email ?? '').slice(0, 200),
    skinType:    String(raw.skinType ?? 'not specified').slice(0, 50),
    tier:        String(raw.tier ?? 'Green Leaf').slice(0, 50),
    points:      Number.isFinite(raw.points) ? raw.points : 0,
    orderCount:  Number.isFinite(raw.orderCount) ? raw.orderCount : 0,
    orders:      String(raw.orders ?? '').slice(0, 3000),  // pre-formatted order summary
  }
}

/** Convert Anthropic-style messages to Gemini contents format */
function toGeminiContents(messages) {
  return messages.map((m) => ({
    role:  m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
}

/** Build the system prompt — static for guests, enriched for members */
function buildSystemPrompt(ctx) {
  const productCatalogue = `
VerdeBliss product catalogue:
- Bakuchiol Renewal Serum ₹2850 — dry/combination skin, plant-based retinol alternative
- Rose Hip Glow Moisturiser ₹1990 — dry/sensitive skin
- Green Tea Clarity Toner ₹1450 — oily/combination skin
- Turmeric Brightening Cleanser ₹1250 — all skin types
- Botanical SPF 50 Shield ₹2200 — all skin types, mineral sunscreen
- Niacinamide Pore Serum ₹2450 — oily/combination, pore-minimising
- Shea Butter Night Cream ₹2650 — dry/sensitive skin
- Wild Berry Lip Elixir ₹890 — all skin types`

  const policies = `
Key policies:
- Free shipping on orders above ₹499; otherwise ₹79 flat
- Returns accepted within 14 days for unopened products
- Opened products eligible for exchange if adverse reaction occurs
- Refund timeline: 3–5 business days (UPI/Net Banking), 5–7 days (cards)
- Loyalty points: earn 1 point per ₹10 spent; tiers: Green Leaf (0–499 pts), Gold Botanist (500–1499 pts), Platinum Alchemist (1500+ pts)
- To initiate a return: email returns@verdebliss.in with order ID
- For adverse reactions: email reactions@verdebliss.in
- General support: hello@verdebliss.in`

  const basePersona = `You are Verde, the AI support advisor for VerdeBliss — a luxury certified organic skincare brand from India ("Where beauty becomes luxury").

You help customers with TWO types of queries:
1. SKINCARE ADVICE — ingredient science, product recommendations, skin routines
2. ORDER SUPPORT — order status, refunds, returns, loyalty points, profile questions

Tone: warm, knowledgeable, and gently sophisticated. Be concise — 2 to 4 sentences maximum unless listing order details.
Never make medical or clinical diagnostic claims.
${productCatalogue}
${policies}`

  if (!ctx.isLoggedIn) {
    return `${basePersona}

CURRENT USER: Guest (not logged in)
If the user asks about their orders, points, or account — tell them you need them to sign in first at verdebliss.com/account to access that information. Offer to help with skincare questions in the meantime.`
  }

  return `${basePersona}

CURRENT USER ACCOUNT (verified — use this to answer account queries):
  Name: ${ctx.name}
  Email: ${ctx.email}
  Skin type: ${ctx.skinType}
  Loyalty tier: ${ctx.tier}
  Loyalty points: ${ctx.points} points
  Total orders: ${ctx.orderCount}

ORDER HISTORY (most recent first):
${ctx.orders || 'No orders found.'}

INSTRUCTIONS FOR ACCOUNT QUERIES:
- If asked about order status, look up the order in the ORDER HISTORY above and report the status.
- If asked about loyalty points, state the exact number (${ctx.points} points) and their tier (${ctx.tier}).
- If asked about a refund, acknowledge the order, explain the 14-day return policy, and direct them to returns@verdebliss.in with their order ID.
- If asked to update skin type or profile, tell them to visit verdebliss.com/account to update their profile settings.
- If the user asks about a specific order by number or date, match it from the order history above.
- If no matching order is found, say so politely and offer to help with a support email.
- For skincare recommendations, factor in their skin type (${ctx.skinType}) when suggesting products.`
}

async function callGemini(model, apiKey, systemPrompt, messages) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type':   'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: toGeminiContents(messages),
      generationConfig: {
        maxOutputTokens: 400,
        temperature:     0.65,
        thinkingConfig:  { thinkingBudget: 0 },
      },
    }),
  })

  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = null }
  return { ok: res.ok, status: res.status, data, errorBody: text }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(204).end()
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const origin  = req.headers.origin ?? ''
  const allowed = ['https://verdebliss.com', 'https://www.verdebliss.com', 'http://localhost:5173', 'http://localhost:4173']
  const corsOrigin = allowed.includes(origin) ? origin : 'https://verdebliss.com'
  res.setHeader('Access-Control-Allow-Origin', corsOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  const ip = (req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() || 'unknown'
  if (isRateLimited(ip)) return res.status(429).json({ error: 'Too many requests. Please wait a moment.' })

  let body
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body }
  catch { return res.status(400).json({ error: 'Invalid JSON body' }) }

  const { messages, context } = body ?? {}
  if (!validateMessages(messages)) return res.status(400).json({ error: 'Invalid messages array' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('[chat] GEMINI_API_KEY not set')
    return res.status(500).json({ error: 'Server configuration error — GEMINI_API_KEY missing' })
  }

  const ctx          = sanitiseContext(context)
  const systemPrompt = buildSystemPrompt(ctx)

  try {
    let result = await callGemini('gemini-2.5-flash', apiKey, systemPrompt, messages)

    if (!result.ok && result.status >= 500) {
      console.warn(`[chat] gemini-2.5-flash ${result.status} — falling back to gemini-2.0-flash`)
      result = await callGemini('gemini-2.0-flash', apiKey, systemPrompt, messages)
    }

    if (!result.ok) {
      console.error(`[chat] Gemini ${result.status}:`, result.errorBody)
      if (result.status === 400) return res.status(400).json({ error: 'Bad request — check message format' })
      if (result.status === 403) return res.status(502).json({ error: 'API key invalid. Check GEMINI_API_KEY in Vercel.' })
      if (result.status === 404) return res.status(502).json({ error: 'Model not found' })
      if (result.status === 429) return res.status(429).json({ error: 'Rate limit reached. Try again shortly.' })
      return res.status(502).json({ error: `Gemini API error ${result.status}` })
    }

    const candidate = result.data?.candidates?.[0]
    const replyText = candidate?.content?.parts?.[0]?.text

    if (!replyText) {
      const reason = candidate?.finishReason ?? 'unknown'
      console.warn('[chat] No text. finishReason:', reason)
      if (reason === 'SAFETY') {
        return res.status(200).json({ content: [{ type: 'text', text: "I'm not able to respond to that. Please ask me about skincare or your order! 🌿" }] })
      }
      return res.status(502).json({ error: 'No text returned from Gemini' })
    }

    return res.status(200).json({ content: [{ type: 'text', text: replyText }] })

  } catch (err) {
    console.error('[chat] Unhandled error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
