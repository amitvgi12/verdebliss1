# VerdeBliss — Security Audit Report

**Auditor:** Solution Architect / Security Review  
**Date:** 2026-04-11  
**Scope:** Full-stack React + Supabase + Vercel serverless

---

## Severity Legend
| Level | Description |
|-------|-------------|
| 🔴 CRITICAL | Exploitable now, data breach or service abuse possible |
| 🟠 HIGH | Significant risk, fix before production |
| 🟡 MEDIUM | Limited impact, fix within sprint |
| 🟢 LOW | Best practice gap, low exploitability |

---

## Findings

### 🔴 CRITICAL-01 — API Key Exposed in Client Bundle
**File:** `src/components/features/chat/ChatBot.jsx` (original)  
**Description:** `VITE_ANTHROPIC_API_KEY` was embedded directly in the React app. Because Vite bakes all `VITE_` env vars into the compiled JS bundle, any user opening DevTools → Sources or Network could read the raw API key. This key can then be used to make unlimited Anthropic API calls charged to the account.

**Fix applied:** Created `api/chat.js` — a Vercel serverless function that holds the key as a server-only env var (`ANTHROPIC_API_KEY`, no `VITE_` prefix). The ChatBot now calls `/api/chat` instead of `api.anthropic.com` directly. The key never appears in any file served to browsers.

**Remediation steps:**
1. Remove `VITE_ANTHROPIC_API_KEY` from Vercel Environment Variables
2. Add `ANTHROPIC_API_KEY` (no VITE prefix) as a **Server** environment variable in Vercel
3. Rotate the old key at console.anthropic.com immediately

---

### 🟠 HIGH-02 — No Rate Limiting on Chat Endpoint
**Description:** Without rate limiting, a single IP or script could fire thousands of requests per minute, draining Anthropic API credits or triggering billing alerts.

**Fix applied:** `api/chat.js` includes an in-memory sliding-window limiter: 20 requests per IP per minute. Returns HTTP 429 on excess.

**Production upgrade:** Replace the in-memory map with Upstash Redis + `@upstash/ratelimit` for persistence across serverless cold starts.

---

### 🟠 HIGH-03 — Missing Security Headers
**Description:** No HTTP security headers were set, leaving the app vulnerable to clickjacking (`X-Frame-Options`), MIME sniffing (`X-Content-Type-Options`), and XSS reflection (`X-XSS-Protection`).

**Fix applied:** `vercel.json` now sets:
- `X-Frame-Options: DENY` — prevents iframe embedding (clickjacking)
- `X-Content-Type-Options: nosniff` — prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` with preload — enforces HTTPS
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` — disables camera, mic, geolocation
- `Content-Security-Policy` — restricts script/style/connect origins

---

### 🟠 HIGH-04 — No Input Validation on Chat Messages
**Description:** The chat API accepted arbitrary arrays without length or content validation. An attacker could send 1000-message arrays to trigger large Anthropic prompts, or craft messages to attempt prompt injection.

**Fix applied:** `api/chat.js` validates:
- `messages` must be an array
- Max 40 messages (context stuffing protection)
- Each message: role must be `user|assistant`, content is a non-empty string ≤ 2000 chars
- System prompt is server-controlled — the client cannot override it

---

### 🟠 HIGH-05 — CORS Wildcard on Chat API
**Description:** The API accepted requests from any origin (`*`), allowing cross-site request abuse.

**Fix applied:** `api/chat.js` checks `req.headers.origin` against an allowlist (your Vercel domain + `localhost:5173`). Non-allowed origins receive HTTP 403.

**Action required:** Update `allowed` array in `api/chat.js` with your final production domain.

---

### 🟡 MEDIUM-06 — Supabase Anon Key Visible in Bundle
**Description:** `VITE_SUPABASE_ANON_KEY` is intentionally public per Supabase's design (Row Level Security enforces access). However, if RLS is misconfigured, this key enables unauthenticated data access.

**Status:** Accepted risk — by design. RLS policies in `schema.sql` correctly restrict all tables. **Ensure RLS is enabled** by verifying in Supabase Dashboard → Authentication → Policies.

**Hardening:** Enable Supabase's built-in abuse protection at supabase.com/dashboard → Settings → API → Rate limiting.

---

### 🟡 MEDIUM-07 — No CSRF Protection on API Routes
**Description:** Vercel serverless functions don't get CSRF tokens by default. For state-changing endpoints this can be exploited.

**Mitigation:** The `Content-Type: application/json` check (browsers can't send cross-site JSON without a preflight) plus CORS allowlist provides CSRF protection for the chat endpoint. For future endpoints that modify user data, add a `x-requested-with` header check or use Supabase's built-in CSRF protection.

---

### 🟡 MEDIUM-08 — localStorage Used for Cart and Wishlist
**Description:** Cart and wishlist data is persisted in `localStorage` (via Zustand persist). XSS vulnerabilities could read this data. However, no sensitive data (passwords, tokens) is stored there.

**Mitigation:** Data stored is non-sensitive (product IDs, quantities). Supabase auth tokens are stored in `httpOnly` cookies when using the Supabase SSR package. Current risk is low.

---

### 🟢 LOW-09 — No Content Security Policy Nonce for Inline Scripts
**Description:** The CSP uses `'unsafe-inline'` for scripts to accommodate Vite's build output.

**Recommended fix:** Switch to CSP nonces by configuring Vite's `vite-plugin-csp` which generates a nonce per request, removing the need for `'unsafe-inline'`.

---

### 🟢 LOW-10 — Error Messages May Leak Implementation Details
**Description:** Server errors in `api/chat.js` previously returned raw error objects.

**Fix applied:** All catch blocks return generic messages (`"Internal server error"`, `"Upstream API error"`) and log the real error server-side only via `console.error`.

---

## Supabase RLS Checklist

| Table     | Public Read | Owner Write | Status |
|-----------|-------------|-------------|--------|
| products  | ✅          | Admin only  | ✅ in schema.sql |
| profiles  | ❌          | Owner       | ✅ in schema.sql |
| orders    | ❌          | Owner       | ✅ in schema.sql |
| wishlist  | ❌          | Owner       | ✅ in schema.sql |
| addresses | ❌          | Owner       | ✅ in schema.sql |
| reviews   | ✅ (read)   | Owner insert| ✅ in schema.sql |

---

## Deployment Secrets Checklist

| Secret | Scope | Status |
|--------|-------|--------|
| `VERCEL_TOKEN` | GitHub Actions only | ✅ |
| `VITE_SUPABASE_URL` | Client (public) | ✅ safe |
| `VITE_SUPABASE_ANON_KEY` | Client (public per Supabase design) | ✅ RLS enforced |
| `ANTHROPIC_API_KEY` | Server only — NO VITE_ prefix | ✅ via api/chat.js |
| `VITE_RAZORPAY_KEY_ID` | Client (public test key) | ✅ safe for test mode |

**Remove:** `VITE_ANTHROPIC_API_KEY` if it still exists — it is no longer used.
