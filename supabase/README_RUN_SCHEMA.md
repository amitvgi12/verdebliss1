# Running the Supabase schema

`schema.sql` is now idempotent and safe to re-run on an existing Supabase project.

It fixes the earlier duplicate relation error:

```text
ERROR: 42P07: relation "products" already exists
```

The script now uses:

- `create table if not exists`
- `alter table ... add column if not exists`
- `drop trigger if exists` before trigger creation
- `drop policy if exists` before policy creation
- conditional product seeding only when `public.products.id` is text

## Existing UUID product tables

If your existing `products.id` column is `uuid`, the script intentionally preserves it and skips the static text-ID product seed. The checkout API supports UUID product IDs from Supabase and text IDs from the static fallback.

## Recommended order

1. Run `supabase/schema.sql` in Supabase SQL Editor.
2. Make sure Vercel has `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_ID`, and `RAZORPAY_KEY_SECRET` set.
3. Redeploy the app.
