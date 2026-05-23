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
11. Confirm `CRON_SECRET` and `OPS_ALERT_WEBHOOK_URL` are configured and that
    the Vercel cron `/api/cron/reconciliation-alert` can post to the ops alert
    channel.
12. Before the final live launch, set `LAUNCH_MODE=true` in the production
    environment and confirm `npm run test:coverage` still passes.
13. Set `REVALIDATE_SECRET` in both GitHub Actions secrets **and** Vercel
    production environment variables (see below).

## REVALIDATE_SECRET — post-deploy ISR cache purge

After every production deploy, the CI pipeline calls `POST /api/revalidate` to
immediately purge the ISR cache for all product pages, the homepage, the product
catalogue, the blog, the FAQ, the certifications page, and the cookie policy.
Without this, stale HTML from the previous build can persist until the per-route
`revalidate` TTL (300 s) expires.

**Generate the secret (one-time):**

```bash
openssl rand -hex 32
```

**Register the same value in two places:**

| Location                    | How                                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------- |
| GitHub Actions secret       | Repo → Settings → Secrets and variables → Actions → New repository secret → name: `REVALIDATE_SECRET`   |
| Vercel environment variable | Project → Settings → Environment Variables → add `REVALIDATE_SECRET` for the **Production** environment |

**What happens if the secret is missing:**
The CI revalidation step prints a warning and exits 0 (deploy does not fail), but the
ISR cache is NOT purged. Each route will then serve stale HTML until its own TTL
expires — typically 300 s for product/content routes. The live smoke test's
build-SHA parity assertion (`all product PDPs are served from the same current build
as the homepage`) will catch any split-brain that survives into the next test run.

**Manual purge during incident response:**

```bash
curl -X POST https://www.verdebliss.com/api/revalidate \
  -H "x-revalidate-secret: <secret>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Response confirms which paths were purged:

```json
{
  "revalidated": true,
  "productId": "all",
  "paths": ["/", "/products", "/blog", "/faq", "/certifications", "/cookie-policy"]
}
```

## LAUNCH_MODE — pre-launch gate

Set `LAUNCH_MODE=true` in the Vercel production environment **before** enabling
live orders. This arms the `tests/launch-gates.test.ts` suite, which will fail CI if:

- Any `DEMO` placeholder remains in `businessCompliance.ts` or `productCompliance.ts`
  (including the manufacturer/packer/seller block, which inherits from the same constants)
- Any seeded review row matching the known seed phrases remains in the `reviews` table
- Any active product has unverifiable MRP data
- Any active product badge uses a hard certification claim

**Seed review purge (run once against production DB before launch):**

```bash
# In the Supabase SQL editor or psql against the production project:
\i supabase/purge_seeded_reviews.sql
```

The script is idempotent and recomputes product rating aggregates after deletion.

## Critical operational alerts

Configure Vercel log drain / Datadog / Logflare / equivalent alerts for:

- `[ALERT] payment_reconciliation_failed`
- `[EXCEPTION]`
- `/api/checkout/*` 5xx
- `/api/webhooks/razorpay` 4xx/5xx
- sudden increase in `api_rate_limits` blocks

## Payment reconciliation

Payment events are stored in `payment_events`. Reconciliation failures are stored in `payment_reconciliation_failures`.

The hourly Vercel cron at `/api/cron/reconciliation-alert` checks for unresolved
reconciliation failures older than 1 hour and posts a count/detail payload to
`OPS_ALERT_WEBHOOK_URL`.

Daily operator task until an admin dashboard exists:

```sql
select *
from payment_reconciliation_failures
where resolved_at is null
order by created_at desc;
```

For each unresolved row, verify the matching Razorpay payment in the Razorpay dashboard, then reprocess or manually create/repair the order through a controlled admin path.

## Razorpay capture mode

Confirm the account-level capture setting in the Razorpay dashboard before live
orders. Launch default: explicit auto-capture. If manual capture is enabled,
document who captures payments, how often, and how inventory is released when a
payment is authorised but never captured.

## Cloudflare origin gate rehearsal

Before launch:

1. With `CF_ORIGIN_SECRET` unset, confirm the direct Vercel deployment URL is
   reachable. This is the bypassable baseline.
2. Set `CF_ORIGIN_SECRET` in Vercel and configure the matching Cloudflare
   Transform Rule.
3. Confirm the direct Vercel deployment URL returns `403`.
4. Confirm `https://www.verdebliss.com/` still succeeds through Cloudflare.

## Backup and rollback drill

Run these drills once before accepting real orders:

- Restore a Supabase backup into a staging project and verify orders, profiles,
  payment events, and product rows are queryable.
- Deploy a deliberately broken preview build, then perform a Vercel rollback.
- Test a reversible database change in staging and document the rollback SQL.

## Review governance

Reviews must be submitted through `/api/reviews`; direct browser inserts are not allowed. The API verifies that the user has a paid or confirmed-COD order item for the product. Staff approval is still required before reviews become public.

## Claims governance

Avoid publishing numeric certification, customer-count, dermatologist, or verified-review claims unless supporting evidence exists and is linked in an internal approval record. Until a `claim_evidence` table/admin workflow exists, keep copy conservative.

## Commerce disclosure launch gate

Before live orders are enabled, replace every placeholder in `constants/businessCompliance.ts` and verify every PDP row in `constants/productCompliance.ts`. The footer, Organization JSON-LD, and PDP “Product & Seller Details” accordion all consume those values directly.

## Schema drift gate

The GitHub Actions schema-drift job is intentionally disabled while deployment
verification is ongoing. Re-enable it before live launch so database drift is a
release blocker again.
