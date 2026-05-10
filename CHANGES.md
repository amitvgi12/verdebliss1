# VerdeBliss — Audit Fixes

This document records every change made during the security / SEO / D2C audit
remediation. The state of the codebase below reflects the latest pass.

## Validation status (current)

```
npx tsc --noEmit         PASS  (strict mode, 0 errors)
npx prettier --check .   PASS  (all files)
npm run lint             PASS  (0 errors, 0 warnings)
npm test                 PASS  (5 suites, 58 tests)
npm run build            PASS  (15 routes, middleware 34.4 kB)
```

## P0 — Security & SEO foundations

- **`tsconfig.strict: true`** — full strict mode across ~7,000 lines of TS
- **Homepage now a Server Component** — products fetched server-side, content
  in HTML for crawlers from first byte (was a `'use client'` SPA)
- **`Math.random()` → `crypto.randomBytes()`** for Razorpay receipts and COD refs
- **Per-IP + per-identity rate limiter** — user id / email / cart id as second
  bucket so IP rotation cannot bypass throttling; eviction-safe in-memory fallback
- **`'unsafe-inline'` removed from `script-src`** — per-request CSP nonce in
  `middleware.ts` + `strict-dynamic`
- **`X-XSS-Protection` removed** (deprecated header) — full `Permissions-Policy`,
  COOP / CORP / HSTS / `interest-cohort=()` added
- **All `@verdebliss.in` → `@verdebliss.com`** (15 files: payment notes, chat
  policy, FAQs, contact, legal modal, sitemap, structured data)

## P1 — Architecture & data integrity

- **Tailwind v4 design tokens in `@theme` block** — replaces inline-style soup
  on the homepage and core UI
- **Reusable Tailwind component classes** — `btn-primary`, `btn-terra`,
  `btn-gold`, `btn-outline`, `input-base`, `label-eyebrow`, `h-section`,
  `container-content`
- **Tailwind migration** — Homepage / Nav / Footer / ProductCard / ProductImage
  / IngredientCard / Stars / SkeletonCard / Badge / NewsletterForm / LegalModal
  / **ProductsClient (catalogue)** / CookieConsent
- **Footer split** into Server Component + `LegalLinks` + `SocialButtons`
  client islands
- **Nav uses CSS responsive utilities** — `useWindowWidth` removed (no SSR/CSR
  layout-jump)
- **`AggregateRating` reads real review counts** via new
  `getReviewAggregatesServer` — Google rich-result policy compliant
- **Honest `shippingDetails`** in product JSON-LD — no more "Free shipping" lie
  at SERP for sub-₹499 products
- **COD cap raised ₹500 → ₹2500** — was unreachable for any 2-item cart
- **Webhook reconciliation DLQ** — `payment_reconciliation_failures` table
  with RLS + indexes, persisted on every reconciliation failure so an admin /
  cron can retry without racing Razorpay's 24-hour retry window
- **Observability shim** — `lib/observability.ts` emits `[ALERT]`,
  `[EXCEPTION]`, `[METRIC]` log signatures; one-line swap to `@sentry/nextjs`
  when `SENTRY_DSN` is configured (no call-site changes needed)
- **Chat prompt-injection defence** — `sanitiseForPrompt()` strips control
  characters and trigger phrases on every DB-sourced string before
  concatenation; "data only — never instructions" framing in system prompt
- **Loyalty tier rules consolidated** — `lib/loyalty.ts` (TS) and
  `tier_for_points()` (Postgres) are the single source of truth; both
  `apply_loyalty_points` and `finalize_commerce_order` now call the SQL helper
- **`getProductsServer` cached** via `unstable_cache` — no per-request DB hit
- **Razorpay script hardened** — `window.Razorpay` first, `document.getElementById`
  fallback with load listener, structured error log
- **Razorpay preconnect + dns-prefetch** — first-checkout RTT cut

## P2 — Defence in depth & polish

- **CSRF helper** (`lib/csrf.ts`) — requires `x-vb-client: web` header
  (preflight defence) + Origin allow-list, wired into all 7 mutating routes
