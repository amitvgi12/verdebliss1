# VerdeBliss — Next.js D2C Organic Skincare Storefront

Production-oriented D2C storefront for VerdeBliss organic cosmetics. The app uses Next.js App Router, TypeScript, Tailwind tooling, Supabase Postgres/Auth/RLS, Razorpay Checkout, and a Gemini-powered support chatbot.

Live site: https://www.verdebliss.com/

## Current architecture

```text
Customer browser
  ├─ Next.js App Router pages and client components
  ├─ Zustand cart/auth/wishlist/toast stores
  └─ Razorpay Checkout modal
       ↓
Next.js server routes
  ├─ /api/checkout/create-razorpay-order
  ├─ /api/checkout/verify-razorpay
  ├─ /api/checkout/cod
  ├─ /api/webhooks/razorpay
  ├─ /api/contact
  ├─ /api/newsletter
  ├─ /api/refunds/request
  ├─ /api/chat
  └─ /api/version
       ↓
Supabase Postgres + RLS
  ├─ products, profiles
  ├─ checkout_sessions
  ├─ orders, order_items
  ├─ payment_events
  ├─ inventory_movements
  ├─ loyalty_ledger
  ├─ reviews
  ├─ refunds
  ├─ contact_tickets, customer_consents
  └─ api_rate_limits
```

## Key production controls

- Checkout is server-owned. The browser cannot directly create paid orders.
- Razorpay order creation happens in `/api/checkout/create-razorpay-order`.
- Razorpay success is verified in `/api/checkout/verify-razorpay` using the server secret.
- Webhook events are verified in `/api/webhooks/razorpay` with `RAZORPAY_WEBHOOK_SECRET`.
- Final order creation uses the `public.finalize_commerce_order(...)` Postgres RPC so order, items, inventory, payment event, and loyalty points commit atomically.
- Supabase RLS prevents customers from inserting or mutating orders, payment events, inventory movements, or loyalty points directly.
- Public APIs use database-backed rate limiting via `public.check_api_rate_limit(...)` with a local fallback for development.
- Product detail pages redirect numeric IDs to slug URLs and render Product JSON-LD with shipping/returns data.
- Approved product reviews are server-rendered on first load and hydrated client-side for review submission.
- Product cards use semantic `article`, `Link`, and `button` controls instead of clickable parent `div`s.

## Tech stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS tooling
- Supabase Postgres, Auth, RLS
- Razorpay Checkout
- Google Gemini API for support chatbot
- Zustand for client state
- Framer Motion for selected interactions
- Vitest + React Testing Library
- ESLint flat config + Prettier

## Repository structure

```text
app/                         Next.js App Router pages and API routes
components/                  UI, layout, cart, chat, review components
constants/                   Product, theme, shipping, compliance constants
hooks/                       Product/window hooks
lib/                         Commerce, SEO, Supabase, rate-limit helpers
store/                       Zustand stores
supabase/                    Idempotent schema and seed data
tests/                       Unit/component tests
public/                      Optimized assets, manifest, robots
```

## Environment variables

Create `.env.local` for local development and configure the same values in Vercel for deployment.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_or_live_xxxxx
RAZORPAY_KEY_ID=rzp_test_or_live_xxxxx
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

GEMINI_API_KEY=
NEXT_PUBLIC_GIT_SHA=local
NEXT_PUBLIC_BUILD_TIME=local
```

Notes:

- `NEXT_PUBLIC_RAZORPAY_KEY_ID` is safe for the browser.
- `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, and `SUPABASE_SERVICE_ROLE_KEY` must remain server-only.
- GitHub Secrets do not automatically become Vercel runtime variables unless the deployment workflow passes them through.

## Supabase setup

Run in this order:

```sql
-- 1. Required schema, safe to re-run
supabase/schema.sql

-- 2. Optional demo/test data
supabase/seed_test_data.sql
```

The schema is idempotent. It uses `create table if not exists`, `alter table ... add column if not exists`, `drop policy if exists`, and `drop trigger if exists` where appropriate.

## Razorpay setup

1. Add `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_ID`, and `RAZORPAY_KEY_SECRET`.
2. Configure webhook URL:

```text
https://www.verdebliss.com/api/webhooks/razorpay
```

3. Add the webhook secret to `RAZORPAY_WEBHOOK_SECRET`.
4. Enable at least `payment.captured` and `payment.authorized` events.

## Development

```bash
npm ci
npm run dev
```

## Validation commands

```bash
npm run format:check
npm run lint
npx tsc --noEmit
npm test
npm run build
```

## Production deployment checklist

1. Run `supabase/schema.sql`.
2. Confirm all server-only environment variables are configured in Vercel Production.
3. Configure Razorpay webhook and secret.
4. Deploy.
5. Open `/api/version` and verify the deployed Git SHA/build time.
6. Test checkout with Razorpay test keys.
7. Test COD, contact, newsletter, review submission, refund request, and chatbot flows.
8. Clear browser cart/localStorage if old cart rows contain stale product IDs.

## Documentation files retained

- `README.md` — current architecture, setup, validation, deployment.
- `PRODUCTION_NOTES.md` — production-hardening notes and known follow-ups.
- `QA_TEST_CASES.md` — manual QA checklist.
- `supabase/README_RUN_SCHEMA.md` — Supabase SQL run notes.
