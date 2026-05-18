# VerdeBliss — Audit Fixes

This document records every change made during the security / SEO / D2C audit
remediation. The state of the codebase below reflects the latest pass.

## Validation status (current)

```
npx tsc --noEmit         PASS  (strict mode, 0 errors)
npx prettier --check .   PASS  (all files)
npm run lint             PASS  (0 errors, 0 warnings)
npm test                 PASS  (6 suites, 66 tests)
npm run build            PASS  (15 routes, middleware 114 kB)
```

## P0 — Security & SEO foundations

- **`tsconfig.strict: true`** — full strict mode across ~7,000 lines of TS
- **Homepage now a Server Component** — products fetched server-side, content
  in HTML for crawlers from first byte (was a `'use client'` SPA)
- **`Math.random()` → `crypto.randomBytes()`** for Razorpay receipts and COD refs
- **Per-IP + per-identity rate limiter** — user id / email / cart id as second
  bucket so IP rotation cannot bypass throttling; eviction-safe in-memory fallback
- **`'unsafe-inline'` removed from `script-src`** — per-request CSP nonce in
  `proxy.ts` + `strict-dynamic`
- **`X-XSS-Protection` removed** (deprecated header) — full `Permissions-Policy`,
  COOP / CORP / HSTS / `interest-cohort=()` added
- **All `@verdebliss.in` → `@verdebliss.com`** (15 files: payment notes, chat
  policy, FAQs, contact, legal modal, sitemap, structured data)
- **Real bug fixed in checkout**: client had `COD_MAX_TOTAL = 500`, server
  had `2500`. Surfaced misleading "COD unavailable" copy to users above ₹500.
  Now both sides import from `constants/checkout.ts` (single source of truth).
- **`overflow-x: clip` on html/body/main** (visual fix from horizontal-scroll bug)

## P1 — Architecture & data integrity

- **Tailwind v4 design tokens in `@theme` block** — replaces inline-style soup
- **Reusable Tailwind component classes** — `btn-primary`, `btn-terra`,
  `btn-gold`, `btn-outline`, `input-base`, `label-eyebrow`, `h-section`,
  `container-content`
- **Tailwind migration of major surfaces** — Homepage / Nav / Footer /
  ProductCard / ProductImage / IngredientCard / Stars / SkeletonCard / Badge /
  NewsletterForm / LegalModal / **ProductsClient (catalogue)** /
  **CheckoutClient (orchestrator + 6 sub-components)** / CookieConsent /
  ProductDetailClient (breadcrumb)
- **Footer split** into Server Component + `LegalLinks` + `SocialButtons`
  client islands
- **Nav uses CSS responsive utilities** — `useWindowWidth` removed
- **`AggregateRating` reads real review counts** via `getReviewAggregatesServer`
- **Honest `shippingDetails`** in product JSON-LD
- **COD cap raised ₹500 → ₹2500**
- **Webhook reconciliation DLQ** — `payment_reconciliation_failures` table
  with RLS + indexes, persisted on every reconciliation failure
- **Observability shim** — `lib/observability.ts` emits `[ALERT]`,
  `[EXCEPTION]`, `[METRIC]` log signatures. **Sentry-ready**: when
  `SENTRY_DSN` is set, dynamically imports `@sentry/nextjs` and forwards
  events. `instrumentation.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`,
  `instrumentation-client.ts` all wired.
- **Chat prompt-injection defence** — `sanitiseForPrompt()` strips control
  characters and trigger phrases on every DB-sourced string
- **Loyalty tier rules consolidated** — `lib/loyalty.ts` (TS) and
  `tier_for_points()` (Postgres) are the single source of truth
- **`getProductsServer` cached** via `unstable_cache`
- **Razorpay script hardened** — `window.Razorpay` first, `document.getElementById`
  fallback with load listener
- **Razorpay preconnect + dns-prefetch**

## P2 — Defence in depth & polish

- **CSRF helper** (`lib/csrf.ts`) — `x-vb-client: web` header + Origin
  allow-list, wired into all 7 mutating routes
- **Centralised proxy-aware client-IP resolver** (`lib/client-ip.ts`):
  prefers `cf-connecting-ip` → `x-vercel-forwarded-for` → `x-forwarded-for` →
  `x-real-ip`. 8 unit tests covering precedence, spoofing resistance,
  empty-header handling.
- **Cloudflare Turnstile** bot defence on contact + newsletter
- **`apiPost()` helper** — single source of truth for client → server JSON calls
- **Build-config cleanup** — removed `cpus: 1`, `workerThreads: false`,
  `staticPageGenerationTimeout: 20`
- **Image immutable cache headers** for `/images/(.*)`
- **Error boundaries** — `app/error.tsx` (route), `app/global-error.tsx`
  (catastrophic), `app/not-found.tsx` (custom 404 with `noindex`),
  `app/loading.tsx` (streaming skeleton)
