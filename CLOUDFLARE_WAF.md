# Cloudflare WAF + Origin Protection Runbook

## Goal

Front Vercel with Cloudflare so:

1. `/api/checkout/*` and `/api/webhooks/razorpay` are protected by WAF rules,
   bot management, and a per-IP edge rate limit before traffic reaches our origin.
2. Origin (Vercel) only accepts traffic that came through Cloudflare —
   defeating direct-to-origin abuse that bypasses the WAF.
3. `cf-connecting-ip` is the only trusted client-IP signal for rate limiting.

## Prerequisites

- Domain on Cloudflare nameservers (proxied / orange-cloud on the apex and
  `www`).
- Vercel project with a custom domain. Use Vercel's Cloudflare integration
  guide: <https://vercel.com/docs/integrations/cloudflare>.
- Production environment variables already set (Razorpay, Supabase, Gemini,
  Turnstile).

## Step 1 — DNS

```
A      @       <Vercel IP from Vercel dashboard>     Proxied (orange)
CNAME  www     cname.vercel-dns.com                  Proxied (orange)
```

If you use Vercel's apex via ANAME/ALIAS, prefer Cloudflare's CNAME flattening
on the apex. Confirm `dig www.verdebliss.com` returns Cloudflare-owned IPs.

## Step 2 — Origin lock-down (close direct-to-origin path)

Vercel does not support IP allow-lists on the free / Pro plan. Two options:

### Option A — Header secret (works on every plan)

1. In Cloudflare dashboard → your zone → **Rules → Transform Rules → Modify
   Request Header**: add a static custom header to every request to your
   origin, e.g. `x-vb-origin-secret: <random 32+ char value>`.
   Do not use a header beginning with `x-cf-` or `cf-`; Cloudflare reserves
   those names and will reject transform rules that try to set them.
2. `proxy.ts` rejects protected `/api/*` requests that do not carry the
   matching header and stamps verified requests with `x-vb-origin-verified`
   before route handlers read client-IP headers. Treat the secret as a rotated
   env var:

```ts
// Implemented in proxy.ts before CSP processing.
// Set CF_ORIGIN_SECRET to enable the header check.
// Set CF_ORIGIN_GATE_REQUIRED=true after Cloudflare header injection is live
// so production fails closed if the secret is accidentally removed.
```

3. Set `CF_ORIGIN_SECRET` in Vercel's environment **and** in the Cloudflare
   header-rewrite rule. Once verified, set `CF_ORIGIN_GATE_REQUIRED=true` in
   production. Rotate quarterly.

### Option B — Authenticated Origin Pulls (Cloudflare Enterprise / Vercel Enterprise)

If both plans support it, enable Cloudflare's authenticated origin pulls and
configure Vercel to require the Cloudflare client certificate. This is the
strongest option but requires both Enterprise tiers.

## Step 3 — WAF rules

In the Cloudflare zone → **Security → WAF → Custom rules**, add (in this
order — Cloudflare evaluates top to bottom):

### 3.1 Block known bad bots on checkout

```
(http.request.uri.path matches "^/api/(checkout|refunds|webhooks)/"
  and (cf.client.bot or cf.threat_score gt 30))
Action: Block
```

### 3.2 Allow Razorpay webhook source IPs only

Razorpay's webhook source ranges are documented here:
<https://razorpay.com/docs/webhooks/source-ip-addresses/>. As of 2026:

```
185.232.21.0/24
13.232.144.74
13.235.137.65
35.244.32.215
35.200.211.230
35.244.59.79
```

Rule:

```
http.request.uri.path eq "/api/webhooks/razorpay"
  and not ip.src in {185.232.21.0/24 13.232.144.74 13.235.137.65 ...}
Action: Block
```

Re-verify the list quarterly — Razorpay updates it.

### 3.3 Country-allowlist payments (optional)

If you only ship India: block checkout payments from outside IN/US/GB/etc.
**Be careful** — this affects diaspora customers and travellers.

```
http.request.uri.path matches "^/api/checkout/"
  and not ip.geoip.country in {"IN" "US" "GB" "CA" "AU" "AE" "SG"}
Action: Managed Challenge
```

## Step 4 — Rate-limit rules (Cloudflare native)

App-level rate limits in `lib/rate-limit.ts` remain the primary defence (they
key by user id / email too). Cloudflare's edge rate limit is a coarser
front-line.

In **Security → WAF → Rate limiting rules**:

```
Rule 1: Checkout creation
  Match: http.request.uri.path matches "^/api/checkout/(create-razorpay-order|cod)$"
  Threshold: 30 requests per 60 s per IP
  Action: Managed Challenge
  Mitigation duration: 5 min

Rule 2: Auth/contact spam
  Match: http.request.uri.path in {"/api/contact" "/api/newsletter"}
  Threshold: 20 requests per 300 s per IP
  Action: Block
  Mitigation duration: 30 min

Rule 3: Chat
  Match: http.request.uri.path eq "/api/chat"
  Threshold: 60 requests per 60 s per IP
  Action: Managed Challenge
  Mitigation duration: 10 min
```

