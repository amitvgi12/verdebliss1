# VerdeBliss — Independent Production Audit (2026 Standards)

**Subject:** `https://www.verdebliss.com/` + uploaded source (`verdebliss1-main`, app version `2.0.1`)
**Stack:** Next.js 16.2.6 (App Router) · React 19.2.5 · Supabase (Postgres + Auth) · Razorpay · Upstash Redis · Resend · Cloudflare WAF/Turnstile · Vercel · Tailwind v4
**Lenses applied:** Solution Architect · UI/UX · Lead QA · Security Lead · Performance Engineer · SEO/Accessibility Auditor · D2C Commerce Architect
**Method:** Fresh read of the deployable source tree. No cached fetches or prior-session state used.
**Revision:** v2 — incorporates live checkout-funnel screenshot evidence (7 production captures of cart → address → review → payment → Razorpay modal).

---

## 0. Scope & evidence base

The live origin sits behind an aggressive Cloudflare bot challenge; automated fetches of `https://www.verdebliss.com/` and its `robots.txt` were rejected, and the brand has effectively **zero organic search-index presence** for the exact `verdebliss.com` domain. The primary evidence base is therefore the source — which, for a Vercel/Next deploy, *is* the production artifact — with every claim cited to file/line.

**v2 update:** Seven live production screenshots of the checkout funnel were subsequently supplied, which closes most of the prior live-verification gaps (UI/UX render, Turnstile, COD, Razorpay modal, totals). Items still genuinely needing a live tool run are marked **[VERIFY LIVE]**. The zero-index footprint remains a finding (§6).

---

## 1. Verdict

This is, bluntly, one of the more rigorously engineered D2C codebases you will see at this size, and the live funnel confirms the implementation matches the code. The security and money-handling layers are senior-to-staff grade and would survive a real penetration test. The headline problem is not in the hard parts — it's a single, high-revenue-impact SEO delivery bug in how structured data is injected, plus a www/apex canonical split, a render-blocking CSS debt, and a few pre-launch gates. Fix those and the platform is genuinely launch-ready against 2026 standards.

**Overall posture:** Security **A** · Commerce correctness **A** · Architecture **A-** · QA maturity **A-** · UI/UX **A- (live-confirmed)** · Performance **B** · Accessibility **A- (partially live-confirmed)** · Technical SEO **C+ (two structural issues dragging an otherwise A down)**

---

## 2. Severity-ranked findings

