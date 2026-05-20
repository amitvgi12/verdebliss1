# VerdeBliss Production Runbook

## Release checklist

1. `npm run format:check`
2. `npm run lint`
3. `npx tsc --noEmit`
4. `npm test -- --run`
5. `npm run build` in CI/Vercel with real environment variables
6. Run `supabase/schema.sql`
7. Confirm Razorpay webhook secret and webhook URL
8. Confirm `/api/version` returns current capability flags. Leave Git revision
   redacted in production unless `EXPOSE_BUILD_METADATA=true` is temporarily
   enabled for diagnostics.
9. Replace pre-launch `DEMO` values in `constants/businessCompliance.ts`
10. Verify per-product country-of-origin and manufacturer/packer/importer data in `constants/productCompliance.ts`

## Critical operational alerts

Configure Vercel log drain / Datadog / Logflare / equivalent alerts for:

- `[ALERT] payment_reconciliation_failed`
- `[EXCEPTION]`
- `/api/checkout/*` 5xx
- `/api/webhooks/razorpay` 4xx/5xx
- sudden increase in `api_rate_limits` blocks

## Payment reconciliation

Payment events are stored in `payment_events`. Reconciliation failures are stored in `payment_reconciliation_failures`.

Daily operator task until an admin dashboard exists:

```sql
select *
from payment_reconciliation_failures
where resolved_at is null
order by created_at desc;
```

For each unresolved row, verify the matching Razorpay payment in the Razorpay dashboard, then reprocess or manually create/repair the order through a controlled admin path.

## Review governance

Reviews must be submitted through `/api/reviews`; direct browser inserts are not allowed. The API verifies that the user has a paid or confirmed-COD order item for the product. Staff approval is still required before reviews become public.

## Claims governance

Avoid publishing numeric certification, customer-count, dermatologist, or verified-review claims unless supporting evidence exists and is linked in an internal approval record. Until a `claim_evidence` table/admin workflow exists, keep copy conservative.

## Commerce disclosure launch gate

Before live orders are enabled, replace every placeholder in `constants/businessCompliance.ts` and verify every PDP row in `constants/productCompliance.ts`. The footer, Organization JSON-LD, and PDP “Product & Seller Details” accordion all consume those values directly.
