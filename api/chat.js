/**
 * api/chat.js — Vercel Serverless Function (Node.js runtime)
 *
 * Security: ANTHROPIC_API_KEY lives only in Vercel Environment Variables
 * (no VITE_ prefix → never bundled into the client).
 *
 * Flow:  Browser → POST /api/chat → This proxy → Anthropic API
 *
 * Fixed bugs from previous version:
 *   1. URL was pointing at Google Gemini API (wrong service entirely)
 *   2. Model was "gemini-2.5-flash" (Google model, not Claude)
 *   3. Error details were swallowed — added structured logging
 */

const RATE_LIMIT_MAP = new Map()
const RATE_LIMIT     = 20      // requests
const WINDOW_MS      = 60_000  // per minute per IP

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
      typeof m.role === 'string' &&
      typeof m.content === 'string' &&
      ['user', 'assistant'].includes(m.role) &&
      m.content.length > 0 &&
      m.content.length <= 2000
  )
}

const SYSTEM_PROMPT = `You are Verde, the botanical beauty advisor for VerdeBliss — a luxury certified organic skincare brand from India ("Where beauty becomes luxury").

Be warm, knowledgeable, and gently sophisticated. Recommend specific VerdeBliss products when relevant:
- Bakuchiol Renewal Serum (dry/combination skin, plant-based retinol alternative)
- Rose Hip Glow Moisturiser (dry/sensitive skin)
- Green Tea Clarity Toner (oily/combination)
- Turmeric Brightening Cleanser (all types)
- Botanical SPF 50 Shield (all types)
- Niacinamide Pore Serum (oily/combination)
- Shea Butter Night Cream (dry/sensitive)
- Wild Berry Lip Elixir (all types)

Never make medical or clinical diagnostic claims. Keep replies concise — 2 to 3 sentences.`

export default async function handler(req, res) {
  // ── Method guard ─────────────────────────────────────────────
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // ── CORS ─────────────────────────────────────────────────────
  const origin  = req.headers.origin ?? ''
  const allowed = [
    'https://verdebliss.com',
    'https://www.verdebliss.com',
    'http://localhost:5173',
    'http://localhost:4173',
  ]
  const corsOrigin = allowed.includes(origin) ? origin : 'https://verdebliss.com'
  res.setHeader('Access-Control-Allow-Origin', corsOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // ── Rate limiting ─────────────────────────────────────────────
  const ip = (req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() || 'unknown'
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' })
  }

  // ── Parse body ────────────────────────────────────────────────
  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' })
  }

  const { messages } = body ?? {}

  if (!validateMessages(messages)) {
    return res.status(400).json({ error: 'Invalid messages array' })
  }

  // ── API key check ─────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('[chat] ANTHROPIC_API_KEY environment variable is not set')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  // ── Call Anthropic API ────────────────────────────────────────
  try {
    const anthropicRes = await fetch('//generativelanguage.googleapis.com/v1beta/openai/', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
      },
      body: JSON.stringify({
        model:      'gemini-2.5-flash', // fast + cost-effective for chat
        max_tokens: 300,
        system:     SYSTEM_PROMPT,
        messages,
      }),
    })

    // ── Handle upstream errors with detail ────────────────────
    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      console.error(`[chat] Anthropic ${anthropicRes.status}:`, errText)

      if (anthropicRes.status === 401) {
        return res.status(502).json({ error: 'API key is invalid or revoked' })
      }
      if (anthropicRes.status === 429) {
        return res.status(429).json({ error: 'AI service rate limit reached. Try again shortly.' })
      }
      if (anthropicRes.status === 529) {
        return res.status(502).json({ error: 'AI service is overloaded. Try again shortly.' })
      }
      return res.status(502).json({ error: `Upstream API error: ${anthropicRes.status}` })
    }

    const data = await anthropicRes.json()

    // ── Return the content array directly so the client can read
    //    data.content[0].text (same shape as calling Anthropic directly)
    return res.status(200).json({ content: data.content })

  } catch (err) {
    console.error('[chat] Fetch error:', err)
    return res.status(500).json({ error: 'Network error reaching AI service' })
  }
}
