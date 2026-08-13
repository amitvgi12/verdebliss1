# CLAUDE.md — VerdeBliss

Project memory for Claude Code. Keep this short and durable.

## Stack
Next.js 16 (App Router) · React 19 · Supabase (Postgres + RLS) · Razorpay ·
Upstash Redis · Resend · Cloudflare WAF/Turnstile (in front of Vercel) · Tailwind v4.
Package manager: npm. Production truth: `main` branch.

## Commands
- Full gate (run before declaring done): `npm run verify`
  (= lint → typecheck → vitest → build → a11y)
- Unit: `npm test`  ·  Watch: `npm run test:watch`  ·  Coverage: `npm run test:coverage`
- E2E: `npm run test:e2e`  ·  a11y: `npm run test:a11y`  ·  Visual: `npm run test:visual`
- Launch gates: `npm run test:launch`
- Live smoke (against deployed URL): `npm run test:live`
- Typecheck only: `npm run typecheck`  ·  Lint: `npm run lint`  ·  Format: `npm run format`
- Schema drift check: `npm run schema:drift`

## Architecture invariants — DO NOT "fix" these; they are intentional
- **Origin gate:** `proxy.ts` (Next 16 middleware, Node runtime) requires the
  Cloudflare→origin secret header on `/api/*`. `CF_ORIGIN_GATE_REQUIRED=true`
  fails CLOSED (503). Removing Cloudflare from the serving path 503s the API.
- **CSP is route-aware:** dynamic routes get a per-request nonce + strict-dynamic;
  static/ISR routes use unsafe-inline for scripts they cannot nonce. Expected.
- **JSON-LD must be INLINE** via `<StructuredData>` (escaped with `safeJsonLd`).
  Never external `<script type="application/ld+json" src=…>` — crawlers ignore it.
- **Money is server-authoritative:** browser cart/prices are re-derived from DB in
  `lib/commerce.ts`; captured amount is verified against the checkout_sessions row.
  Order finalize is one atomic RPC; idempotency is triple-guarded. Don't trust client totals.
- **GST is tax-INCLUSIVE.** Customer-facing copy must say "Inclusive of all taxes" /
  "MRP inclusive of all taxes" — never add a separate tax line at checkout.
- **Badge matching keys off a stable enum, not display copy.** `lib/product-claims.ts`
  holds one `BADGE_CLAIMS` source of truth (key + display + disclosure + raw aliases);
  consumers match via `getProductBadgeKey`/`getProductBadgeKeys` (`ProductBadgeKey`).
  Never re-introduce substring matching on display strings — a copy edit would
  silently drop rows.
- **Don't serialize the raw PRODUCTS array to the client.** Nav search uses the
  trimmed `PRODUCT_SEARCH_INDEX`; raw claim vocabulary must not reach the client.
- **Cron lives in GitHub Actions, not Vercel.** `.github/workflows/scheduled-tasks.yml`
  drives `/api/cron/*` (Hobby caps Vercel crons at 2 jobs, daily only). Auth is
  unchanged: `Authorization: Bearer $CRON_SECRET`, which must be set BOTH in
  Vercel (the route reads it) and as a GitHub repo secret (the caller sends it).
  Requests must target the `www` host so Cloudflare adds the origin-gate header.
- **`vercel.json` is schema-validated — no extra keys.** Unknown top-level
  properties (even `_`-prefixed "comment" keys) fail the deploy with
  `should NOT have additional property`. Notes go in CLAUDE.md or the workflow.

## Audit method (when asked to "audit")
- Evidence tiers: code-verified > live-rendered > inferred. Never assert a live
  fact (price, header, seller identity, GSTIN) without rendering/verifying it.
- The live `www` origin is behind Cloudflare bot protection; plain curl/fetch is
  challenged. Verify live state via the **Vercel deployment URL**, not www.
- Lenses: Solution Architect · UI/UX · Lead QA · Security · Performance ·
  SEO/Accessibility · D2C Commerce.
- Prior full audit: `docs/VerdeBliss_Production_Audit_2026.md`

## Launch gates (NOT in repo — manual/business actions)
- [ ] Search Console: URL Inspection live test + submit sitemap.xml
- [ ] Razorpay: swap to LIVE keys; one real txn + webhook reconciliation check
- [ ] Verify real GSTIN on GST portal + confirm support phone line
- [ ] DNS: grey-cloud `email.verdebliss.com → mailgun.org` (DNS only)
- [ ] Copy pass: evict engineering jargon from customer surfaces; add one
      sensory/outcome line per product