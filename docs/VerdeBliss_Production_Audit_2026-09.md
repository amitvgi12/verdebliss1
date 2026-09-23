# VerdeBliss — Live + Code Production Audit (23 Sep 2026)

**Scope:** live `https://www.verdebliss.com` (primary external system) correlated with repo `main` @ `d842298` (primary implementation source).
**Method:** non-destructive only. Live HTML/headers/JS bundles/public API behaviour; anon-key read-only RLS probes against the live Supabase project; full read of the commerce, payment, refund, review, chat and auth code paths; `npm audit`. **No orders, payments, reviews, accounts or form submissions were created on production.**
**Prior audit:** `docs/VerdeBliss_Production_Audit_2026.md` (Aug 2026).

Evidence tags used throughout: **[LIVE]** observed on production · **[CODE]** read in repo · **[FACT]** deterministic check (checksum, header, HTTP status) · **[INF]** inference · **[UNK]** could not be verified from here.

---

## 00. RE-AUDIT AFTER DEPLOY (23 Sep 2026, live `x-build-sha: eb1fc7a` = `main`)

**Score: 69 → 78 / 100. Readiness: still NOT READY**, only because of the two deferred P0s, both re-confirmed live: GSTIN `05MODEE5678F1Z5` (footer, PDPs, Org JSON-LD) and `rzp_test_SZ3dNBE8k7p1N3` in the checkout bundle.

| Check | Result | Evidence |
|---|---|---|
| Deployed revision | ✅ | `x-build-sha eb1fc7a…` = `origin/main` |
| `/api/version` truthful | ✅ | `schemaVersion 2026-09-23-order-lifecycle-net-quantity`, `compliance.ok:false`, `warningCount:2`, `warningFields:[NEXT_PUBLIC_VERDEBLISS_GSTIN]` |
| Migration 1 (net qty + descriptions) | ✅ applied | anon `products` select returns `net_quantity` (all null) and the 8 canonical descriptions |
| Migration 2 (lifecycle trigger + guard) | ✅ applied (owner-run SQL) | `trg_orders_lifecycle` present; `protect_profile_privileged_fields` reads `request.jwt.claims`; `payment_reconciliation_failures` is empty, so the suspected guard bug never caused a recorded failure |
| Removed claims (9 phrases) | ✅ 0 occurrences | without irritation/harshness, 30ml, Vegan Lip Gloss, organic blog titles, Organic Commitment, 12 co-ops, FAQ tier perks, seed descriptions |
| New copy (14 strings) | ✅ all present | canonical descriptions, toner BHA/12+ note, sun-shield qualifier, blog titles, FAQ loyalty, privacy (Resend, couriers, chat, 23 Sep date) |
| Loyalty UI (client bundle) | ✅ | "redeemable value", "Free express shipping", "Birthday bonus", "First Purchase", "Per Review" absent; new copy present |
| PDP LCP image | ✅ | hero no longer `loading="lazy"`; `<link rel="preload" as="image">` emitted |
| Product JSON-LD | ✅ | reviewed description, no `size` (data null), no `aggregateRating` (0 reviews) |
| Security headers | ✅ unchanged | CSP, HSTS preload, XFO DENY, nosniff, Referrer-Policy, Permissions-Policy |
| API gates (12 probes) | ✅ | new `/api/cron/expire-cod-holds` 401; cancel/admin/refunds 401; CSRF 403; Turnstile 400; webhook sig 400; chat consent 403; revalidate 401 |
| RLS (anon) | ✅ | orders, loyalty_ledger, profiles, checkout_sessions, refunds → `[]` |
| Performance | ✅ slight gain | brotli JS home 270→258 KB, PDP 344→332, checkout 336→324; TTFB home 0.59–0.83 s, PDP 0.57–0.70 s, `/products` 0.86–0.96 s (was 1.0–1.9) |
| Dependencies | ✅ | `npm audit --omit=dev`: 0 |

**Still open:** P0 GSTIN + Razorpay live keys · `net_quantity` data entry · Sun Shield SPF decision · dial `0135 2000 000` · retention periods · Gemini paid tier · confirm `OPS_ALERT_WEBHOOK_URL` is set (without it the alert reporter is inert) · P3 list (F-14/15/16/18/21/22, `/shop` still 404).

**Migration 2 verification (run 23 Sep 2026: all passed):**
```sql
select tgname from pg_trigger where tgname = 'trg_orders_lifecycle';                         -- expect 1 row
select prosrc like '%request.jwt.claims%' from pg_proc where proname = 'protect_profile_privileged_fields'; -- expect true
select failure_reason, count(*) from payment_reconciliation_failures group by 1;             -- look for "Direct updates to profile points"
```

**Revised scores:** Architecture 9 (+1) · Security 17 (+2) · Payment 11 (+1) · E-commerce 8 (+2) · SEO 8 · Performance 8 (+1) · Accessibility 4 · UX/CRO 6 · Privacy/Compliance 3 (+1) · Observability 4 (+1) = **78**.

---

## 0. REMEDIATION LOG: P1 + P2 (23 Sep 2026, uncommitted working tree; P0s intentionally deferred)

