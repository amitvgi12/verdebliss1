# VerdeBliss production notes

This repository includes the current audit-remediated architecture for the VerdeBliss D2C storefront.

## Current production-hardening highlights

- Server-owned Razorpay checkout sessions.
- Server-side Razorpay signature verification and payment amount reconciliation.
- Razorpay webhook route with idempotent event recording and non-retry-loop reconciliation handling.
- Atomic order finalisation through `public.finalize_commerce_order(...)` in Postgres.
- Service-role-only order, payment, inventory, and loyalty mutation paths.
- Supabase RLS for customer data isolation.
- DB-backed public API rate limiting with local in-memory fallback for development.
- Product slug redirects and product JSON-LD through script tags.
- Server-rendered first page of approved product reviews.
- Semantic product cards using `article`, `Link`, and real buttons.

## Required deployment environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
GEMINI_API_KEY=
NEXT_PUBLIC_GIT_SHA=
NEXT_PUBLIC_BUILD_TIME=
```

## Required deployment steps

1. Run `supabase/schema.sql` in Supabase SQL Editor.
2. Run `supabase/seed_test_data.sql` only for test/demo data.
3. Configure Razorpay webhook URL: `/api/webhooks/razorpay`.
4. Deploy to Vercel with the environment variables above.
5. Confirm `/api/version` returns the expected Git SHA after deployment.

## Known follow-up items

- `tsconfig.json` still uses `strict: false` to preserve the current UI migration without breaking production build. The code no longer uses `@ts-nocheck`; move to strict mode component-by-component.
- Tailwind is installed, but much of the legacy UI still uses inline style objects. Migrate visual primitives gradually.
- Admin dashboards for products, orders, refunds, review moderation, shipment tracking, and support tickets are not included in this customer storefront package.
