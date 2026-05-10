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
- DB-backed API rate limiting.
- Strict TypeScript enabled.
- Homepage is server-rendered.
- `/products` now server-renders product cards instead of shipping an empty client shell.
- Product sitemap uses DB-first catalogue via `getProductsServer()`.
- Review submissions go through `/api/reviews` and require a purchased order item.
- Product detail no longer displays fake “verified reviews” counts when approved review data is unavailable.
- Newsletter copy no longer promises points that the backend does not award.
- UI containment helpers fix the edge-to-edge/misaligned layouts visible in the audit screenshots.
- Sentry SDK imports were removed from app modules because they caused Next build-trace instability in this repo; structured log signatures remain for log-drain alerting.

## Required environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

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
npx tsc --noEmit
npm test -- --run
npm run build
```

In this sandbox, `next build` completed compilation/static generation but did not exit after build-trace collection. The two-phase Next build completed successfully:

```bash
npx next build --experimental-build-mode compile
npx next build --experimental-build-mode generate
```

Validate the standard `npm run build` on Vercel/GitHub Actions before deployment.

## Production runbook summary

- Treat `payment_reconciliation_failures` as an operational queue.
- Wire log alerts for `[ALERT] payment_reconciliation_failed`, `[EXCEPTION]`, and checkout API 5xx spikes.
- Do not restore hardcoded review counts; use approved review aggregates only.
- Do not promise loyalty points unless a `loyalty_ledger` event is actually created.
- Keep product catalogue DB-first; `constants/products.ts` is only fallback data.

### Legacy Sentry config cleanup

This package intentionally does **not** install `@sentry/nextjs`. Earlier builds used root-level `sentry.edge.config.ts`, `sentry.server.config.ts`, or `sentry.client.config.ts`. If you copy this package over an older checkout instead of deploying from a clean clone, those orphan files can remain and Next.js will try to compile them, causing:

```text
Cannot find module '@sentry/nextjs'
```

`npm run build` now runs `scripts/cleanup-legacy-sentry.mjs` first and removes those stale files automatically. For manual cleanup, delete any root-level `sentry.*.config.*` files before building.
