# VerdeBliss audit remediation implementation report

This package applies the required audit fixes against the uploaded source code. The changes focus on production integrity for checkout, security, data consistency, SEO, and D2C operating workflows.

## Critical / P0 fixes applied

### Server-owned Razorpay checkout sessions

- Added `checkout_sessions` to `supabase/schema.sql`.
- `/api/checkout/create-razorpay-order` now creates a Razorpay order and stores a trusted server-side checkout snapshot before opening the Razorpay modal.
- `/api/checkout/verify-razorpay` no longer trusts browser-submitted cart or address data. It verifies the signature, fetches Razorpay payment details, validates amount/currency/order ownership against `checkout_sessions`, and completes the order idempotently.
- Added payment uniqueness indexes on `orders.payment_id` and checkout session payment/order IDs.

### Razorpay webhook reconciliation

- Added `/api/webhooks/razorpay`.
- Webhook payloads are verified with `RAZORPAY_WEBHOOK_SECRET`.
- Successful `payment.captured` / `payment.authorized` events can complete the checkout if the browser callback is lost.
- Duplicate webhook events are tolerated for Razorpay retry behavior.

### Payment / order idempotency

- Added unique payment/order indexes.
- `persistOrder` now returns the existing order when the same provider payment ID is seen again.
- `payment_events` records Razorpay/COD events for reconciliation.

### Profile and loyalty hardening

- Removed unsafe direct loyalty mutation paths from the checkout flow.
- `apply_loyalty_points` remains service-role only.
- Added trigger protection for `profiles.points`, `profiles.tier`, and `profiles.is_staff`.
- Added `update_profile_basics` RPC for safe customer-editable profile fields.
- Added column-level update grant only for `full_name`, `avatar_url`, `skin_type`, and `updated_at`.

### Product catalogue consistency

- Updated `schema.sql` seed prices to match the current product catalogue and uploaded screenshot.
- Chatbot catalogue is generated from canonical product data instead of stale hardcoded prices.
- Numeric product URLs redirect permanently to slug URLs when a slug is available.

### Build gates

- Removed `eslint.ignoreDuringBuilds` and `typescript.ignoreBuildErrors` from `next.config.ts`.
- Separate `npm run lint` and `npx tsc --noEmit` checks pass.

## High / P1 fixes applied

### Refund eligibility checks

- `/api/refunds/request` now verifies authenticated user ownership of the order.
- Rejects non-paid/non-confirmed orders, cancelled/refunded orders, duplicate open refund requests, and requests outside the 14-day window.
- Added a partial unique index to prevent multiple open refund requests for the same order.

### Inventory movement tracking

- Added `inventory_movements` table.
- Added `reserve_inventory_for_order` service-role RPC.
- Order finalization reserves/decrements inventory and records the movement.

### Contact/newsletter production behavior

- Contact and newsletter APIs no longer silently succeed in production when Supabase service role persistence is missing.
- Local development can still return a non-stored success for easier frontend testing.

### Product structured data

- Product JSON-LD now includes merchant shipping and return policy metadata in addition to offers and aggregate rating.

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
```

`RAZORPAY_WEBHOOK_SECRET` must match the secret configured in the Razorpay Dashboard webhook settings.

## Validation performed

```text
npm run format:check  ✅ passed
npm run lint          ✅ passed
npx tsc --noEmit      ✅ passed
npm test              ✅ passed — 52 tests
npx next build --experimental-build-mode generate --no-lint ✅ passed
```

`npm run build` compiled successfully but did not return cleanly in this sandbox after the Next.js type/lint/page-data phase. This repository was therefore also validated with standalone lint/typecheck plus `next build --experimental-build-mode generate --no-lint`, which completed and produced the full route table.

## Deployment notes

1. Run `supabase/schema.sql` before deploying the patched frontend.
2. Set the environment variables above in Vercel Production and Preview.
3. Configure Razorpay webhook URL: `/api/webhooks/razorpay`.
4. Clear old browser cart/localStorage if previous builds stored UUID/static product IDs that no longer exist.