## Step 5 — Bot Management

If on Bot Management plan, enable for `/api/*`. Otherwise:

- Cloudflare Turnstile is already wired into `/contact` and `/newsletter`
  (see `lib/turnstile.ts`).
- Consider adding it to the checkout's address-step submit too if abuse rises.

## Step 6 — Cache rules (don't cache sensitive endpoints)

```
http.request.uri.path matches "^/api/"
  -> Bypass cache
http.request.uri.path matches "^/(account|checkout|refund)"
  -> Bypass cache
```

The `Cache-Control` headers from Next.js already cover this, but explicit
Cloudflare rules avoid surprises if a header is misconfigured.

## Step 7 — Monitoring

- **Cloudflare → Analytics & Logs → Security Events** — daily check for
  anomalies, especially around payday and weekends.
- **Vercel → Logs** — search for `[ALERT] payment_reconciliation_failed` and
  `[EXCEPTION]` log lines. These are wired to fire either via log drains
  (Datadog, Logflare) or Sentry once `SENTRY_DSN` is set.
- **Razorpay → Reports → Settlements** vs **Supabase → orders** — daily
  reconciliation cron should diff payment_events without orders.

## Verification checklist

After turning everything on:

```
# 1. WAF active — direct-to-origin should fail
curl -i https://<your-vercel-domain>.vercel.app/api/checkout/cod
# Expect: 403 (header secret missing)

# 2. Through Cloudflare — should succeed (and increment edge rate-limit)
curl -i https://verdebliss.com/api/checkout/cod -H "x-vb-client: web" \
     -H "Content-Type: application/json" -d '{"items":[]}'
# Expect: 400 (bad input) — proves WAF + middleware passed

# 3. CF-Connecting-IP propagates only after origin verification
curl -i https://verdebliss.com/api/version
# Exempt endpoint sanity check. Protected API route logs should show source:
# 'cf' only when Cloudflare supplied x-vb-origin-secret and proxy.ts stamped
# x-vb-origin-verified.

# 4. Webhook IP allow-list
curl -i https://verdebliss.com/api/webhooks/razorpay -H "x-razorpay-signature: x"
# From your laptop: expect 403 from Cloudflare WAF (not from origin)
```

## Rollback

Cloudflare's "Pause Cloudflare on this site" is a single click. DNS still
resolves to Vercel directly. The `CF_ORIGIN_SECRET` proxy check **must
not** activate when Cloudflare is paused — keep `CF_ORIGIN_SECRET` unset and
`CF_ORIGIN_GATE_REQUIRED` empty/false in the rollback environment.

## Step 8 — Dashboard drift fixes (June 2026 audit)

The June 2026 production audit found the Cloudflare dashboard overriding or
contradicting the app's own configuration. These are **dashboard actions** —
the repo is already correct; do not "fix" them in code.

### 8.1 Security-header overrides — ✅ fixed (June 2026)

Root cause: **Managed Transforms → "Add security headers"** was enabled, injecting
`x-frame-options: SAMEORIGIN`, `referrer-policy: same-origin`, and
`x-xss-protection: 1; mode=block` over the origin's correct values.

Fix applied:
- Turned OFF "Add security headers" in Managed Transforms.
- Deleted the "remove headers" custom rule (was a band-aid removing `x-xss-protection`
  that the same managed transform was injecting).
- Added all security headers directly to `proxy.ts` so the app owns them
  independently of any CDN configuration.

Verified live (`curl -sI https://www.verdebliss.com/`):
- `x-frame-options: DENY` ✅
- `referrer-policy: strict-origin-when-cross-origin` ✅
- `x-content-type-options: nosniff` ✅
- `permissions-policy: accelerometer=(), ...` ✅
- `strict-transport-security: max-age=63072000; includeSubDomains; preload` ✅
- `cross-origin-opener-policy: same-origin` ✅
- `cross-origin-resource-policy: same-site` ✅
- `x-xss-protection` — absent ✅

### 8.2 Apex redirect — ✅ fixed (308, June 2026)

Updated to 308 (permanent) in Vercel. `proxy.ts` 308 remains as defence-in-depth.
Crawlers will now consolidate link-equity to `www.verdebliss.com`.

### 8.3 robots.txt managed content — left as-is (June 2026)

No performance or security impact. The known trade-offs (Lighthouse robots-txt
validation failure, duplicate `User-agent: *` group, AI bot blocking) are
accepted for now. Revisit if AI-search visibility becomes a priority.

### 8.4 Known console noise (no action)

- `401` from `challenges.cloudflare.com/.../pat/...` — Cloudflare's Private
  Access Token probe; 401 is the *designed* fallback path on browsers without
  PAT support. Not an app error.
- `Permissions policy violation: picture-in-picture` — the challenge-platform
  script probes features our deliberately strict `Permissions-Policy` denies.
  Keep the policy strict.
- Scrape Shield's `email-decode.min.js` is injected by Cloudflare on every
  page; disable under Scrape Shield → Email Address Obfuscation if the extra
  third-party script is unwanted (emails on the site are already rendered from
  env-driven constants).
