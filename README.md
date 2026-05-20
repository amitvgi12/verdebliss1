# VerdeBliss — Next.js Commerce Platform

VerdeBliss is a production-oriented D2C skincare storefront built with **Next.js App Router**, **TypeScript strict mode**, **Tailwind CSS**, **Supabase**, and **Razorpay**.

The current architecture is server-first for SEO-critical routes and server-owned for payment/order integrity. Browser code never writes orders, payment events, loyalty points, or inventory movements directly.

## Current architecture

```text
Browser UI
  ├─ Server-rendered homepage, products, product detail, blog, policy pages
  ├─ Client islands: cart, checkout steps, account, filters, reviews form, chatbot
  └─ API calls use x-vb-client + Origin/Referer checks

Next.js API boundary
  ├─ /api/checkout/create-razorpay-order
  ├─ /api/checkout/verify-razorpay
  ├─ /api/checkout/cod
  ├─ /api/webhooks/razorpay
  ├─ /api/reviews
  ├─ /api/refunds/eligible-orders
  ├─ /api/refunds/request
  ├─ /api/contact
  ├─ /api/newsletter
  └─ /api/version

Supabase Postgres
  ├─ products, profiles
  ├─ checkout_sessions
  ├─ orders, order_items
  ├─ payment_events, payment_reconciliation_failures
  ├─ inventory_movements
  ├─ loyalty_ledger
  ├─ reviews with verified-purchase fields
  ├─ refunds, contact_tickets, customer_consents
  └─ api_rate_limits
```

## Production fixes included

- Server-owned Razorpay checkout sessions.
- Server-side Razorpay signature verification and payment amount/currency validation.
- Raw-body Razorpay webhook verification.
- Atomic order finalisation through `public.finalize_commerce_order(...)`.
- Inventory and loyalty updates happen inside the database transaction.
- Distributed Redis/KV-first API rate limiting with Supabase durable fallback.
- Strict TypeScript enabled.
- Homepage is server-rendered.
- `/products` now server-renders product cards instead of shipping an empty client shell.
- Product sitemap uses DB-first catalogue via `getProductsServer()`.
- Review submissions go through `/api/reviews` and require a purchased order item.
- Product detail no longer displays fake “verified reviews” counts when approved review data is unavailable.
- Newsletter copy no longer promises points that the backend does not award.
- UI containment helpers fix the edge-to-edge/misaligned layouts visible in the audit screenshots.
- Sentry SDK imports were removed from app modules because they caused Next build-trace instability in this repo; structured log signatures remain for log-drain alerting.
- Footer and PDP commerce disclosures now render from shared pre-launch compliance data.

## Required environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# GitHub Actions only: required for remote schema drift detection
SUPABASE_ACCESS_TOKEN=
SUPABASE_PROJECT_REF=
SUPABASE_DB_PASSWORD=

# Runtime rate limiter: use Upstash Redis REST or Vercel KV REST aliases.
# URLs must be REST HTTPS endpoints, not redis:// connection strings.
# A writable token is required; KV_REST_API_READ_ONLY_TOKEN is not used here.
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
# KV_REST_API_URL=
# KV_REST_API_REDIS_URL=
# KV_REST_API_KV_URL=
# KV_REST_API_TOKEN=
# KV_REST_API_READ_ONLY_TOKEN=

NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

GEMINI_API_KEY=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

NEXT_PUBLIC_BUILD_SHA=
NEXT_PUBLIC_BUILD_TIME=
NEXT_PUBLIC_APP_VERSION=
CF_ORIGIN_SECRET=
```

`/api/version` returns deployment metadata plus boolean capability flags for
public Supabase, Supabase admin, Razorpay, Turnstile, distributed rate limiting,
and static-fallback mode. It confirms runtime readiness without exposing secret
values. Production responses redact the Git revision unless
`EXPOSE_BUILD_METADATA=true` is set for a controlled diagnostic window.

## Local setup

```bash
npm ci
cp .env.example .env.local
npm run dev
```

## Database setup

Run in Supabase SQL editor:

```sql
-- 1. Main schema / migrations
supabase/schema.sql

-- 2. Optional local/demo data
supabase/seed_test_data.sql
```

`schema.sql` is idempotent and can be rerun on an existing project.

## Razorpay setup

1. Add `RAZORPAY_KEY_ID`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, and `RAZORPAY_KEY_SECRET` to Vercel.
2. Add webhook URL in Razorpay:

```text
https://www.verdebliss.com/api/webhooks/razorpay
```

3. Add `RAZORPAY_WEBHOOK_SECRET` to Vercel.
4. Subscribe at minimum to payment authorized/captured/failed events.
5. Monitor `payment_reconciliation_failures` and `[ALERT] payment_reconciliation_failed` log events.

## Validation commands

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

CI treats these as mandatory failing gates before deployment:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run schema:drift
```

`npm run schema:drift` compares the canonical `supabase/schema.sql` against the linked Supabase
project and requires these GitHub repository secrets: `SUPABASE_ACCESS_TOKEN`,
`SUPABASE_PROJECT_REF`, and `SUPABASE_DB_PASSWORD`.

## Production runbook summary

- Treat `payment_reconciliation_failures` as an operational queue.
- Wire log alerts for `[ALERT] payment_reconciliation_failed`, `[EXCEPTION]`, and checkout API 5xx spikes.
- Do not restore hardcoded review counts; use approved review aggregates only.
- Do not promise loyalty points unless a `loyalty_ledger` event is actually created.
- Keep product catalogue DB-first; `constants/products.ts` is only fallback data.
- Replace every `DEMO` commerce disclosure before accepting live orders. See `constants/businessCompliance.ts` and `constants/productCompliance.ts`.

## Pre-launch compliance placeholders

The app currently ships with deliberately fake disclosure values so layout, SEO, and PDP presentation can be tested before launch. They are not valid legal registrations.

Update these files before accepting real consumer orders:

- `constants/businessCompliance.ts`
  - legal name
  - `CIN`
  - `GSTIN`
  - full registered-office address
  - principal place of business
  - helpline and support hours
  - grievance-officer name, designation, and email
- `constants/productCompliance.ts`
  - country of origin for each product
  - manufacturer, packer, importer
  - CDSCO import-licence number only where an imported cosmetic requires it

After replacing those values, verify the footer, PDP “Product & Seller Details” accordion, Organization JSON-LD, and policy links in production.

### Legacy Sentry config cleanup

This package intentionally does **not** install `@sentry/nextjs`. Earlier builds used root-level `sentry.edge.config.ts`, `sentry.server.config.ts`, or `sentry.client.config.ts`. If you copy this package over an older checkout instead of deploying from a clean clone, those orphan files can remain and Next.js will try to compile them, causing:

```text
Cannot find module '@sentry/nextjs'
```

`npm run build` now runs `scripts/cleanup-legacy-sentry.mjs` first and removes those stale files automatically. For manual cleanup, delete any root-level `sentry.*.config.*` files before building.