| # | Severity | Area | Finding |
|---|----------|------|---------|
| F1 | **High** | SEO / Revenue | Sitewide Organization/WebSite schema and Product (offer) schema are injected via `<script type="application/ld+json" src=…>`. A non-JS `<script>` is an HTML *data block* — its `src` is ignored, so the JSON-LD never enters the DOM and is not parsed by crawlers. The schema that drives rich results & Merchant listings is effectively absent. |
| F7 | **Medium** | SEO / canonical | Live URL bar serves the **apex** (`verdebliss.com`), but every canonical, `metadataBase`, OG URL, and sitemap entry uses `https://www.verdebliss.com`. If the apex doesn't 301→www, Google receives split signals and the canonical points away from the served URL. **[VERIFY LIVE]** |
| F2 | **Medium** | Performance | `app/globals.css` is ~90 KB / 4,423 lines, render-blocking on every route (team already tracks this in `docs/performance-follow-ups.md`). |
| F8 | **Low-Med** | UX / Commerce | Mobile cart shows "Taxes calculated at checkout," but checkout shows no tax line — GST is **inclusive** (`schema.sql` L1101), so Total = Subtotal. The cart copy implies a charge that never materialises. |
| F3 | **Low-Med** | SEO discoverability | No organic index presence for the domain + aggressive bot protection may be challenging legitimate crawlers. **[VERIFY LIVE]** |
| F9 | **Pre-launch gate** | Commerce | Razorpay runs in **Test Mode** (confirmed by the live modal's red ribbon). Expected pre-launch; must switch to live keys and run a real end-to-end transaction + webhook reconciliation before go-live. |
| F4 | **Low** | Security hygiene | `connect-src` includes `https://generativelanguage.googleapis.com`, but the Gemini call is server-side only — the browser never connects to it. Unnecessary CSP widening. |
| F5 | **Low** | Maintainability | `proxy.ts` comments describe Edge-runtime assumptions; Next 16 runs `proxy` on the Node runtime. Functionally fine, comments are stale. |
| F6 | **Low** | a11y coverage | Live focus ring confirmed present (positive); full keyboard/screen-reader pass still gated behind `RUN_LIVE_A11Y_MANUAL=1`. **[VERIFY LIVE]** |

Everything else below is, on the evidence, correct.

---

## 3. Security Lead — strong pass

The security work here is the standout. Concrete evidence:

**Headers & CSP (`next.config.ts`, `proxy.ts`).** Full modern header set: HSTS w/ preload, `X-Content-Type-Options`, `X-Frame-Options: DENY`, COOP `same-origin`, CORP `same-site`, a tightly-scoped `Permissions-Policy` (payment limited to `self` + `checkout.razorpay.com`), `interest-cohort=()`. CSP is **route-aware**: always-dynamic routes (`/account`, `/checkout`, `/contact`, `/quiz`, `/refund`) get a per-request nonce + `'strict-dynamic'`; static/ISR routes fall back to `'unsafe-inline'` for *scripts they cannot nonce* — the correct, documented ISR compromise (`proxy.ts` `requiresScriptNonce`). `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`, `form-action 'self'` all present.

**Origin gate (`proxy.ts`).** A Cloudflare→origin shared-secret header (`x-vb-origin-secret`) gates `/api/*`; `CF_ORIGIN_GATE_REQUIRED=true` makes production **fail closed** if the secret is missing (503). The secret/verified headers are explicitly deleted from responses so they can never leak. Webhook/version/csp-report routes are correctly exempt.

**Payment integrity (`lib/commerce.ts`).** HMAC-SHA256 signature checks on both the client callback (`verifyRazorpaySignature`, L355) and the webhook (`verifyRazorpayWebhookSignature`, L378), each using `crypto.timingSafeEqual` with a length guard and a `^[0-9a-f]{64}$` format pre-check. Webhook handler reads the **raw body** (`request.text()`) before parsing — the only correct way to validate a provider signature. **Live-confirmed:** the funnel runs the server-created order through Turnstile and into the branded Razorpay modal.

**Supabase isolation.** Anon client (`lib/supabase.ts`) throws if imported server-side; service-role client (`lib/supabase-admin.ts`) is server-only and the key is never `NEXT_PUBLIC_`-prefixed.

**Row-Level Security (`supabase/schema.sql`).** All 18 tables have RLS enabled. Products are public-readable only when `active`; profiles/orders/loyalty are owner-or-staff scoped; the profile update policy carries `with check (auth.uid() = id and is_staff = false)` **and** a column-level `grant update(full_name, avatar_url, skin_type, updated_at)` — privilege escalation is blocked at two layers. All privileged RPCs (`finalize_commerce_order`, `apply_loyalty_points`, `reserve_inventory_for_order`, `check_api_rate_limit`) are `revoke`d from `public/anon/authenticated` and granted only to `service_role`.

**`search_path` pinning.** Every one of the 11 `SECURITY DEFINER` functions sets `search_path = public` — the classic Postgres privilege-escalation vector, frequently missed even by experienced teams; here it is 11/11.

**Input surfaces.** CSRF defence (`lib/csrf.ts`) uses a custom header (`x-vb-client: web`, forces a CORS preflight cross-origin) + Origin/Referer allowlist. Multi-tier rate limiter (`lib/rate-limit.ts`: Redis → DB → in-memory) with `additionalKey` support to defeat IP rotation and a hard memory cap. Turnstile on all checkout/COD/contact paths (**live-confirmed** on the payment step). The AI chat route sanitises every DB-sourced string against prompt injection before prompt concatenation and keeps the Gemini key server-only.

**Only nits:** F4 (unneeded Gemini entry in browser `connect-src`) and the documented, deliberate absence of COEP for the Razorpay iframe.

---

## 4. D2C Commerce Architect — strong pass

**Server-authoritative money.** `normalizeCart` (`lib/commerce.ts` L243) re-fetches every line item from the DB, re-prices server-side, enforces stock, and ignores browser-supplied prices entirely. Totals = `subtotal + getShippingCost(subtotal)` with a single ₹499 free-shipping threshold (`constants/shipping.ts`). **Live-confirmed:** ₹1,495 cart → "Free shipping unlocked"/"Shipping FREE" → Total = Subtotal = ₹1,495, with amount-in-words on the summary.

**Tamper resistance.** On completion (`completeRazorpayCheckout`, L576): captured `payment.amount`/`currency` must equal the server-side `checkout_sessions.amount_paise`/currency (L609); payment must belong to the order (L606); status must be `captured|authorized`. The browser's cart/address on the verify call is discarded in favour of the trusted session row.

**Atomicity & idempotency.** Order finalisation is one Postgres transaction (`finalize_commerce_order` RPC) covering order + line items + inventory + payment event + loyalty — no partial orders. Idempotency is triple-guarded (payment-id lookup, `completed_order_id`, DB `idempotent` flag).

**Resilience.** Two completion paths (client verify *and* webhook); failures land in a `payment_reconciliation_failures` DLQ retried inline and via the daily `/api/cron/reconciliation-alert` cron.

**India GST — done right.** Tax-inclusive pricing with back-calculated 18% GST (HSN 33), auto-selecting CGST+SGST vs IGST from seller vs buyer state, sequential tax-invoice numbering via DB trigger, and order INSERT rejected if `seller_config` GSTIN/state is unset (fail-closed) — `schema.sql` L1037–1111.

**COD** carries the same hardening plus risk scoring (`lib/cod-risk.ts`); **live-confirmed**, including the "held briefly for phone, pincode, and address verification" note.

**Loyalty** points surface live (74 pts on ₹1,495).

**F8 (Low-Med):** the mobile cart's "Taxes calculated at checkout" is inconsistent with the inclusive-GST model (no tax line ever appears). Recommend "Inclusive of all taxes" (Indian convention) or an explicit "Incl. GST" line.

**F9 (pre-launch gate):** Razorpay is in Test Mode. Switch to live keys; run one real live transaction end-to-end and confirm webhook reconciliation before launch.

---

## 5. Solution Architect & Lead QA

**Architecture (A-).** Clean App-Router separation (server data in `lib/*-server.ts`, client state in Zustand), ISR with `revalidate=300` on catalogue/PDP, on-demand revalidation, `force-static` schema endpoints with SWR cache headers, fail-closed product publishing (`isPublishedProduct` requires a real price in production, else `notFound()`), and canonical slug redirects via `permanentRedirect`. Sentry is optional via a stub alias so the build never hard-depends on it.

**QA maturity (A-).** 48 test files spanning unit (vitest), component (Testing Library), e2e + visual + a11y (Playwright/axe), plus dedicated **launch-gate**, **money-chain**, **GST**, **reconciliation-retry**, **compliance-guard**, and **CSP** suites, and a 32 KB `QA_TEST_CASES.md`. The `verify` script chains lint + typecheck + test + build + a11y.

*Watch items:* the in-memory rate-limit fallback is per-serverless-instance (documented) — provision Redis in prod for a global limiter; `VERCEL_FORCE_NO_BUILD_CACHE=1` trades build speed for determinism.

---

## 6. SEO / Accessibility Auditor

### F1 (High) — structured data is not being delivered to crawlers

`app/layout.tsx:106` and `app/products/[id]/page.tsx:98` emit `<script type="application/ld+json" src="…">`. Per the HTML spec, a `<script>` whose `type` is not a JavaScript MIME type is a **data block**; the `src` is **ignored** and the resource is never fetched into the DOM — by any browser, including the headless Chrome Googlebot renders with. So your Organization, WebSite, and **Product** schema (price/availability, `priceValidUntil`, `MerchantReturnPolicy`, `OfferShippingDetails`, `aggregateRating` — all built correctly in `lib/seo.ts`) is very likely not picked up. For a D2C store this forfeits Product rich results and free Merchant-listing surfaces.

The tell: your own `docs/security-follow-ups.md` describes JSON-LD as an *inline, escaped* sink, and blog/FAQ pages already do it correctly (`app/blog/[slug]/page.tsx:160`, `app/faq/page.tsx:82` → `<StructuredData>`). Only the two most commercially important schema types regressed to external-`src`.

**Fix (low effort, no CSP change):** replace both external-`src` tags with the existing inline `<StructuredData>` component (homepage and PDP are not nonce routes, so they already serve `script-src 'unsafe-inline'` and accept an inline JSON-LD block with no nonce). Add Organization/Website + featured-product ItemList to the homepage (`app/page.tsx` currently emits none). Validate with Google's Rich Results Test on a live PDP. **[VERIFY LIVE]**

### F7 (Medium) — www vs apex canonical split

The live checkout loads on the **apex** `verdebliss.com`, while every canonical/`metadataBase`/OG/sitemap URL in source is `https://www.verdebliss.com`, and the CSRF allowlist serves both hosts. If the apex does not 301→www, Google sees duplicate hosts with a canonical that points away from the served URL — diluting signals. **Fix:** add a 301 from apex→www at Cloudflare/Vercel (or choose the apex as canonical and update `SITE_URL`/`metadataBase`/sitemap/OG to match). **[VERIFY LIVE]**

### Otherwise SEO is strong
`metadataBase`, title templates, OG + Twitter cards, per-PDP canonical, `en_IN` locale, dynamic `sitemap.ts` (product URLs + `lastModified` from `updated_at`), sensible `robots.txt`, and `noindex` on not-found products. Fonts use `display: swap` + `adjustFontFallback`.

### F3 — discoverability
Zero organic presence + a hard bot challenge on the origin. Confirm Googlebot/Bingbot are allow-listed (Search Console URL Inspection) — if the challenge fires on crawlers, no on-page SEO can rescue indexing. **[VERIFY LIVE]**

### Accessibility (A- — partially live-confirmed)
Source positives: skip-to-content link (WCAG 2.4.1), `lang="en"`, semantic `<main id="main-content">`, `useFocusTrap`, axe-core suites, and a manual WCAG-luminance contrast test. **Live-confirmed:** a clearly visible gold focus ring on the checkout phone field. Remaining: run the full keyboard/screen-reader pass live (`RUN_LIVE_A11Y_MANUAL=1`).

---

## 7. Performance Engineer (B)

**Good:** `next/image` with `priority` + explicit `sizes` on the LCP hero and first product card; AVIF/WebP; immutable 1-year cache on `/images/*`; SWR headers on `/products*`; `@vercel/speed-insights`; preconnect to the Razorpay origin.

**F2 (Medium):** `app/globals.css` ships ~90 KB / 4,423 lines, render-blocking on every route (already tracked). Split route-specific styles into scoped modules; keep only tokens/base primitives global; measure render-blocking CSS + LCP before/after on home, `/products`, PDP, quiz, account, checkout.

---

## 8. UI/UX — live-confirmed (A-)

The seven production captures resolve the earlier "constrained" rating. The funnel is polished and coherent: a consistent olive/cream brand palette, clear typographic hierarchy (serif display + sans body), a three-step checkout with checkmarked progress and edit-back, address card review, and an order-summary rail carrying trust cues (amount-in-words, "Free shipping included," "100% secure payment via Razorpay," loyalty points). The Razorpay modal is brand-themed. Accessibility affordance confirmed via the visible focus ring.

**UX nits:** F8 (cart tax copy); the mobile single-item cart has a large empty mid-section that reads as sparse (minor, subjective).

---

## 9. Prioritised remediation roadmap

**Now (pre/at launch)**
1. **F1 —** Inline Organization/WebSite schema in `layout.tsx` and Product schema in PDP via `<StructuredData>`; add homepage schema. Validate with Rich Results Test. *(High impact, ~1–2 hrs.)*
2. **F9 —** Switch Razorpay to live keys; run one real end-to-end live transaction + webhook reconciliation.
3. **F7 —** Add 301 apex→www (or flip canonical to apex consistently).
4. **F3 —** Confirm Googlebot isn't blocked by the Cloudflare challenge; submit `sitemap.xml`.

**Week 1**
5. **F8 —** Fix cart tax copy to "Inclusive of all taxes" / explicit GST line.
6. **F2 —** Split `globals.css`; re-measure CWV.
7. **F4 —** Drop `generativelanguage.googleapis.com` from browser `connect-src`.
8. **F6 —** Full live a11y pass (incl. `RUN_LIVE_A11Y_MANUAL=1`) and a manual keyboard/screen-reader run on checkout.

**Month 1**
9. **F5 —** Refresh stale Edge-runtime comments in `proxy.ts`.
10. Confirm Upstash Redis is provisioned in prod (global rate limiter).
11. Re-evaluate COEP once Razorpay publishes COEP-compatible embed guidance.

---

## 10. One-line summary

The hard, expensive-to-get-right parts (payments, RLS, idempotency, GST, CSP, and a polished live funnel) are excellent; the value currently leaking is a structured-data delivery bug plus a www/apex canonical split — clear both, complete the launch gates (live keys, crawler access), and this ships.

---

## 11. v3 Addendum — Live verification via Vercel deployment (build `8bd8794`)

Rendered HTML fetched directly from the deployment (homepage + PDP `/products/bakuchiol-renewal-serum`).

| Finding | Status | Evidence |
|---|---|---|
| F1 structured data | **VERIFIED FIXED** | Homepage: inline `<script type="application/ld+json">` with Organization + WebSite (SearchAction) + featured ItemList, in-DOM. PDP: inline Product schema with full Offer (₹1,495 INR, InStock, seller legalName, 14-day free-return MerchantReturnPolicy, OfferShippingDetails ₹79 / 0–1d handling / 2–3d transit) **plus a new BreadcrumbList**. `aggregateRating` correctly omitted while review_count=0 (honest schema, avoids a Merchant-listings violation). |
| F8 tax copy | **VERIFIED FIXED** | Product cards: "Inclusive of all taxes". PDP: "MRP inclusive of all taxes". |
| Grievance officer | **VERIFIED FIXED** | Footer now shows a real name (Mamata Sharma) + grievance@; prior placeholder gone. |
| Security headers | **VERIFIED LIVE** | Full set served: CSP (+report-to /api/csp-report), HSTS preload, XFO DENY, COOP/CORP, scoped Permissions-Policy, nosniff. |
| F7 apex 301 | Pending | Not testable from preview host; canonical still `https://www.verdebliss.com/...` (correct). Verify apex→www 301 on production. |
| F9 live keys | Pending | Payment flow not exercised from preview. |
| `x-robots-tag: noindex` | Expected on preview | Vercel auto-adds it to deployment URLs. **Confirm production www does NOT serve this header** — if it leaks there it nullifies all SEO work. |
| GSTIN value | **Pre-launch verify** | Footer/schema GSTIN `05MODEE5678F1Z5`: state code 05 (Uttarakhand) and format are plausible, but the PAN segment "MODEE5678F" reads like sample data. Verify the real GSTIN on the GST portal before launch. Support number `0135 2000 000` likewise needs confirmation as a live line. |
| Badge vocabulary drift | Low | Search-palette payload uses "Cruelty-free*"/"Vegan-Friendly" while cards render "No animal testing · audit underway"/"Vegan-friendly · evidence review" — two badge vocabularies in one build; unify. |

Language/conversion copy review delivered separately; headline: trust language is excellent (A-grade honesty architecture), but developer/compliance jargon leaks into customer surfaces and benefit copy is feature-led rather than sensory/outcome-led — the main remaining gap between "trustworthy" and "compelling."

---

## 12. v4 Final Status — owner verification + closing fix (post-audit)

| Finding | Final status |
|---|---|
| F1 structured data | **CLOSED** — inline JSON-LD live-verified on homepage + PDP |
| F7 apex→www | **CLOSED** — live 308 → www (proxy.ts:96-104) |
| x-robots-tag | **CLOSED** — preview-only; production www serves no header |
| F4 Gemini connect-src | **CLOSED** — removed from proxy.ts and live CSP |
| F5 stale runtime comments | **CLOSED** |
| F8 tax copy | **CLOSED** — cart drawer + cards "Inclusive of all taxes" |
| Badge vocabulary drift | **CLOSED** — layout now ships trimmed PRODUCT_SEARCH_INDEX; raw claim vocabulary can no longer reach the client; smoke test inverted to assert absence |
| Latent badge-match bug (new, found in closing) | **CLOSED** — PDP cert row matched 'cruelty' substring against normalized DB vocabulary "No animal testing · audit underway", silently dropping the row in production; 'animal testing' added to match list; dev/E2E fallbacks normalized to match DB path |
| F2 globals.css | **HALF-CLOSED** — 90 KB/4,423 lines → 48 KB/2,113 lines; remaining split deferred as measured refactor |
| F3 crawler access | Healthy on evidence (robots.txt normal, CF managed rules target AI-training bots only, `User-agent: * Allow: /`); final confirmation = Search Console URL Inspection |
| F9 live Razorpay keys; GSTIN + support-line verification | **Launch gates** — env vars + GST portal + one real end-to-end transaction with webhook reconciliation check |
| Language/conversion copy pass (§ chat, v3) | **OPEN** — evict engineering dialect from customer surfaces; add sensory/outcome line per product; reframe "Evidence review" badges |

**Engineering note for the closing fix:** keyword-substring matching on badge *display strings* remains brittle by design — a future copy edit ("audit underway" → "audit complete") can silently re-break row matching. Recommended hardening: store a stable badge key/enum alongside display text and match on the key.

Audit complete. Platform is launch-ready pending the business gates above.
