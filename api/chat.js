/**
 * api/chat.js — Vercel Serverless Function
 *
 * Proxies chat requests to Google Gemini (gemini-2.5-flash).
 * GEMINI_API_KEY must be set in Vercel → Settings → Environment Variables.
 * It must NOT have the VITE_ prefix — keep it server-side only.
 *
 * Flow:  Browser → POST /api/chat → This proxy → Gemini API
 *
 * Key differences vs Anthropic API:
 *   - Auth:    ?key= query param (not x-api-key header)
 *   - Roles:   "model" instead of "assistant"
 *   - Body:    contents[].parts[].text  (not messages[].content)
 *   - System:  system_instruction field (not system param)
 *   - Reply:   candidates[0].content.parts[0].text
 *
 * The proxy normalises the response to { content: [{ text }] } so the
 * ChatBot component works without any frontend changes.
 */

const RATE_LIMIT_MAP = new Map()
const RATE_LIMIT     = 20        // max requests
const WINDOW_MS      = 60_000    // per minute per IP

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

/**
 * Convert the ChatBot message array (Anthropic format) to Gemini's format.
 *   Anthropic role "assistant" → Gemini role "model"
 *   Anthropic { role, content: string } → Gemini { role, parts: [{ text }] }
 */
function toGeminiContents(messages) {
  return messages.map((m) => ({
    role:  m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
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
  // ── CORS preflight ─────────────────────────────────────────────
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // ── CORS ──────────────────────────────────────────────────────
  const origin  = req.headers.origin ?? ''
  const allowed = [
    'https://verdebliss.vercel.app',
    'https://www.verdebliss.com',
    'http://localhost:5173',
    'http://localhost:4173',
  ]
  const corsOrigin = allowed.includes(origin) ? origin : 'https://verdebliss.vercel.app'
  res.setHeader('Access-Control-Allow-Origin', corsOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // ── Rate limiting ──────────────────────────────────────────────
  const ip = (req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() || 'unknown'
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' })
  }

  // ── Parse body ─────────────────────────────────────────────────
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

  // ── API key check ──────────────────────────────────────────────
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('[chat] GEMINI_API_KEY environment variable is not set')
    return res.status(500).json({ error: 'Server configuration error — GEMINI_API_KEY missing' })
  }

  // ── Call Gemini API ────────────────────────────────────────────
  const MODEL   = 'gemini-2.5-flash'
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`

  try {
    const geminiRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // System instruction — Gemini's equivalent of Anthropic's "system" param
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        // Chat history in Gemini format
        contents: toGeminiContents(messages),
        // Generation config
        generationConfig: {
          maxOutputTokens: 300,
          temperature:     0.7,
        },
      }),
    })

    // ── Handle upstream errors ─────────────────────────────────
    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      console.error(`[chat] Gemini ${geminiRes.status}:`, errText)

      if (geminiRes.status === 400) {
        return res.status(400).json({ error: 'Bad request to AI service' })
      }
      if (geminiRes.status === 403) {
        return res.status(502).json({ error: 'API key is invalid, revoked, or lacks Gemini access' })
      }
      if (geminiRes.status === 429) {
        return res.status(429).json({ error: 'AI service rate limit reached. Try again shortly.' })
      }
      if (geminiRes.status === 503) {
        return res.status(502).json({ error: 'AI service is temporarily unavailable. Try again shortly.' })
      }
      return res.status(502).json({ error: `Upstream API error: ${geminiRes.status}` })
    }

    const data = await geminiRes.json()

    // ── Extract reply text from Gemini response ────────────────
    // Shape: data.candidates[0].content.parts[0].text
    const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!replyText) {
      console.error('[chat] Unexpected Gemini response shape:', JSON.stringify(data))
      return res.status(502).json({ error: 'Unexpected response from AI service' })
    }

    // ── Normalise to Anthropic-compatible shape ────────────────
    // ChatBot reads: data.content[0].text — keep that shape so the
    // frontend component requires zero changes.
    return res.status(200).json({
      content: [{ type: 'text', text: replyText }],
    })

  } catch (err) {
    console.error('[chat] Fetch error:', err)
    return res.status(500).json({ error: 'Network error reaching AI service' })
  }
}