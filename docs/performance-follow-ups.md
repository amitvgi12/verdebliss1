# Performance Follow-ups

These items are launch-relevant performance debts that should stay visible during CWV reviews.

## TTFB / server latency (Speed Insights)

Speed Insights showed **TTFB as the bottleneck** (P75 ~2s, Poor), which dragged
FCP (2.28s) and LCP (2.71s) into "needs improvement" — note `LCP − TTFB ≈ 0.74s`,
so the page render is fast and the server response is the problem. INP/CLS/FID
are all great. On a very low-traffic site (≈13–21 samples/route/day) P75 is
noise-dominated and skewed by serverless cold starts + ISR cache evictions.

Done:

- **Region co-location** — `vercel.json` now pins functions to `bom1` (Mumbai) to
  match the Supabase region and the India audience, cutting cross-region DB
  latency and user distance on every render.
- **Cache-warming cron** — `/api/cron/warm` (every 10 min) pings `/`, `/products`,
  a PDP, and `/faq` so a stale/evicted ISR entry re-renders on the cron instead
  of for the next real visitor. Requires a Pro plan (sub-daily crons) and
  `CRON_SECRET` set; on Hobby, point an external pinger (e.g. cron-job.org) at
  the same endpoint instead.

Still worth doing:

- Lighten the root layout's per-request `getProductsServer()` (Nav) so dynamic
  routes don't block on Supabase; cache it longer or source nav from the static
  shell.
- `/faq` and `/blog/[slug]` render dynamically because `<StructuredData>` calls
  `headers()`; switch them to the headers-free `InlineStructuredData` so they
  become ISR again (lower TTFB).
- Re-measure after a few deploy-free days and at P90/P95 — current P75 over ~13
  samples is not trustworthy.

## P1: Split and Audit Global CSS

- Current state: `app/globals.css` is ~85 KB / 4,246 lines (was 90 KB / 4,423), still render-blocking on every route.
- Risk: one large global stylesheet is render-blocking across pages that use only a subset of the selectors.
- Follow-up: continue moving route-exclusive styles into route-level CSS where Next code-splits them, keeping only tokens/base primitives + sitewide components in `app/globals.css`.
- Validation: compare Lighthouse/WebPageTest render-blocking CSS and LCP before and after each split on home, products, PDP, quiz, account, and checkout.

### Done

- **Journal (`/blog`) → `app/blog/blog.css`** and **Press (`/press`) → `app/press/press.css`**.
  Both `journal-*`/`press-*` prefixes are used on exactly one route, so the rules
  code-split into ~1.3 KB route chunks and no longer ship in the global chunk
  (verified: the 106 KB global CSS chunk contains zero journal/press selectors).

### Recipe for the next safe extraction

1. Pick a class prefix and confirm it is used on exactly one route:
   `grep -rlE "<prefix>-" app components` should return a single `page.tsx`.
2. Confirm the prefix is **not** sitewide. Several prefixes are NOT safe to move:
   `premium-*` (home/PDP/products), `ingredient-*` (homepage IngredientCard),
   `editorial-*`, and the compare-bar/modal + footer styles (rendered in the
   root layout) — these must stay in `app/globals.css`.
3. Watch the **grouped responsive blocks** near the end of `globals.css`: some
   `@media` queries comma-group selectors across pages (e.g. `.journal-grid,
   .press-*-grid, .commitment-grid, .contact-layout`). When extracting one page,
   pull only its selectors out of the shared group and leave the rest intact.
4. Create `app/<route>/<route>.css`, move the rules (keeping their original
   relative order so the cascade is unchanged), and `import './<route>.css'` in
   that route's `page.tsx`.
5. `npm run build`, then confirm the route's selectors live in a small route CSS
   chunk and are absent from the large global chunk under `.next/static/chunks/`.

### Blocked / needs visual-regression tooling

The high-byte sections (`premium-*` "X10 premium D2C upgrade", ~1,200 lines) are
sitewide and shared across the highest-traffic routes, so they cannot be moved
without per-route untangling plus before/after visual diffs. Do these only with
a visual-regression harness (Playwright screenshots) covering home, products,
PDP, and each editorial page.
