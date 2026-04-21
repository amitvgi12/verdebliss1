/**
 * api/chat.js — Vercel Serverless Function
 * Proxies to Google Gemini (gemini-2.5-flash).
 *
 * ROOT CAUSE OF "temporarily unavailable" (503):
 *   gemini-2.5-flash defaults to DYNAMIC THINKING MODE — the model
 *   "thinks" before every reply, which routinely exceeds Vercel's
 *   10-second serverless timeout. Gemini returns 503 when it times out.
 *
 * FIXES APPLIED:
 *   1. thinkingBudget: 0  — disables thinking entirely for instant chat
 *   2. Auth via x-goog-api-key HEADER (not ?key= query param — fails
 *      in some server environments on newer Gemini endpoints)
 *   3. Full error body logged on every non-200 so you can diagnose
 *      issues in Vercel → Functions → Logs
 *   4. Fallback to gemini-2.0-flash if 2.5-flash returns 5xx
 *
 * VERCEL ENV VAR REQUIRED:
 *   Name:  GEMINI_API_KEY  (no VITE_ prefix — server-only)
 *   Value: your Google AI Studio key (aistudio.google.com)
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

// Anthropic format → Gemini format
// "assistant" → "model",  content string → parts array
function toGeminiContents(messages) {
  return messages.map((m) => ({
    role:  m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
}

// Call Gemini with a given model — returns { ok, status, data, errorBody }
async function callGemini(model, apiKey, systemPrompt, messages) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type':    'application/json',
      'x-goog-api-key':  apiKey,   // ← HEADER auth (not ?key= query param)
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: toGeminiContents(messages),
      generationConfig: {
        maxOutputTokens: 300,
        temperature:     0.7,
        // KEY FIX: disable thinking — gemini-2.5-flash defaults to dynamic
        // thinking mode which exceeds Vercel's 10s timeout → 503 errors
        thinkingConfig: {
          thinkingBudget: 0,   // 0 = thinking off, -1 = dynamic (default/slow)
        },
      },
    }),
  })

  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = null }

  return { ok: res.ok, status: res.status, data, errorBody: text }
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
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // CORS
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

  // Rate limiting
  const ip = (req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() || 'unknown'
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' })
  }

  // Parse body
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

  // API key
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('[chat] GEMINI_API_KEY is not set in environment variables')
    return res.status(500).json({ error: 'Server configuration error — GEMINI_API_KEY missing' })
  }

  try {
    // ── Primary: gemini-2.5-flash with thinking disabled ─────────
    let result = await callGemini('gemini-2.5-flash', apiKey, SYSTEM_PROMPT, messages)

    // ── Fallback: gemini-2.0-flash if 2.5 returns any 5xx ───────
    if (!result.ok && result.status >= 500) {
      console.warn(`[chat] gemini-2.5-flash ${result.status} — falling back to gemini-2.0-flash`)
      console.warn('[chat] 2.5-flash error body:', result.errorBody)
      result = await callGemini('gemini-2.0-flash', apiKey, SYSTEM_PROMPT, messages)
    }

    // ── Handle errors ─────────────────────────────────────────────
    if (!result.ok) {
      // Always log the FULL error body to Vercel → Functions → Logs
      console.error(`[chat] Gemini ${result.status}:`, result.errorBody)

      if (result.status === 400) return res.status(400).json({ error: 'Bad request — check message format' })
      if (result.status === 403) return res.status(502).json({ error: 'API key is invalid or lacks Gemini API access. Check GEMINI_API_KEY in Vercel.' })
      if (result.status === 404) return res.status(502).json({ error: 'Model not found — check the model name' })
      if (result.status === 429) return res.status(429).json({ error: 'Gemini rate limit reached. Try again shortly.' })
      return res.status(502).json({ error: `Gemini API error ${result.status} — check Vercel function logs` })
    }

    // ── Extract reply text ────────────────────────────────────────
    // Gemini: data.candidates[0].content.parts[0].text
    const candidate  = result.data?.candidates?.[0]
    const replyText  = candidate?.content?.parts?.[0]?.text

    // Handle safety blocks (finishReason: SAFETY)
    if (!replyText) {
      const reason = candidate?.finishReason ?? 'unknown'
      console.warn('[chat] No text in Gemini response. finishReason:', reason, JSON.stringify(result.data))
      if (reason === 'SAFETY') {
        return res.status(200).json({
          content: [{ type: 'text', text: "I'm not able to respond to that query. Please ask me about skincare! 🌿" }],
        })
      }
      return res.status(502).json({ error: 'Unexpected response from Gemini — no text returned' })
    }

    // Normalise to Anthropic-compatible shape so ChatBot needs zero changes
    // ChatBot reads: data.content[0].text
    return res.status(200).json({
      content: [{ type: 'text', text: replyText }],
    })

  } catch (err) {
    console.error('[chat] Unhandled error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