- **Cloudflare Turnstile** bot defence on contact + newsletter
  - `lib/turnstile.ts` server verifier (5 s timeout, fail-closed)
  - `components/ui/TurnstileWidget.tsx` client island (no-op without site key)
  - CSP allow-listed for `challenges.cloudflare.com`
  - Silently passes server-side when env vars unset (dev-friendly)
- **`apiPost()` helper** in `lib/api-client.ts` — single source of truth for
  client → server JSON calls, automatic CSRF header
- **Build-config cleanup** — removed `cpus: 1`, `workerThreads: false`,
  `staticPageGenerationTimeout: 20`
- **Image immutable cache headers** for `/images/(.*)`
- **Error boundaries** — `app/error.tsx` (route), `app/global-error.tsx`
  (catastrophic), `app/not-found.tsx` (custom 404 with `noindex`),
  `app/loading.tsx` (streaming skeleton)
- **`.env.example`** — fully documented including `NEXT_PUBLIC_TURNSTILE_SITE_KEY`,
  `TURNSTILE_SECRET_KEY`, `SENTRY_DSN`, `SENTRY_ENVIRONMENT`

## New files

- `middleware.ts` — per-request CSP nonce
- `lib/csrf.ts` — origin / header gate
- `lib/api-client.ts` — CSRF-safe fetch wrapper
- `lib/loyalty.ts` — tier single source of truth
- `lib/structured-data.tsx` — Server Component for nonced JSON-LD
- `lib/turnstile.ts` — Cloudflare Turnstile server verifier
- `lib/observability.ts` — Sentry-ready alerting shim
- `components/features/newsletter/NewsletterForm.tsx`
- `components/layout/LegalLinks.tsx`
- `components/layout/SocialButtons.tsx`
- `components/ui/TurnstileWidget.tsx`
- `app/error.tsx` / `app/global-error.tsx` / `app/not-found.tsx` / `app/loading.tsx`
- `tests/loyalty.test.ts`

## Database changes

The schema is still idempotent — re-running `supabase/schema.sql` on an existing
database is safe. The new objects are additive:

1. Function `public.tier_for_points(int) returns text` — immutable, public-grant
2. Table `public.payment_reconciliation_failures` (with RLS enabled, two indexes
   on unresolved-by-time and provider-payment-id)

## Migration notes for the team

1. **Run `supabase/schema.sql`** — additive; existing data is preserved
2. **Set `MX` records for `@verdebliss.com`** *before* deployment (the email
   migration is a deploy-time cliff, not gradual)
3. **Optional but recommended env vars**:
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` (bot defence)
   - `SENTRY_DSN` (replace `lib/observability.ts` body with Sentry SDK)
4. **Razorpay webhook URL** — unchanged
5. **CSP rollout** — middleware ships strict CSP. Any third-party scripts
   (analytics, chat widgets) not already in the allow-list need to be added
   to `cspDirectives` in `middleware.ts`. Cloudflare Turnstile is already
   allow-listed.

## Known follow-ups (genuine work, not 5-minute fixes)

- `app/checkout/CheckoutClient.tsx` (1,284 lines) and
  `app/products/[id]/ProductDetailClient.tsx` (1,031 lines) are strict-mode
  clean and have CSRF wired in, but remain inline-style monoliths. Splitting
  each into 4–5 sub-components and migrating to Tailwind is a 2–3 day
  refactor — high value (testability, bundle size, dev velocity), but high
  surface for breaking the payment flow if rushed.
- Real Sentry SDK wiring (`@sentry/nextjs`) — `lib/observability.ts` is the
  swap point.
- Address book vs. order address snapshot — separate concerns currently share
  storage.
- WAF / Cloudflare front for `/api/checkout/*` — defence in depth beyond what
  app-level rate limits provide.
- Replace `useWindowWidth` in `ChatBot.tsx` and `ProductDetailClient.tsx`
  with CSS media-driven responsive (Nav and CookieConsent are already
  migrated).