- **`.env.example`** — fully documented including `NEXT_PUBLIC_TURNSTILE_SITE_KEY`,
  `TURNSTILE_SECRET_KEY`, `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `CF_ORIGIN_SECRET`
- **Commerce-disclosure plumbing** — shared pre-launch business identity data now powers the footer and Organization JSON-LD, and PDPs expose product/seller details plus explicit inclusive-tax copy. Placeholder `DEMO` values are documented as a launch blocker.
- **`useIsMobile` hook** — SSR-safe `useSyncExternalStore` + `matchMedia`,
  replaces all `useWindowWidth` usage. The legacy hook is deleted.
- **Cloudflare WAF / origin gate**:
  - `proxy.ts` rejects `/api/*` requests without
    `x-cf-origin-secret` matching `CF_ORIGIN_SECRET` (env-gated, off by default).
    Webhooks and `/api/version` exempted.
  - **`CLOUDFLARE_WAF.md`** — full runbook covering DNS, origin lockdown
    (header secret + Authenticated Origin Pulls), WAF custom rules
    (bot block, Razorpay-IP allow-list, geo allow-list), rate-limit rules,
    cache rules, monitoring, verification curl commands, rollback procedure.

## Big refactor: CheckoutClient.tsx

**1284 lines → 413-line orchestrator + 6 single-purpose Tailwind sub-components:**

```
app/checkout/
  CheckoutClient.tsx        413  (orchestrator: state, validation, Razorpay flow)
  checkout-types.ts          33  (shared types)
  _components/
    Steps.tsx                47  (3-step progress indicator)
    Field.tsx                43  (form field + reusable inputClassName)
    AddressStep.tsx         125  (Step 0: delivery address form)
    ReviewStep.tsx          188  (Step 1: review + payment buttons)
    OrderSummary.tsx         91  (right-column sticky summary)
    SuccessState.tsx         99  (post-payment confirmation card)
```

The orchestrator is now small enough to read in one sitting; each sub-component
is independently testable; presentation is fully Tailwind. **No behaviour change
to the payment flow** — types, props, and state names are preserved end-to-end
to minimise regression risk.

## ProductDetailClient.tsx — partial extraction

- `initialProduct: any` → `Product | null` (real type-safety win)
- Breadcrumb migrated to Tailwind
- `PAOSymbol` and `Accordion` extracted to `app/products/[id]/_components/`
- Migrated from `useWindowWidth` to `useIsMobile`
- 1046 → 947 lines

The remaining gallery + buy-box + tabs + reviews JSX inside ProductDetailClient
has business state intertwined with rendering. That's the Cypress-coverage-needed
refactor still left for a focused session with E2E tests.

## New files

- `proxy.ts` — per-request CSP nonce + optional CF origin gate
- `lib/csrf.ts` — origin / header gate
- `lib/api-client.ts` — CSRF-safe fetch wrapper
- `lib/client-ip.ts` — proxy-aware IP resolver
- `lib/loyalty.ts` — tier single source of truth
- `lib/structured-data.tsx` — Server Component for nonced JSON-LD
- `lib/turnstile.ts` — Cloudflare Turnstile server verifier
- `lib/observability.ts` — Sentry-ready alerting shim
- `constants/checkout.ts` — client+server-safe COD threshold
- `hooks/useIsMobile.ts` — SSR-safe responsive hook
- `instrumentation.ts` / `instrumentation-client.ts` / `sentry.server.config.ts` /
  `sentry.edge.config.ts` — Sentry initialisation
- `components/features/newsletter/NewsletterForm.tsx`
- `components/layout/LegalLinks.tsx` / `components/layout/SocialButtons.tsx`
- `components/ui/TurnstileWidget.tsx`
- `app/error.tsx` / `app/global-error.tsx` / `app/not-found.tsx` /
  `app/loading.tsx`
- `app/checkout/_components/*` — 6 extracted checkout sub-components
- `app/products/[id]/_components/PAOSymbol.tsx`
- `app/products/[id]/_components/Accordion.tsx`
- `tests/loyalty.test.ts` / `tests/client-ip.test.ts`
- `CLOUDFLARE_WAF.md` — production hardening runbook

## Database changes

The schema is still idempotent — re-running `supabase/schema.sql` on an existing
database is safe. The new objects are additive:

1. Function `public.tier_for_points(int) returns text` — immutable, public-grant
2. Table `public.payment_reconciliation_failures` (with RLS enabled, two indexes
   on unresolved-by-time and provider-payment-id)

## Migration notes for the team

1. **Run `supabase/schema.sql`** — additive; existing data preserved
2. **Set `MX` records for `@verdebliss.com`** _before_ deployment
3. **Optional but recommended env vars**:
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` (bot defence)
   - `SENTRY_DSN` (real-time exception capture; observability shim already wired)
   - `CF_ORIGIN_SECRET` (when fronting with Cloudflare — see `CLOUDFLARE_WAF.md`)
4. **Razorpay webhook URL** — unchanged
5. **CSP rollout** — proxy ships strict CSP. Any third-party scripts
   (analytics, chat widgets) not already in the allow-list need to be added
   to `cspDirectives` in `proxy.ts`. Cloudflare Turnstile is allow-listed.

## Known follow-ups

- `app/products/[id]/ProductDetailClient.tsx` (947 lines) — the giant gallery +
  buy-box + tabs + reviews JSX block is still inline-styled. Splitting it is
  the Cypress-coverage-needed refactor.
- Address book vs. order address snapshot — separate concerns currently share
  storage.
- Real Cloudflare deployment — `CLOUDFLARE_WAF.md` is the runbook; the work
  itself is environment configuration (DNS, WAF dashboard).
