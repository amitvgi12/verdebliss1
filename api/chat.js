/**
 * api/chat.js — Vercel Serverless Edge Function
 *
 * WHY THIS EXISTS (Security):
 *   VITE_ANTHROPIC_API_KEY in the frontend bundle is visible to anyone
 *   who opens DevTools → Network. This proxy keeps the key server-side only.
 *
 * HOW IT WORKS:
 *   Client → POST /api/chat  →  This function  →  Anthropic API
 *   The key lives in Vercel Environment Variables (server-only, not VITE_ prefixed).
 *
 * RATE LIMITING:
 *   Simple in-memory limiter: 20 requests / IP / minute.
 *   Replace with Upstash Redis for production-grade limiting.
 */

// ── In-memory rate limiter (resets on cold start — good enough for Edge) ──
const rateLimitMap = new Map()
const RATE_LIMIT   = 20   // max requests
const WINDOW_MS    = 60_000 // per minute

function isRateLimited(ip) {
  const now = Date.now()
  const entry = rateLimitMap.get(ip) ?? { count: 0, resetAt: now + WINDOW_MS }

  // Reset window if expired
  if (now > entry.resetAt) {
    entry.count   = 0
    entry.resetAt = now + WINDOW_MS
  }

  entry.count += 1
  rateLimitMap.set(ip, entry)
  return entry.count > RATE_LIMIT
}

// ── Input validation ──────────────────────────────────────────────────────
function validateMessages(messages) {
  if (!Array.isArray(messages))          return false
  if (messages.length === 0)             return false
  if (messages.length > 40)             return false  // prevent context stuffing

  return messages.every((m) =>
    typeof m.role    === 'string' &&
    typeof m.content === 'string' &&
    ['user', 'assistant'].includes(m.role) &&
    m.content.length > 0 &&
    m.content.length <= 2000             // prevent token flooding
  )
}

// ── Handler ───────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Only POST allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // CORS — restrict to your own domain in production
  const origin = req.headers.origin
  const allowed = [
    'https://verdebliss.vercel.app',
    'http://localhost:5173',             // local dev
  ]
  if (origin && !allowed.includes(origin)) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  res.setHeader('Access-Control-Allow-Origin', origin ?? '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Rate limiting
  const ip = req.headers['x-forwarded-for']?.split(',')[0] ?? 'unknown'
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please slow down.' })
  }

  // Parse and validate body
  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' })
  }

  const { messages, system } = body ?? {}

  if (!validateMessages(messages)) {
    return res.status(400).json({ error: 'Invalid messages format' })
  }

  // Sanitise system prompt — client can only choose the persona, not override safety
  const SYSTEM_PROMPT = `You are Verde, the botanical beauty advisor for VerdeBliss — a luxury organic cosmetics brand ("Where beauty becomes luxury"). Be warm, knowledgeable, and gently sophisticated. Recommend specific products. Never make medical or clinical claims. Keep replies to 2-3 sentences.`

  // Forward to Anthropic — key is server-only env var (no VITE_ prefix)
  try {
    const response = await fetch('//generativelanguage.googleapis.com/v1beta/openai/', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         process.env.ANTHROPIC_API_KEY,  // server-side only
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'gemini-2.5-flash',
        max_tokens: 300,
        system:     SYSTEM_PROMPT,
        messages,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Anthropic error:', err)
      return res.status(502).json({ error: 'Upstream API error' })
    }

    const data = await response.json()
    return res.status(200).json({ content: data.content })

  } catch (err) {
    console.error('Chat proxy error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