| Finding | Status | Change |
|---|---|---|
| F-03 Next advisories | Fixed | `next`/`@next/eslint-plugin-next` 16.2.6 → **16.3.6** (16.2.x still carried two critical RCE advisories). `postcss` override **bumped** to 8.5.28, not removed (**correction:** removing it would have fallen back to Next's bundled 8.4.31). `npm audit --omit=dev`: 0. |
| F-04 net quantity | Fixed in code, **data needed** | Hardcoded "30ml" removed; new `products.net_quantity` column drives the PDP + JSON-LD `size`; nothing shows until real pack values are entered. |
| F-05 loyalty promises | Fixed | Removed "₹X redeemable value", "50 pts first purchase", "20 pts per review", and the account "tier benefits" list (✓ Free express shipping was false). FAQ and chat prompt now say redemption and tier benefits aren't live. |
| F-06 claims | Fixed except sunscreen positioning | **New root cause:** production `products.description` came from `seed_test_data.sql`, not the claim-reviewed catalogue in `schema.sql`. Guarded data migration restores the canonical text (drops "without irritation", "sunscreen", "control sebum"; restores the toner's BHA/12+ note). Home card, blog titles, "Organic Commitment", "12 co-ops", Vegan Lip Gloss reference fixed. **Open (business decision):** Sun Shield still sits in the "SPF" category with reapply guidance; needs a tested SPF/PA or repositioning. |
| F-07 validator | Fixed, non-blocking | GSTIN checksum + PAN entity-type checks. Reported as *warnings* (`/api/version` → `ok:false`, `warningFields`; `::warning::` in the build log) so deploys aren't blocked by the deferred P0. **Correction:** the 'Ananya Rao' fallback could not render in production (strict validation fails first); replaced with a neutral label anyway. |
| F-08 phone | Open (business) | Dial `0135 2000 000`. |
| F-09 refund window | Fixed | Window starts at `delivered_at`; undelivered orders haven't started it; legacy delivered orders fall back to order date. |
| F-10 transitions | Fixed | `lib/order-state.ts` shared by the cancel route, staff route and account UI. Shipped COD → "Cancellation Requested" (no restock). Staff route: transition map, no dispatch unless `paid`/`cod_pending`, compare-and-set (409). |
| F-11 points lifecycle | Fixed (**needs migration applied**) | `apply_order_lifecycle` trigger: COD Delivered → `paid`; points credited once when payment enters `paid`; reversed once on Cancelled/Refunded. |
| F-12 COD hold abuse | Fixed | `/api/cron/expire-cod-holds` (hourly via GitHub Actions): unverified COD holds older than `COD_REVIEW_HOLD_HOURS` (48) are cancelled, restocked and the buyer emailed. |
| F-13 `authorized` | Fixed | Order recorded `authorized` (no points, not dispatchable); captured webhook / DLQ retry promotes it to `paid`; race with the webhook covered. |
| F-17 observability | Fixed without the SDK | **Correction:** Sentry was removed on purpose (`scripts/cleanup-legacy-sentry.mjs`). Added `lib/alert-webhook.ts` (throttled, PII-scrubbed, release-tagged → `OPS_ALERT_WEBHOOK_URL`) + an external `uptime` job every 15 min. |
| F-19 PDP LCP | Fixed | `priority` on the PDP hero image. |
| F-20 privacy | Fixed (partial) | Resend, courier partners, ops alerts, "no chat transcripts stored" disclosed. Retention periods and Gemini paid-tier status still need a business/legal answer. |
| **New: profile-points guard** | Hardened | `protect_profile_privileged_fields` read only the legacy `request.jwt.claim.role` GUC. PostgREST v10+ sets only `request.jwt.claims`, in which case every signed-in customer's order finalisation would have raised [INF, unverified]. It now reads both, and trusts direct DB sessions. Check: `select failure_reason, count(*) from payment_reconciliation_failures group by 1;` |

**Deploy order:** apply `supabase/migrations/20260923000000_*` and `20260923001000_*` to production **before** deploying the app. Otherwise the UI promises COD-on-delivery points the database won't credit yet.

---

## 1. CURRENT PRODUCTION STATUS

Production is **exactly the repo**: live response header `x-build-sha: d842298ccf46e704ba5c165ab7ea491dcb778995` = `main` HEAD **[FACT]**. There is no stale deploy and no code/prod drift. Every gap below is either in the code or in production *configuration*.

### Overall score: **69 / 100**

### Production readiness: **NOT READY** (for paid marketing / real customers)

Two P0s block it, and both are configuration or business data, not code:

1. **The published GSTIN is not a valid GSTIN.** `05MODEE5678F1Z5` fails the official GSTIN checksum (the check character should be `C`; the site shows `5`). Its embedded PAN `MODEE5678F` has entity-type code `E` (LLP), but the seller is a *Private Limited* company, which needs `C` **[FACT]**. It appears on every page's footer, every PDP "Manufacturer/Packer" block, the Organization JSON-LD and `/api/schema/site`. The literal `DEMO` string was removed; what replaced it is still not a real registration. Live `/api/version` reports `compliance.ok: true` **[LIVE]**, because the validator only regex-checks the format **[CODE]**.
2. **Razorpay is in TEST mode in production.** The live client bundle contains `rzp_test_SZ3dNBE8k7p1N3` **[LIVE]**. No real money can be collected. Worse, anyone who uses Razorpay's public test cards/UPI gets a genuinely **"paid" order** (`status=Processing`, `payment_status=paid`), a real stock decrement and a real confirmation email. That is indistinguishable in the DB from a real sale **[CODE: lib/commerce.ts:593 → finalize_commerce_order]**. If ops fulfils it, it is free goods.

**Both P0s, the validator gap (F-07) and the missing error monitoring (F-17) were already found in the 13 Aug 2026 audit and are still open six weeks later.** What's blocking launch is operational follow-through, not engineering. The cron P0 from that audit is fixed: `/api/cron/*` now return 401 without the secret, and commits `69a1bdb`/`d842298` moved cron to GitHub Actions.

The engineering underneath is strong. The money path is server-authoritative, signatures are HMAC-verified in constant time, finalisation is atomic and idempotent, and RLS was **verified live** to deny anon on all 16 private tables. Once the two P0s are closed and the P1s below are handled, this becomes **READY WITH CONDITIONS**.

---

## 2. TOP 10 RISKS

| # | Risk | Sev | Evidence |
|---|---|---|---|
| 1 | Invalid GSTIN published as the legal seller identity | P0 | Checksum fail + PAN entity char `E` (§8 F-01) |
| 2 | Razorpay test keys live: no revenue, and test payments create real "paid" orders | P0 | `rzp_test_…` in live bundle (F-02) |
| 3 | Next.js 16.2.6 has a **critical** proxy/middleware-bypass advisory (App Router + Turbopack). `proxy.ts` carries the origin gate and CSP | P1 | `npm audit`: GHSA-6gpp-xcg3-4w24, fixed 16.2.11 (F-03) |
| 4 | Every product declares **30ml**, including the lip balm and the cleanser. Net quantity is hardcoded | P1 | `ProductDetailClient.tsx:322` (F-04) |
| 5 | Loyalty panel shows "₹X redeemable value", but there is no redemption anywhere, and the FAQ promises tier perks that aren't implemented | P1 | `LoyaltyPanel.tsx:51` (F-05) |
| 6 | "Sun Shield" is positioned as sun protection ("reapply every 2 hours") with no tested SPF/PA shown | P1 | Live PDP text (F-06) |
| 7 | Compliance validator accepts structurally fake identifiers, and the code silently falls back to an invented grievance-officer name | P1 | `businessCompliance.ts:64,69,110,212` (F-07) |
| 8 | Support phone `0135 2000 000` looks like a placeholder and passes the placeholder filter | P1 | Footer + Org JSON-LD (F-08) |
| 9 | Order lifecycle gaps: COD "Delivered" never becomes paid, COD points are promised but never credited, cancelling an already-shipped COD order restocks inventory, and there is no state machine for staff | P2 | cancel route, admin track route (F-10, F-11, F-12) |
| 10 | No production error monitoring: Sentry is a stub, and alerting depends on an env var I can't verify | P2 | `lib/sentry-stub.ts`, `instrumentation*.ts` (F-17) |

## 3. TOP 10 QUICK WINS (each ≤ 1 hour)

1. Put the **real** GSTIN/CIN in Vercel env, then redeploy + `/api/revalidate` (F-01).
2. Add a GSTIN checksum + PAN 4th-char `C` check to `hasVerifiedGstin` (F-07). Roughly 20 lines of code, and it would have caught F-01.
3. Fail the production build/`/api/version` when `NEXT_PUBLIC_RAZORPAY_KEY_ID` starts with `rzp_test_` and `VERCEL_ENV=production` (F-02).
4. `npm i next@16.2.11` (patch line, not the 16.3 minor), and delete the `"postcss": "8.5.14"` override, which *pins* a vulnerable version (F-03).
5. Pass `priority` to `<ProductImage>` in `ProductMedia.tsx:50`. The PDP LCP image is currently `loading="lazy"` (F-19).
6. Remove the "₹X redeemable value" line until redemption exists (F-05).
7. Remove "without irritation" from the Bakuchiol description, meta description and home card (F-06b).
8. Remove the `'Ananya Rao'` fallback name. Render "Grievance officer details available on request at grievance@" instead (F-07).
9. `/api/reviews` and `/api/refunds/eligible-orders` echo raw DB error messages. Map them to generic text as the other routes already do (F-15).
10. Compute the checkout "Earn N points" figure from **subtotal** (server rule), not total incl. shipping, in `CheckoutClient.tsx:263` (F-16).

## 4. TOP 10 BUSINESS IMPROVEMENTS

1. **Seed legitimate reviews.** The live catalogue has **0 approved reviews** (anon probe of `reviews` returned `[]`). Follow `docs/launch-review-seeding-plan.md` with disclosed sampling (`review_source` / `source_disclosure` columns already exist).
2. **Close the evidence gap on badges.** Every trust badge on every PDP reads "Evidence review" / "Audit underway". That is honest, but it converts poorly. Get one real certificate (e.g. Leaping Bunny / PETA or an Ecocert COSMOS ingredient cert) and publish it in the Trust Centre.
3. **Real net quantities, SKU/GTIN and batch info per product.** Needed for Legal Metrology compliance, and it also unlocks Google Merchant listings.
4. **Ship loyalty redemption**, or rephrase loyalty as "coming soon". Redemption is the main retention lever.
5. **Make `/products` ISR-cached.** It is dynamic today at 1.0–1.9 s TTFB vs 0.6 s for ISR pages. Move filters client-side or into `generateStaticParams` categories.
6. **Category landing pages** (`/products?category=serum` → `/products/serums`) with ItemList + Breadcrumb JSON-LD. There is currently no schema on `/products`.
7. **Redirect common guessed URLs** (`/shop`, `/skin-quiz`, `/journal`, `/orders`) to the real routes. All four currently 404 **[LIVE]**.
8. **COD confirmation call/WhatsApp step** for `COD Verification Required` orders. The risk engine exists, but there is no operator workflow.
9. **Automate refunds** through the Razorpay Refunds API with points clawback. Today refunds are a DB row plus manual dashboard work.
10. **Transactional SMS/WhatsApp order updates.** Only email (Resend) exists.

---

## 5. LIVE SITE MAP (discovered: sitemap + nav + footer + code)

```
HOME  /                                   200  ISR (prerender, x-vercel-cache HIT)
├── SHOP  /products                       200  dynamic (searchParams) — no /shop (404)
│   └── categories are query filters only: Serum ×2, Moisturiser ×2, Toner, Cleanser, SPF, Lip Care
├── PRODUCTS  /products/[slug]            200  ISR ×8
│   ├── bakuchiol-renewal-serum      ₹1,495   ├── niacinamide-pore-serum     ₹895
│   ├── rose-hip-glow-moisturiser    ₹1,095   ├── shea-butter-night-cream    ₹1,595
│   ├── green-tea-clarity-toner      ₹795     ├── turmeric-brightening-cleanser ₹695
│   ├── botanical-mineral-sun-shield ₹795     └── wild-berry-lip-elixir      ₹595
├── SKIN QUIZ  /quiz                      200  dynamic (nonce CSP) — no /skin-quiz (404)
├── JOURNAL  /blog (+3 posts)             200  — no /journal (404)
├── ACCOUNT  /account                     200  noindex, client-auth — no /orders, /account/orders (404)
├── CHECKOUT /checkout                    200  noindex
├── SUPPORT
│   ├── /faq (FAQPage JSON-LD, 13 Qs)     ├── /contact
│   ├── /refund (noindex)                 └── AI chat bubble (/api/chat, consent-gated)
├── BRAND  /our-story /ingredients /sustainability /certifications /press
└── LEGAL  /privacy-policy /terms /cookie-policy /returns-refunds /shipping-policy
Apex verdebliss.com → 308 → www · http → 301 → https · robots.txt blocks /account /checkout /refund /api
```

"8 current formulas" is **consistent** across the home copy, sitemap (8 PDPs), `/products`, Supabase `products` and the PDP JSON-LD. All six nav categories have exactly one or two real products. No phantom categories. **[LIVE]**

---

## 6. PAYMENT DATA FLOW (verified in code)

```
PRODUCT (Supabase products, RLS: public read of active rows)
 ↓  components/features/cart (zustand store) — client holds {id, qty} only
CLIENT CART
 ↓  POST /api/checkout/create-razorpay-order
 │   controls: x-vb-client + Origin allow-list (lib/csrf.ts) · CF origin secret (proxy.ts)
 │             · Upstash rate limit 10/min · Turnstile (lib/turnstile.ts) · optional Bearer JWT
SERVER CART VALIDATION   lib/commerce.ts normalizeCart()
 │   ids+qty only; qty int 1..10; ≤30 lines; price/name/stock/active re-read from DB (service role);
 │   shipping = getShippingCost(subtotal); total recomputed. Client price/total are never read.
 ↓
RAZORPAY ORDER   createRazorpayOrder(totals.total) → amount in paise, payment_capture:true
 ↓
SERVER ORDER CREATION (pre-payment)   createCheckoutSession() → checkout_sessions row
 │   {razorpay_order_id, amount_paise, cart_snapshot, address, user_id, expires_at +30m}
 ↓
CLIENT PAYMENT   Razorpay Checkout modal (CSP allows checkout.razorpay.com)
 ↓
PAYMENT RESPONSE {order_id, payment_id, signature}
 ↓  POST /api/checkout/verify-razorpay   (CSRF + rate limit 20/min)
SERVER VERIFICATION   verifyRazorpaySignature (HMAC-SHA256, hex-shape check, timingSafeEqual)
 │   → completeRazorpayCheckout: loads session by razorpay_order_id; fetches payment from Razorpay API;
 │     asserts payment.order_id == session, amount_paise & currency == session, status ∈ {captured, authorized}
 ↓
WEBHOOK   POST /api/webhooks/razorpay   (origin-gate exempt; raw-body HMAC with RAZORPAY_WEBHOOK_SECRET)
 │   records payment_events; finalises ONLY on payment.captured; failures → payment_reconciliation_failures (DLQ)
 │   DLQ retried on every webhook (5 rows, ≤10 attempts) + hourly GH-Actions cron alert
 ↓
ORDER STATE   finalize_commerce_order RPC (one transaction: order + items + stock + payment_event + loyalty ledger)
 │   idempotency: (1) session.completed_order_id (2) orders.payment_id lookup (3) unique index + RPC idempotent flag
 ↓
FULFILMENT   staff-only PATCH /api/admin/orders/track (is_staff check) → Shipped / Out for Delivery / Delivered
```

**The critical question: can a malicious client change price, quantity, product, discount, shipping, COD eligibility or total before payment?**
**No [CODE].** Only `{id, qty}` is consumed. There are no discount codes anywhere. Shipping, COD eligibility and total are server-derived. Amount tampering at the Razorpay layer is caught by the `amount_paise` equality check. A payment for order A can't finalise order B, because the signature binds `order_id|payment_id` and the session is looked up by that `order_id`.

### Payment Matrix

| Payment stage | Client | Server | Razorpay | Validation | Idempotency | Risk |
|---|---|---|---|---|---|---|
| Cart → session | sends {id,qty}, address, Turnstile token | `normalizeCart`, `validateAddress` | `POST /v1/orders` | DB price/stock; qty bounds; Turnstile; CSRF; RL 10/min | new session per attempt (fine) | Low |
| Modal payment | Razorpay JS | — | collects payment | — | — | **P0: test key live** |
| Browser verify | posts 3 ids | HMAC verify, `fetchRazorpayPayment` | `GET /v1/payments/:id` | order_id, amount, currency, status | session.completed_order_id + payment_id unique | P2: `authorized` accepted as paid (F-13) |
| Webhook | — | raw-body HMAC | sends event | only `payment.captured` finalises | payment_events dedupe (23505) + same 3 guards | Low |
| Browser closes after pay | — | webhook finalises | retries | as above | ✓ | Low (verified by design; `tests/e2e/webhook-idempotency.spec.ts`) |
| Verify API fails after pay | shows error | webhook / DLQ / cron | retries | as above | ✓ | Low |
| Failure but client claims success | forged ids | signature fails → 400 | — | HMAC | — | None |
| Same payment submitted twice | — | returns existing order (`idempotent:true`) | — | — | ✓ | None |
| Same payment → two orders | — | impossible: session keyed by razorpay_order_id; payment_id unique | — | — | ✓ | None |
| **Second** payment on an already-completed Razorpay order | — | early-return with first order; 2nd capture is **not** recorded as a failure | possible (UPI late-auth) | — | — | P3: orphaned money, no auto-refund (F-14) |
| COD | {id,qty}, address | `assessCodRisk` + `check_cod_velocity` RPC, cap ₹2,500, PIN block/review lists | — | server-side only | 5-min deterministic COD ref + unique payment_id | P2: stock-hold abuse with rotated identities (F-12) |
| Refund | request form | ownership + eligibility + one-open-per-order | **not called**; manual | ✓ | unique open refund | P2: manual; no points clawback (F-11) |

### Order State Machine (reconstructed)

```
checkout_sessions: pending ──(verify|webhook)──► completed        (expired is advisory: not enforced at finalise, by design)
orders:
  Prepaid:  Processing ─staff─► Shipped ─► Out for Delivery ─► Delivered
  COD:      COD Pending | COD Verification Required ─staff─► Shipped ─► … ─► Delivered
  Customer: any non-(delivered|cancel*|refunded) ─► "Cancellation Requested" (prepaid, +refund row)
                                                ─► "Cancelled" (COD/unpaid, immediate restock)
  Refund:   refunds.status requested ─► reviewing ─► approved ─► (manual) … orders.status "Refunded" (manual)
```

Invalid transitions that are currently *possible*:
- **Customer:** cancel a COD order that is already `Shipped` / `Out for Delivery`. It goes straight to `Cancelled` and restocks inventory while the parcel is in transit (F-10).
- **Staff:** `PATCH /api/admin/orders/track` accepts any of 5 statuses with **no from-state check**, so `Cancelled → Delivered` and `Refunded → Shipped` are both allowed (F-10).
- **Missing states:** there is no `payment_failed` on orders (failures stay on sessions, which is fine). There is no `partially_refunded`, `return_requested` or `returned`. `delivered` never flips COD `payment_status` to `paid` (F-11).
- **Customers cannot set arbitrary status [CODE+LIVE].** RLS has no customer UPDATE policy on `orders`, and the anon probe of `orders` returned `[]`.

---

## 7. MATRICES

### Feature Matrix

| Feature | Live | Backend | UI | Security | Tested | Status |
|---|---|---|---|---|---|---|
| Catalogue (8 SKUs) | ✓ 200, ISR | Supabase `products` | ✓ | public-read RLS | products.test | GOOD |
| Search / filter / sort | ✓ `/products?` | server searchParams | ✓ | trimmed `PRODUCT_SEARCH_INDEX` | seo-routes | GOOD (slow TTFB) |
| Variants / sizes | ✗ hardcoded "30ml" | no size column | wrong | — | ✗ | **BROKEN** |
| Price / MRP / discount | ✓ MRP-only, no fake strike-through | `getVerifiablePriceOffer` requires future `price_valid_until` | ✓ | server | pricing.test | GOOD |
| GST (inclusive) | ✓ "Inclusive of all taxes" | gst.test | ✓ | — | ✓ | GOOD |
| Shipping ₹79 / free ≥₹499 | ✓ consistent everywhere | `constants/shipping.ts` | ✓ | server | ✓ | GOOD |
| Cart | ✓ | zustand, re-derived at checkout | ✓ | not trusted | cartStore.test | GOOD |
| Checkout (prepaid) | ✓ page; **test mode** | full chain | ✓ | strong | checkout-money-chain, e2e | **PARTIAL (P0 config)** |
| COD | ✓ ≤₹2,500 | risk + velocity + PIN lists | ✓ | server | cod-risk, cod-idempotency | GOOD / P2 gaps |
| Order confirmation email | [UNK] live | Resend | — | — | order-email | UNKNOWN |
| Account / orders / tracking | ✓ page | RLS owner-read | ✓ | owner-only (live-verified) | accountClient, delivery-tracker | GOOD |
| Cancellation | [UNK] live | route | ✓ | owner + CSRF + RL | order-cancel.test | PARTIAL (F-10) |
| Refund request | ✓ /refund | route, one-open | ✓ | owner + CSRF + RL | refunds.test | PARTIAL (manual payout, window basis F-09) |
| Reviews | ✓ "Reviews open after purchase", 0 approved | verified purchase + moderation | ✓ | service-role insert only | review-copy | GOOD / P3 |
| Loyalty earn | ✓ | atomic in RPC + ledger | ✓ | server | loyalty.test | GOOD |
| Loyalty redeem / tier perks | shown | **none** | shown | — | ✗ | **MISSING** (F-05) |
| Skin quiz | ✓ | client-side scoring over live catalogue | ✓ | no PII sent | — | GOOD |
| AI chat (Gemini) | ✓ consent-gated (403 without) | server-side context, own data only | ✓ | JWT-scoped | chat.test | GOOD / P2 privacy |
| Contact / newsletter | ✓ | CSRF + RL + Turnstile | ✓ | ✓ | newsletter.test | GOOD |
| Consent banner | ✓ | localStorage v1.2 | ✓ | — | consent tests | GOOD |
| Error monitoring | — | console logger, Sentry stub | — | — | observability.test | **MISSING** |
| Payment reconciliation alerting | cron 401 w/o secret ✓ | DLQ + webhook alert | — | — | reconciliation tests | PARTIAL ([UNK] `OPS_ALERT_WEBHOOK_URL`) |

### Customer Journey Matrix

| Journey | Happy path | Edge cases | Security | UX | Conversion | Status |
|---|---|---|---|---|---|---|
| A Land→PDP→Cart→Checkout→Pay→Confirm | Code-complete; **payment test mode** | browser-close, double-submit, amount tamper all handled | strong | good; PDP LCP image lazy | no reviews, "evidence review" badges | **BLOCKED (P0)** |
| B Land→Quiz→Reco→PDP→Cart | ✓ recommends live catalogue slugs only | — | no PII | 5 questions | ✓ | GOOD |
| C PDP→Sign in→Points→Buy | earn ✓ (prepaid, signed-in only) | guest earns nothing; COD "pointsPending" never credited | server-side | "redeemable value" misleads | — | PARTIAL |
| D Account→Orders→Detail→Tracking | ✓ owner-only | courier URL map; "Mock" courier allowed | RLS verified | ✓ | — | GOOD |
| E PDP→Review→Auth→Verified | ✓ gate + moderation | COD-pending (undelivered) buyer may review | no XSS path (React-escaped, text-cleaned) | — | 0 reviews live | GOOD / P3 |
| F FAQ→Contact→Refund | ✓ | refund window counts from order date, policy says delivery | owner-scoped | ✓ | — | PARTIAL (F-09) |

### Security Matrix

| ID | Sev | Area | Vulnerability | Evidence | Impact | Fix |
|---|---|---|---|---|---|---|
| F-03 | P1 | Framework | Next 16.2.6: proxy bypass (critical), Server Actions DoS, SSRF | `npm audit` GHSA-6gpp-xcg3-4w24 et al. | Could skip `proxy.ts`: origin gate + CSP headers on affected requests. API handlers keep their own CSRF/auth/Turnstile, so it is defence-in-depth loss, not direct data exposure [INF] | `next@16.2.11` |
| F-03b | P3 | Build | `overrides.postcss = 8.5.14` pins a version inside the vulnerable range (≤8.5.22) | `package.json:67` | build-time only | drop the override |
| F-15 | P3 | Info leak | Raw PostgREST error text returned | `app/api/reviews/route.ts:61,90`; `app/api/refunds/eligible-orders/route.ts:57` | schema hints to a signed-in attacker | map to generic |
| F-18 | P3 | Headers | Apex 308 response sends `strict-transport-security: max-age=63072000` without `includeSubDomains; preload` | live `-I https://verdebliss.com` | HSTS preload list requires both on apex | set in Cloudflare |
| — | Info | CSP | `'unsafe-inline'` for scripts on static/ISR routes | live CSP header | XSS mitigation weaker on marketing pages (no user content rendered there) | **Intentional** (CLAUDE.md invariant) |
| — | Info | Catalogue | anon can read `products.badges` raw claim vocabulary via PostgREST | anon probe returned `["Vegan-Friendly","Organic Botanicals"]` | contradicts the spirit of "raw claim vocabulary must not reach the client" | acceptable, or move badges to a non-public column |
| ✓ | — | RLS | 16 private tables return `[]` to anon | live probe | — | — |
| ✓ | — | Secrets | no service-role / Razorpay secret / Gemini key in client JS | 18 live bundles scanned | — | — |
| ✓ | — | CSRF | 403 without `x-vb-client` / foreign Origin | live | — | — |
| ✓ | — | Webhook | 400 on bad signature | live | — | — |
| ✓ | — | Cron / revalidate | 401 without secret | live | — | — |
| ✓ | — | IP trust | `cf-connecting-ip` trusted only when proxy set the verified-origin header; inbound copies stripped | `proxy.ts:317-322`, `lib/client-ip.ts` | rate-limit keys not spoofable | — |
| ✓ | — | IDOR | cancel/refund/eligible/chat all `.eq('user_id', user.id)` from verified JWT | code | — | — |
| ✓ | — | AI boundary | model never selects data; server loads caller's own last 3 orders before prompt | `app/api/chat/route.ts` `buildTrustedContext` | "show another customer's order" is impossible | — |

### SEO Matrix (live)

| URL | Title (len) | Desc | Canonical | H1 | Schema | Index | Issues |
|---|---|---|---|---|---|---|---|
| / | 37 ✓ | 105 ✓ | ✓ | "Pure. Botanical. Radiant." (`<br>`-joined) | Organization, WebSite, ItemList | ✓ | Org `telephone` suspect (F-08); invalid GSTIN emitted as Org `identifier` (F-01) |
| /products | 36 | 115 | ✓ | ✓ | **none** | ✓ | no ItemList/Breadcrumb; dynamic TTFB 1–1.9 s |
| /products/* (8) | 34–42 ✓ | 133–150 ✓ | ✓ self | ✓ = name | Product + Breadcrumb; offers w/ shipping + return policy; no aggregateRating (correct: 0 reviews) | ✓ | `sku` = DB id "1".."8"; no `size`/`gtin`; visible size "30ml" wrong on all |
| /quiz | 50 | 141 | ✓ | ✓ | none | ✓ | fine |
| /blog | 47 | 136 | ✓ | ✓ | none | ✓ | add Blog/ItemList |
| /blog/* (3) | **64–73** | ✓ | ✓ | ✓ | Article | ✓ | titles >60 get truncated; "Organic Edition" / "Why Organic Skincare" vs no organic certification (F-06c) |
| /faq | 39 | 149 | ✓ | ✓ | FAQPage (13) | ✓ | FAQ rich results are restricted to gov/health sites; harmless |
| /certifications, /ingredients, /our-story, /sustainability, /press, /contact | ✓ | ✓ | ✓ | ✓ | none | ✓ | — |
| legal ×5 | ✓ | ✓ | ✓ | ✓ | none | ✓ | — |
| /refund | 29 | **home description reused** | ✓ | "Returns & Refunds" | — | noindex ✓ | cosmetic |
| /account, /checkout | ✓ | ✓ | ✓ | ✓ | — | noindex + robots Disallow ✓ | — |
| 404 | — | — | **canonical → homepage** | ✓ | — | noindex | drop canonical on 404 |
| sitemap.xml | 27 URLs, all 200 | — | — | — | — | — | static-page `lastmod` pinned to 2026-08-13 (build time), fine |

### Performance Matrix (live, from Europe edge `cdg1`, curl, no RUM)

| Page | LCP risk | JS (brotli) | Images | API | CLS | INP | Recommendation |
|---|---|---|---|---|---|---|---|
| / | Low: hero `fetchPriority=high`, ISR HIT, TTFB 0.58–0.66 s | 270 KB / 15 chunks | 12 imgs, 11 lazy, all with alt, next/image srcset | none on load | low (width/height set) | [UNK] | trim framer-motion from above-the-fold |
| /products | **Medium**: dynamic, TTFB 1.0–1.9 s | 271 KB | 8/9 lazy | server | low | [UNK] | make ISR (filters client-side) |
| /products/[slug] | **Medium**: main image `loading="lazy"`, no priority | 344 KB / 17 chunks | 2, both lazy | none | low (fill in sized box) | [UNK] | `priority` on `ProductMedia.tsx:50` |
| /checkout | Low (text LCP) | 336 KB + Razorpay + Turnstile | 1 | create/verify | — | [UNK] | lazy-load Razorpay script on "Pay" |

Lab Core Web Vitals (Lighthouse/CrUX) were **not** measured in this pass [UNK]. `lighthouserc.cjs` exists; run `npm run lhci` against the deployment URL for field-comparable numbers.

---

## 8. FINDINGS (detailed)

### F-01 · P0 · Legal / Trust · Invalid GSTIN published as seller identity
- **URL:** every page footer; all 8 PDPs ("Manufacturer / Packer"); `/`, `/api/schema/site` (Organization JSON-LD)
- **File:** Vercel env `NEXT_PUBLIC_VERDEBLISS_GSTIN` → `constants/businessCompliance.ts:127`
- **Evidence [FACT]:** `05MODEE5678F1Z5`. GSTIN mod-36 checksum over the first 14 chars gives `C`, but the published check char is `5`. PAN segment `MODEE5678F` has 4th char `E` (LLP); a "Private Limited" needs `C`. The `5678` run also looks like sample data. The Aug audit flagged this as "reads like sample data"; the value is unchanged. CIN `U47722UT2026PTC021460` is well-formed (state UT matches GST state 05) but unverified [UNK]. The address "B-504, Tower-1B, Nilaya Heights, Dehradun City" is also unverified [UNK].
- **Problem:** a checksum-invalid tax ID is printed as the legal seller identity on a live store and in machine-readable schema.
- **Impact:** Consumer Protection (E-Commerce) Rules 2020 r.4 / Legal Metrology seller-disclosure exposure. Tax invoices issued with an invalid GSTIN are unusable for B2B ITC. Payment-gateway KYC and marketplace onboarding will reject it. This is a severe trust failure for anyone who checks.
- **Scenario:** a customer or journalist pastes the GSTIN into the GST portal and it is "invalid", so the brand looks fake.
- **Fix:** set the real GSTIN/CIN/registered office (from the GST REG-06 certificate and MCA master data) in Vercel env, redeploy, then `POST /api/revalidate`. If the company doesn't have a GSTIN yet, **stop selling** or remove the GSTIN line (tax registration is a precondition for inter-state e-commerce supply in India).
- **Effort:** 15 min of engineering, gated by the business documents. **Regression risk:** none.

### F-02 · P0 · Payment · Razorpay test mode on production
- **Evidence [LIVE]:** `rzp_test_SZ3dNBE8k7p1N3` in the production JS bundle. `/api/version` reports `capabilities.razorpay: true`, which can't tell test from live. There is no guard in code [CODE: `git grep rzp_test` → nothing].
- **Problem / impact:** real customers can't pay (test-mode checkout rejects real instruments). Anyone who knows Razorpay's published test card or UPI `success@razorpay` gets a *real* order with `payment_status=paid`, a stock decrement and a confirmation email. The server can't tell, because `fetchRazorpayPayment` against the test account returns `captured`.
- **Scenario:** a bot or prankster creates 50 "paid" orders with the test card, and ops ships them.
- **Fix:** (1) swap to live keys + live webhook secret (already a launch gate in CLAUDE.md). (2) Add a hard guard: in production, refuse `/api/checkout/create-razorpay-order` (503) and fail `/api/version` compliance when the key id starts with `rzp_test_`, unless `ALLOW_TEST_PAYMENTS=true`. (3) Until then, have ops treat every prepaid order as test-mode (check `payment_events.payload` or the Razorpay dashboard) and cancel existing test orders.
- **Effort:** 30 min code + business KYC. **Regression risk:** low (guarded by env).

### F-03 · P1 · Dependencies · Next.js 16.2.6 below the security patch
- **Evidence [CODE]:** `npm audit --omit=dev`: 1 critical (next: GHSA-6gpp-xcg3-4w24 proxy bypass with Turbopack; GHSA-m99w-x7hq-7vfj; GHSA-89xv-2m56-2m9x), 3 high (postcss via override, sharp via next, nanoid), 1 moderate.
- **Impact [INF]:** `proxy.ts` enforces the Cloudflare origin gate on `/api/*` and emits CSP/HSTS/XFO. A bypass removes those layers for crafted requests. Route handlers still enforce CSRF, JWT auth, Turnstile and RLS, so this does not directly expose data. The SSRF advisory targets custom servers (N/A on Vercel). The Server Actions DoS applies only if server actions exist.
- **Fix:** `npm i next@16.2.11 @next/eslint-plugin-next@16.2.11` (stay on the 16.2 patch line to avoid the 16.3 minor), remove the `postcss` override, `npm run verify`. Memory note: keep Turbopack; don't use `--webpack`.
- **Effort:** 1 h. **Regression risk:** low–medium (run e2e + `tests/proxy-csp.test.ts`).

### F-04 · P1 · Product data / Legal Metrology · Net quantity hardcoded to "30ml" for all products
- **Evidence:** `app/products/[id]/ProductDetailClient.tsx:322` renders ``{catLabel} · 30ml``. Live: all 8 PDPs show 30ml, including Wild Berry Lip Elixir and Turmeric Cleanser [LIVE]. The DB has no size column (anon `products` probe) [LIVE].
- **Impact:** Legal Metrology (Packaged Commodities) Rules r.6/r.10 require the correct net quantity on e-commerce listings. A 30 ml lip balm is implausible, and a mismatch with the physical pack is a mis-declaration.
- **Fix:** add `net_quantity text not null` to `products` (migration), render it, and emit Product JSON-LD `size`. Until the data exists, remove the "· 30ml".
- **Effort:** 1–2 h + data. **Regression risk:** low.

### F-05 · P1 · Loyalty / Consumer protection · Redemption advertised, not implemented
- **Evidence:** `components/features/loyalty/LoyaltyPanel.tsx:51`: "= ₹{floor(points/100)*50} redeemable value". No redemption code exists in checkout or the API (`git grep -i redeem` → only this line). FAQ [LIVE]: "Higher tiers unlock early access, free samples, and special discounts." There is no tier-benefit code.
- **Impact:** telling customers their points have rupee value they can't use is a misleading-representation risk under the Consumer Protection Act 2019 s.2(28). It will also generate support tickets.
- **Fix:** remove the value line and the tier-perk promise now. Build redemption later as a server-side discount line inside `normalizeCart` + the finalize RPC, with a negative ledger entry in the same transaction.
- **Effort:** 15 min (copy) / 2–3 days (feature). **Regression risk:** low.

### F-06 · P1 · Cosmetic claims · Sunscreen positioning, absolute claims, "organic"
- (a) **Botanical Mineral Sun Shield [LIVE]:** category "SPF", "Reapply every 2 hours", no SPF/PA value shown (the SPF claim was deliberately removed from the slug in `ca22875`). A product marketed for sun protection needs an SPF/PA value backed by ISO 24444/24442 testing and BIS IS 17409 labelling. Without that it shouldn't be positioned as sun protection at all. **Fix:** either publish tested SPF/PA with the test report in the Trust Centre, or reposition it as a "mineral day cream" (drop "SPF" as the category and drop reapply guidance).
- (b) **"visible cell renewal without irritation"** (Bakuchiol: PDP description, meta description, home card, `/products`) [LIVE]. "Without irritation" is an absolute claim. The PDP itself says patch test first, and the Trust Centre marks skin-compatibility "Evidence file" pending. **Fix:** "a gentler-feeling alternative to retinol for most skin types; patch test first."
- (c) **"Organic"** in blog titles ("Organic Edition", "Why Organic Skincare Is the Smartest Choice…"), the DB badge "Organic Botanicals", and "2021 Organic Commitment", while `/certifications` says organic certification is "in progress" [LIVE]. Also "FARMER COOPERATIVES 12 — Direct partnerships with co-ops across Karnataka, Kerala, and Sikkim" (`/sustainability`) is a quantitative claim, yet the Trust Centre says sourcing is "third-party audit in progress". **Fix:** qualify it ("organically grown ingredients where sourced; certification in progress") or remove numbers until they're substantiated.
- (d) **Pregnancy consistency: GOOD [LIVE].** The FAQ names the salicylic toner. The bakuchiol serum, night cream (contains bakuchiol) and toner PDPs each carry "consult your healthcare provider". Nothing implies universal pregnancy safety.
- (e) **Lip Elixir allergen note [LIVE]:** "not suitable for vegans — use Vegan Lip Gloss alternative". No such product exists. Remove the reference.
- **Effort:** 1–2 h copy. **Regression risk:** none (SEO descriptions change; re-submit in Search Console).

### F-07 · P1 · Compliance tooling · Validator accepts fake IDs; code invents a grievance officer
- **Evidence:** `constants/businessCompliance.ts:69` (GSTIN regex only), `:212` `hasVerifiedGstin` = regex + a small blacklist, so F-01 passed and `/api/version` says `compliance.ok: true` [LIVE]. `:64,110`: if the env grievance name is missing or blacklisted, the code **silently publishes `'Ananya Rao'`**, a fabricated person, as the statutory Grievance Officer.
- **Impact:** the guard that is supposed to prevent placeholder legal data gives false assurance. The fallback fabricates a named legal officer (Consumer Protection E-Com Rules r.4(4) requires a real one).
- **Fix:** add GSTIN checksum + PAN 4th-char `C` (company) validation + state-code/CIN-state consistency. Replace the name fallback with a neutral "Grievance Officer" string plus the email, and fail strict validation when the env var is absent. Mirror the change in `scripts/validate-compliance.mjs`. Update `tests/business-compliance.test.ts` (its "valid" fixture uses the same invalid GSTIN).
- **Effort:** 1 h. **Regression risk:** a build fails until the real GSTIN is set, which is intended.

### F-08 · P1 · Trust · Support phone looks like a placeholder
- **Evidence [LIVE]:** `0135 2000 000` in the footer, `/contact` and Org JSON-LD `telephone`. `isPlaceholderPhone` doesn't catch it. [UNK] whether it rings.
- **Fix:** dial it. If it isn't a staffed line, replace it with a real number (CLAUDE.md launch gate).

### F-09 · P2 · Refunds · Window measured from order date, policy says delivery
- **Evidence:** `lib/refunds.ts:24` uses `order.created_at`. FAQ [LIVE]: "returns of unopened products within 14 days **of delivery**". Chat prompt: "Returns within 14 days".
- **Scenario:** an order ships in 1 day and is delivered on day 4, so the customer loses 4 days of their stated window. A remote-PIN order delivered on day 10 leaves only 4 days.
- **Fix:** use `delivered_at ?? created_at` (the column already exists via the tracking migration). Also block refund requests for undelivered orders (use cancel instead).
- **Effort:** 30 min + test. **Regression risk:** low.

### F-10 · P2 · Order state · No transition guards
- **Evidence:** `app/api/orders/cancel/route.ts:57` blocks only delivered/cancel/refunded, so a COD order in `Shipped` / `Out for Delivery` becomes `Cancelled` and `restock_order_inventory` runs (`:99`) while the parcel is in transit. `app/api/admin/orders/track/route.ts:105` sets any `TRACKABLE_STATUSES` value with no from-state check. The cancel update has no `.eq('status', previous)` compare-and-set (race with staff dispatch).
- **Fix:** a single `ALLOWED_TRANSITIONS` map in `lib/order-state.ts`, used by both routes. For shipped COD, use "Cancellation Requested" (RTO) and no restock. Add optimistic concurrency via `.eq('status', order.status)`.
- **Effort:** 2–3 h. **Regression risk:** medium (touches ops flows; covered by `order-cancel.test.ts`, `admin-track.test.ts`).

### F-11 · P2 · Loyalty / COD · Points lifecycle incomplete
- COD response returns `pointsPending` (`app/api/checkout/cod/route.ts:174`), the UI shows earnable points, but nothing credits them on delivery. The admin route never touches points or `payment_status`, so a COD `Delivered` stays `cod_pending` forever (also breaks revenue reconciliation).
- Prepaid points are credited at payment and **never reversed** on cancellation or refund. A pay→earn→cancel loop inflates tiers. Low value today (no redemption), but it becomes a real exploit the day F-05 redemption ships.
- **Fix:** on staff `Delivered` for COD → `payment_status='paid'` + award points through a new idempotent RPC. On refund approval → negative `loyalty_ledger` row (unique per order) + balance decrement.
- **Effort:** 0.5–1 day. **Regression risk:** medium.

### F-12 · P2 · COD abuse · Inventory hold via rotated identities
- COD orders decrement stock at placement. Limits: 6/min/IP, Turnstile, velocity keyed by phone+email. Rotating phone/email/IP can hold stock with fake COD orders (stock is 100/SKU [LIVE]).
- **Fix:** auto-expire unconfirmed `COD Verification Required` orders after 24 h with restock. Add a per-PIN + device velocity dimension. Consider OTP on the phone number for COD.

### F-13 · P2 · Payment · Browser verify treats `authorized` as paid
- `lib/commerce.ts:593` accepts `authorized`. The webhook deliberately doesn't. With `payment_capture:true` this state is transient, but if auto-capture fails Razorpay auto-refunds the authorisation after ~5 days, leaving a shipped order with no money.
- **Fix:** on `authorized`, create the order with `payment_status='authorized'`, withhold points and do not dispatch until the `payment.captured` webhook promotes it.

### F-14 · P3 · Payment · Second capture on a completed Razorpay order is silently dropped
- `lib/commerce.ts:561` returns early when `session.completed_order_id` is set, even if `razorpayPaymentId` differs. A rare double capture on the same order (UPI late success after a retry) is neither refunded nor flagged.
- **Fix:** if `payment_id` differs, `recordReconciliationFailure({failureReason:'duplicate_capture'})` so the ops alert fires.

### F-15 · P3 · Error leakage (see Security Matrix).

### F-16 · P3 · Points display mismatch
- `app/checkout/CheckoutClient.tsx:263` uses `floor(total/20)` (incl. ₹79 shipping). The server credits `floor(subtotal/20)`. A ₹480 cart shows 27 points and credits 24. The quiz bundle copy (`QuizClient.tsx:365`) has the same issue.

### F-17 · P2 · Observability · No error tracker in production
- `@sentry/nextjs` isn't installed (`lib/sentry-stub.ts`), and `instrumentation*.ts` import it conditionally. Errors go only to Vercel function logs (`console.*`). Payment DLQ alerting needs `OPS_ALERT_WEBHOOK_URL` [UNK whether set]. Nothing pages anyone on a checkout 5xx spike or a webhook signature-failure spike.
- **Fix:** install Sentry (add `connect-src` is already handled in `proxy.ts`), tag `release=VERCEL_GIT_COMMIT_SHA`, scrub PII. Add uptime checks on `/api/version` and `/products/*`. Confirm `OPS_ALERT_WEBHOOK_URL` is set.

### F-18 · P3 · HSTS on apex (see Security Matrix).

### F-19 · P2 · Performance · PDP LCP image lazy-loaded
- `app/products/[id]/_components/ProductMedia.tsx:50` → `<ProductImage>` without `priority`. Live PDP HTML shows `loading="lazy"` on the main image [LIVE].
- **Fix:** `priority`. **Effort:** 1 line.

### F-20 · P2 · Privacy · Processors missing from the privacy policy
- The privacy policy [LIVE] names Razorpay, Supabase, Vercel, Cloudflare, Upstash and Gemini, but **not Resend** (receives name, email, address and order items in confirmation emails; `lib/order-email.ts`) and **not courier partners** (receive name, phone and address). Retention periods are mentioned only twice.
- Gemini: the policy links Google's Gemini API terms. If `GEMINI_API_KEY` is on the **unpaid** tier, Google may use prompts (which include the customer's name and order items) to improve its products [UNK]. That contradicts the DPDP purpose limitation the policy implies. **Verify billing is enabled** on the Gemini project.
- The `gemini-2.0-flash` fallback (`app/api/chat/route.ts:346`) may be deprecated by now [INF]. Confirm it is still served, or remove it.
- **Fix:** add Resend + "courier/logistics partners" to the processor list, with retention per data class.

### F-21 · P3 · Reviews · COD-pending buyers count as verified purchasers
- `app/api/reviews/route.ts:58` accepts `cod_pending` (goods not yet delivered or paid). Moderation mitigates this. Prefer `paid` OR `status='Delivered'`.

### F-22 · P3 · SEO hygiene
- 404 canonical → homepage. `/refund` reuses the home meta description. `/products` has no ItemList/Breadcrumb. Blog titles are 64–73 chars. Product `sku` is the DB id. `/shop`, `/skin-quiz`, `/journal` and `/orders` 404 (add redirects).

---

## 9. PRIVACY / PII INVENTORY (code-verified)

| Data | Collected | Stored | Transmitted to | Logged | Deleted |
|---|---|---|---|---|---|
| Name/email/phone/address | checkout, contact | `checkout_sessions.address`, `orders.address` (service-role only; RLS verified) | Razorpay (order notes: email, phone), Resend, courier, Gemini (name only, on consent) | `console.error(error)` in routes may include DB messages (no bodies) [INF] | policy says on request [UNK process] |
| Skin type | profile/quiz | `profiles.skin_type` | Gemini (on consent) | — | with account |
| Cart/orders | yes | orders, order_items, cart_snapshot | Gemini: last 3 orders' items/totals/status (on consent + order keyword) | — | [UNK] retention |
| Loyalty | derived | profiles, loyalty_ledger | Gemini (balance) | — | — |
| Chat messages | yes | **not persisted** server-side (no table; anon probe 404) | Gemini | on error only | n/a |
| Payment | ids only | payment_events.payload (full Razorpay payload: may include masked card/VPA) | — | — | [UNK] retention |
| IP | rate limiting | Upstash key (TTL) | — | — | TTL |
| Consent | yes | localStorage `vb_cookie_consent` v1.2 | — | — | client |

Cookies/tracking [LIVE+CODE]: no ad pixels. Vercel Web Analytics + Speed Insights load on idle **without a consent gate** (`VercelInsightsLoader.tsx`). They are cookieless, query strings are stripped, and they are disclosed in the Cookie Policy as privacy-preserving measurement. That is acceptable under DPDP [INF]. Cloudflare Turnstile sets challenge cookies (disclosed).

---

## 10. LIVE vs CODE

| Feature | Live behaviour | Code behaviour | Match? | Risk |
|---|---|---|---|---|
| Deployed revision | `x-build-sha d842298` | HEAD `d842298` | ✓ | none |
| Seller identity | GSTIN `05MODEE5678F1Z5`, `compliance.ok:true` | regex-only validator; value from env | ✓ (both wrong) | **P0** |
| Payment mode | `rzp_test_…` | no mode guard | ✓ (env) | **P0** |
| Origin gate | `/api/*` without CF header → [UNK direct-origin test not run]; via CF works | `CF_ORIGIN_GATE_REQUIRED` fail-closed | [UNK] | — |
| RLS | anon → `[]` on 16 tables | schema.sql policies | ✓ | none |
| Schema version | `/api/version` `2026-05-27-…` | latest migration `20260813…harden_refunds_loyalty_cod` | ⚠ label stale | P3: the version string wasn't bumped with the Aug migration; `npm run schema:drift` should confirm the migration is applied [UNK] |
| Reviews | 0 approved | moderation queue | ✓ | business |
| Shipping/COD/returns numbers | ₹79 / ₹499 / ₹2,500 / 14 days everywhere | constants | ✓ | none |
| Refund window basis | policy: from delivery | code: from order date | ✗ | P2 (F-09) |
| Loyalty redemption | shown | absent | ✗ | P1 (F-05) |
| Net quantity | 30ml ×8 | hardcoded | ✓ (both wrong) | P1 |
| Cron | 401 without secret | GH Actions → www | ✓ | — |
| Error monitoring | none observable | Sentry stub | ✓ | P2 |

---

## 11. SCORING (evidence per line)

| Area | Score | Evidence |
|---|---|---|
| Architecture | **8/10** | Clean server-authoritative commerce, atomic RPC, DLQ + retry, route-aware CSP, ISR. Minus: no order state machine, manual refunds, `/products` not cacheable. |
| Security | **15/20** | RLS verified live; CSRF/Turnstile/RL/origin gate verified live; no client secrets; IP-spoof-resistant. Minus: unpatched critical Next advisory, vulnerable postcss pin, minor error leakage. |
| Payment Security | **10/15** | HMAC + timing-safe + amount/currency/order binding + triple idempotency are best-practice. Minus: **test keys in prod** with no guard, `authorized`=paid on browser path, duplicate capture unflagged. |
| E-commerce Correctness | **6/10** | Prices/shipping/GST consistent across UI/API/DB/schema. Minus: wrong net qty ×8, refund-window basis, COD never marked paid, COD points never credited, shipped-COD cancel restocks, phantom redemption. |
| SEO | **8/10** | Unique titles/descriptions, self canonicals, correct noindex, Product+Offer+shipping+return schema, no fake aggregateRating, apex→www. Minus: no schema on /products, 404 canonical, long blog titles. |
| Performance | **7/10** | ISR TTFB ~0.6 s, next/image srcset, sized images, one font. Minus: 270–344 KB brotli JS, lazy PDP LCP image, dynamic /products 1–1.9 s; no lab CWV in this pass. |
| Accessibility | **4/5** | All images carry alt, semantic headings, axe suites exist (`tests/a11y/*`). Not re-run live here; keyboard journey not manually verified [UNK]. |
| UX/CRO | **6/10** | Clear pricing, shipping/COD/returns on PDP, delivery-ETA API, quiz. Minus: zero reviews, every badge "evidence review", a placeholder-looking phone, "30ml" everywhere, 404 on /shop. |
| Privacy/Compliance | **2/5** | Good consent + AI consent + DPDP wording. Minus: invalid GSTIN (P0), fabricated-name fallback, undisclosed Resend/couriers, Gemini tier unknown. |
| Observability/DevOps | **3/5** | build SHA header, `/api/version`, DLQ, reconciliation cron, CI verify gate, schema-drift script. Minus: no Sentry/uptime/paging. |
| **Total** | **69/100** | |

---

## 12. PRODUCTION CHECKLIST

- [ ] No demo company/legal information in production: **FAIL** (GSTIN checksum-invalid; phone unverified)
- [x] Payment amount server-authoritative
- [x] Razorpay signature verified server-side
- [x] Webhooks authenticated/verified (live 400 on bad sig)
- [x] Payment idempotency implemented
- [x] Order authorization enforced
- [x] Customer data isolated (live anon probe)
- [x] Supabase RLS verified (anon; authenticated cross-user not live-tested [UNK])
- [x] No service-role secret in client (18 bundles scanned)
- [x] Gemini data boundary secured (server-scoped context)
- [x] AI cannot bypass authorization
- [x] Secrets absent from client bundle
- [x] HTTPS enforced (301/308 + HSTS preload on www)
- [x] Security headers configured
- [x] CSP reviewed (`unsafe-inline` on ISR is a documented trade-off)
- [x] Cookie consent reviewed
- [ ] Privacy policy matches implementation: **FAIL** (Resend, couriers)
- [ ] Returns policy matches implementation: **FAIL** (window basis)
- [x] Shipping policy matches implementation
- [ ] Product claims reviewed: **FAIL** (sunscreen, "without irritation", organic, co-op count)
- [ ] Product schema accurate: partial (no size; visible size wrong)
- [x] Review schema accurate (no aggregateRating with 0 reviews)
- [x] Sitemap correct
- [x] robots.txt correct
- [x] Canonicals correct (404 nit)
- [ ] Core Web Vitals acceptable: [UNK] (not measured; PDP LCP image lazy)
- [ ] Mobile checkout tested: [UNK] (not executed; payment in test mode)
- [~] Accessibility tested: axe suites exist; not re-run in this pass
- [ ] Error monitoring active: **FAIL**
- [~] Payment monitoring active: DLQ + cron; alert target [UNK]
- [ ] Production/staging separation verified: **FAIL** (test payment keys in production)
- [ ] Backup/recovery strategy verified: [UNK] (Supabase plan/PITR not visible from repo)
- [x] Critical E2E tests exist (`checkout.spec`, `webhook-idempotency.spec`, `checkout-money-chain.test`, `cod-idempotency.test`, `order-cancel.test`)

---

## 13. PRIORITISED PLAN (smallest safe steps)

**P0 — must fix before production traffic**
1. Real GSTIN/CIN/address/phone in Vercel env → redeploy → `/api/revalidate` (business-owned; F-01, F-08).
2. Live Razorpay keys + live webhook secret; cancel/void any existing test-mode orders (F-02).
3. Code guards so neither can recur: GSTIN checksum/PAN validator + `rzp_test_` production guard + remove the fabricated grievance-name fallback (F-02, F-07). *~2 h, one PR.*

**P1 — before scale / campaign**
4. `next@16.2.11`, drop the postcss override (F-03).
5. Net quantity column + render + schema `size` (F-04).
6. Remove the "redeemable value" + tier-perk copy (F-05).
7. Claims pass: sunscreen positioning, "without irritation", organic qualifiers, co-op number, Vegan Lip Gloss reference (F-06).

**P2 — next sprint**
8. Order transition map + COD delivered→paid + COD points + refund points clawback (F-10, F-11).
9. Refund window from `delivered_at` (F-09). 10. `authorized` handling (F-13). 11. Sentry + uptime (F-17). 12. PDP `priority` image (F-19). 13. Privacy processor list + Gemini billing check (F-20). 14. COD hold expiry (F-12).

**P3 — improvements:** F-14, F-15, F-16, F-18, F-21, F-22.

Each code step: `npm run lint && npm run typecheck && npm test` (per the memory note, local `npm run build` fails closed without real legal env), then deploy preview → re-run `npm run test:live` + manual header/JSON-LD check.

---

## 14. SELF-CRITIQUE / EVIDENCE LEDGER

- **FACT:** GSTIN checksum/PAN-type failure; `rzp_test_` key in the bundle; build SHA = HEAD; CSRF/webhook/cron/revalidate responses; RLS anon denial; headers; npm audit output; "30ml" on 8 PDPs; 0 approved reviews.
- **OBSERVED IN CODE:** entire payment chain, idempotency guards, refund window basis, state-transition gaps, loyalty lifecycle, AI context scoping, Sentry stub, fallback grievance name.
- **INFERENCE:** real-world exploitability of the Next proxy advisory on this exact config; that ops would ship test-mode orders; Gemini fallback model availability; Vercel Analytics being DPDP-acceptable without consent.
- **ASSUMPTION:** Razorpay server secret is also a test key (it must match the client key's mode for checkout to work at all).
- **UNKNOWN (not verifiable non-destructively from here):** whether CIN/address/phone/grievance officer are genuine; authenticated cross-user RLS; order-email delivery; live Lighthouse/CrUX; keyboard-only checkout; Supabase backups/PITR; whether `OPS_ALERT_WEBHOOK_URL` and paid Gemini billing are configured; whether the Aug migration is applied in prod (`/api/version` schema label predates it).
- **Devil's advocate:** "Test mode is fine pre-launch." Then the site must not be indexed and marketed as a store. It is currently `index, follow` with sitemap and Product/Offer `InStock` schema, so Google Shopping surfaces can send real buyers to a checkout that can't take their money. Pre-launch should mean `noindex` + a waitlist, or live keys.
- **Not claimed:** "secure". No vulnerability was found in the money path, IDOR or AI boundary, but authenticated cross-tenant tests and a full live checkout were out of scope for a non-destructive audit.

---

## 15. "100,000 customers tomorrow": the 10 things I'd fix before the next campaign

1. **Replace the GSTIN** (`05MODEE5678F1Z5` is checksum-invalid) and every other seller identifier with registry-verified values in Vercel env. Revalidate, then spot-check `/`, one PDP and `/api/schema/site`.
2. **Flip Razorpay to live keys** and re-register the webhook with the live secret. Run one real ₹ transaction, then confirm the `payment_events` row, the `orders` row, the webhook `reconciliation: completed` path and the confirmation email. Purge test-mode orders.
3. **Ship the guards**: `hasVerifiedGstin` checksum + PAN-`C` check and a `rzp_test_` block in `create-razorpay-order` when `VERCEL_ENV=production`. Delete the `'Ananya Rao'` fallback in `constants/businessCompliance.ts:64`.
4. **Upgrade `next` to 16.2.11** and remove the `postcss` 8.5.14 override. Re-run `tests/proxy-csp.test.ts` + e2e.
5. **Fix product facts**: a real `net_quantity` per SKU (replace `ProductDetailClient.tsx:322`), real sizes in Product JSON-LD, and remove the phantom "Vegan Lip Gloss" reference.
6. **Claims pass on high-traffic copy**: the Sun Shield needs a tested SPF/PA or repositioning; remove "without irritation" (appears in 4 surfaces); qualify "organic"; remove the "12 co-ops" figure until evidenced.
7. **Stop promising unbuilt loyalty value**: remove "₹X redeemable value" (`LoyaltyPanel.tsx:51`) and the FAQ tier perks. Fix the checkout points estimate to use subtotal.
8. **Order-state integrity before volume**: a transition map shared by `/api/orders/cancel` and `/api/admin/orders/track`; shipped COD can't be self-cancelled into a restock; COD `Delivered` → `paid` + points; refund → points clawback; refund window from `delivered_at`.
9. **Observability for a campaign spike**: Sentry with release tagging, uptime on `/api/version` + 3 PDPs + `/checkout`, a verified `OPS_ALERT_WEBHOOK_URL`, and a Razorpay dashboard alert on failed-payment rate.
10. **Conversion basics for paid traffic**: `priority` on the PDP hero (`ProductMedia.tsx:50`); make `/products` ISR; 301 `/shop`→`/products`, `/journal`→`/blog`, `/skin-quiz`→`/quiz`; seed disclosed, moderated reviews so PDPs don't all read "Reviews open after purchase"; and one real third-party certificate published in the Trust Centre.
