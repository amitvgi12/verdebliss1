# Running the Supabase schema

`schema.sql` is idempotent and safe to re-run on an existing Supabase project.

It uses:

- `create table if not exists`
- `alter table ... add column if not exists`
- `drop trigger if exists`
- `drop policy if exists`
- conditional static product seeding only when `public.products.id` is text

## What the schema provides

- Products, profiles, wishlist, addresses, reviews, refunds.
- Checkout sessions, orders, order items, payment events.
- Loyalty ledger and inventory movement ledger.
- Contact tickets and newsletter/customer consent storage.
- `api_rate_limits` plus `check_api_rate_limit(...)` for DB-backed public API throttling.
- `finalize_commerce_order(...)` for atomic checkout finalisation.
- Staff/customer RLS policies and service-role-only mutation functions.

## Recommended order

1. Run `supabase/schema.sql` in Supabase SQL Editor.
2. Optionally run `supabase/seed_test_data.sql` for demo/test data.
3. Set `SUPABASE_SERVICE_ROLE_KEY`, Razorpay keys, and `RAZORPAY_WEBHOOK_SECRET` in Vercel.
4. Redeploy the app.

## Existing UUID product tables

If your existing `products.id` column is `uuid`, the script preserves it and skips static text-ID product seeding. The app checkout API uses Supabase product IDs as the authoritative source for prices and order totals.
