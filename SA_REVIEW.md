# VerdeBliss — Solution Architect Review
**Reviewer:** Solution Architect  
**Date:** April 2026  
**Scope:** Full-stack React + Supabase + Vercel — Code quality, architecture, security, performance, and scalability

---

## Executive Summary

VerdeBliss has a solid foundation — clean component decomposition, a working CI/CD pipeline, and well-enforced Row Level Security in Supabase. The critical API key exposure has been resolved. This review identifies remaining gaps and prescribes concrete remediations, prioritised by risk and effort.

**Overall rating: 7.2 / 10** *(was 5.1 before this sprint's fixes)*

---

## 1. Architecture Assessment

### ✅ What is working well

| Area | Observation |
|------|-------------|
| Component separation | Domain-driven: `features/`, `ui/`, `layout/`, `pages/` — correct layering |
| State management | Zustand with `persist` middleware — lightweight and appropriate for scale |
| Route structure | React Router v6 with lazy-loadable pages — ready for code-splitting |
| Supabase RLS | All tables protected; anon key exposure is acceptable by design |
| CI/CD pipeline | Three-job GitHub Actions: lint → preview → production — correct |
| API proxy | Anthropic key server-side via `api/chat.js` — CRITICAL fix applied |
| Security headers | CSP, HSTS, X-Frame-Options, nosniff all set in `vercel.json` |

### ⚠️ Architecture Gaps Found

#### ARCH-01 — No lazy loading on route components
**Impact:** The entire app JS loads on first visit, including Account, ProductDetail, and all 5 company pages. This inflates the initial bundle and hurts LCP.

**Fix:**
```jsx
// App.jsx — replace static imports with lazy
import { lazy, Suspense } from 'react'
const OurStory = lazy(() => import('@/pages/company/OurStory'))
const Contact  = lazy(() => import('@/pages/company/Contact'))
// ... wrap Routes in <Suspense fallback={<PageSkeleton />}>
```

**Expected impact:** 30–45% reduction in initial JS parse time.

---

#### ARCH-02 — No global error boundary
**Impact:** Any unhandled React render error crashes the entire page with a blank white screen. No user-facing recovery.

**Fix:** Add `src/components/ErrorBoundary.jsx` wrapping `<main>` in `App.jsx`:
```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError)
      return <ErrorPage onRetry={() => this.setState({ hasError: false })} />
    return this.props.children
  }
}
```

---

#### ARCH-03 — Contact form has no backend persistence
**Impact:** Contact form submissions disappear after the simulated timeout. No email is sent, no record saved.

**Fix options (pick one):**
1. Supabase `contact_submissions` table + Supabase Edge Function → Resend email
2. Vercel serverless `/api/contact.js` → Resend API
3. Third-party form service (Formspree, Basin) — 5-minute setup

**Recommended:** Option 1 — keeps data in Supabase where RLS protects it.

---

#### ARCH-04 — No 404 page
**Impact:** Unknown routes render `<Home />` silently (current `path="*"` fallback). Users who mistype a URL get no feedback.

**Fix:** Create `src/pages/NotFound.jsx` with a forest-green branded 404 and link back to home/products.

---

#### ARCH-05 — AnimatePresence `mode="wait"` on Routes causes flash
**Impact:** `mode="wait"` means the outgoing page fully exits before the incoming one starts. On slow connections this creates a perceptible white flash between routes.

**Fix:** Replace with `mode="sync"` and use per-page `initial/exit` variants that overlap slightly.

---

#### ARCH-06 — useProducts hook has no caching
**Impact:** Every navigation to `/products` re-fetches from Supabase, even if data was fetched 5 seconds ago. This adds latency and wastes Supabase read quota.

**Fix options:**
- Add React Query (`@tanstack/react-query`) — recommended for any app doing server state
- Or add a simple 60-second in-memory TTL cache in `useProducts.js`

---

## 2. Security Audit (Updated)

### Status after sprint fixes

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| SEC-01 | 🔴 CRITICAL | API key in client bundle | ✅ FIXED — moved to `api/chat.js` |
| SEC-02 | 🟠 HIGH | No rate limiting on chat API | ✅ FIXED — 20 req/IP/min |
| SEC-03 | 🟠 HIGH | Missing security headers | ✅ FIXED — `vercel.json` |
| SEC-04 | 🟠 HIGH | No input validation on chat | ✅ FIXED — `api/chat.js` |
| SEC-05 | 🟠 HIGH | CORS wildcard | ✅ FIXED — allowlist |
| SEC-06 | 🟡 MEDIUM | Supabase anon key visible | ✅ ACCEPTED — RLS enforced |
| SEC-07 | 🟡 MEDIUM | No CSRF on API routes | ✅ MITIGATED — JSON+CORS |
| SEC-08 | 🟡 MEDIUM | localStorage for cart/wishlist | ✅ ACCEPTED — non-sensitive |
| SEC-09 | 🟢 LOW | CSP uses unsafe-inline | 🔄 OPEN — needs nonce |
| SEC-10 | 🟢 LOW | Error messages leak details | ✅ FIXED — generic messages |

### New findings this review

#### SEC-11 — No input sanitisation on Contact form
**Severity:** 🟡 MEDIUM  
**Description:** The `message` field in `Contact.jsx` is rendered directly into the DOM after submission. If the contact data is later displayed in an admin panel without sanitisation, XSS is possible.

**Fix:** Sanitise with DOMPurify before storing or displaying user-submitted content:
```js
import DOMPurify from 'dompurify'
const clean = DOMPurify.sanitize(form.message)
```

---

#### SEC-12 — Rate limit is in-memory only
**Severity:** 🟡 MEDIUM  
**Description:** The current rate limiter in `api/chat.js` uses a JavaScript `Map` that resets on every Vercel cold start. A determined attacker can bypass it by triggering cold starts.

**Fix:** Replace with Upstash Redis + `@upstash/ratelimit`:
```js
import { Ratelimit } from '@upstash/ratelimit'
import { Redis }     from '@upstash/redis'
const ratelimit = new Ratelimit({
  redis:  Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, '60 s'),
})
```

---

#### SEC-13 — Missing `rel="noopener noreferrer"` on external links
**Severity:** 🟢 LOW  
**Description:** Social media buttons and press links that open in a new tab should include `rel="noopener noreferrer"` to prevent tab-napping attacks.

---

## 3. Performance Analysis

### Current bundle sizes (gzip)

| Chunk | Gzip | Assessment |
|-------|------|------------|
| `supabase-vendor` | 51.7 kB | ⚠️ Consider using `@supabase/supabase-js` tree-shaking |
| `react-vendor` | 52.4 kB | ✅ Expected |
| `motion-vendor` | 38.2 kB | ⚠️ Only import needed Framer Motion APIs |
| `index` (app code) | 31.2 kB | ✅ Good |
| `ui-vendor` | 3.2 kB | ✅ Excellent |

### Performance recommendations

**PERF-01 — Tree-shake Framer Motion**
```js
// Instead of: import { motion, AnimatePresence } from 'framer-motion'
// Do:
import { motion } from 'framer-motion/dist/framer-motion'
```
Expected saving: ~12 kB gzip.

**PERF-02 — Add `loading="eager"` to hero image only**
The serum.png in the hero is above the fold — it should load eagerly while all other product images remain lazy.

**PERF-03 — Preconnect to Google Fonts**
Already in `index.html` — ✅ good.

**PERF-04 — Add `<link rel="preload">` for logo.png**
```html
<link rel="preload" as="image" href="/images/logo.png" />
```

**PERF-05 — Image format: convert PNGs to WebP**
The serum.png and logo.png should be served as WebP with PNG fallback. Use Vite's `vite-imagetools` plugin or serve via Cloudinary/Imagekit with automatic format negotiation.

---

## 4. Code Quality Review

### ✅ Good practices observed
- ESLint configured with React Hooks rules — catches mistakes at commit time
- Zustand `persist` middleware with namespaced storage keys
- CSS variables via theme constants — consistent tokens
- `aria-label` on all interactive nav/cart buttons
- Graceful image fallbacks with `onError` handlers
- `useSearchParams` for URL-driven filter state — shareable and bookmarkable
- `vercel.json` SPA rewrite rule — prevents 404 on direct URL access

### Issues found in code review

**CODE-01 — Inline styles at scale**  
Using JavaScript objects for all styles is maintainable at current scale but will become a performance concern above ~200 components (thousands of object allocations per render). Migrate to Tailwind CSS utility classes (already in `tailwind.config.js` but unused) or CSS Modules.

**CODE-02 — Magic strings for route paths**  
Routes like `'/products?cat=Serum'` are repeated in `Footer.jsx` and `Nav.jsx`. Extract to `src/constants/routes.js`:
```js
export const ROUTES = {
  home: '/',
  products: '/products',
  productsByCategory: (cat) => `/products?cat=${cat}`,
  account: '/account',
  ourStory: '/our-story',
}
```

**CODE-03 — No TypeScript**  
The codebase uses plain JavaScript with PropTypes disabled. At this feature surface (auth, cart, loyalty, orders), runtime type errors are a real risk. **Recommendation:** Migrate to TypeScript in the next sprint. Supabase auto-generates TypeScript types from the database schema.

**CODE-04 — `useAuthStore` `init()` called in App.jsx**  
The `initAuth()` effect in `App.jsx` runs on every re-render because Zustand store references are stable but the `useEffect` dep array depends on `initAuth`. This is currently correct but fragile. Use `useRef` to guard single execution:
```js
const inited = useRef(false)
useEffect(() => { if (!inited.current) { inited.current = true; initAuth() } }, [initAuth])
```

**CODE-05 — No environment validation on startup**  
If `VITE_SUPABASE_URL` is missing, the app throws a cryptic error deep in the Supabase client. Add startup validation in `src/lib/supabase.js`:
```js
const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']
required.forEach((key) => {
  if (!import.meta.env[key]) throw new Error(`Missing env var: ${key}`)
})
```

---

## 5. Accessibility Audit

| Check | Status | Notes |
|-------|--------|-------|
| ARIA labels on nav buttons | ✅ | Cart, Account, hamburger all labelled |
| Search input `aria-label` | ✅ | Present |
| Chat dialog `role="dialog"` | ✅ | Present |
| Legal modal `aria-modal` | ✅ | Present |
| Logo `alt` text | ✅ | "VerdeBliss" |
| Decorative images `aria-hidden` | ✅ | Chatbot header logo |
| Focus management in modal | ⚠️ | LegalModal doesn't trap focus inside — tab can escape |
| Colour contrast body text | ✅ | C.muted (#6E7D71) on white passes 4.5:1 |
| Colour contrast muted on forest | ⚠️ | `rgba(255,255,255,0.55)` on forest = 3.8:1 — below 4.5:1 |
| Keyboard navigation in search | ✅ | Arrow keys + Enter work |
| Skip-to-content link | ❌ | Missing — screen reader users must tab through entire nav |

**A11Y-FIX-01 — Add focus trap to LegalModal**
```js
// On modal open, move focus to the first focusable element
// On close, return focus to the trigger element
// Use `focus-trap-react` package (1.5 kB gzip)
```

**A11Y-FIX-02 — Add skip-to-content link**
```html
<a href="#main-content" class="sr-only focus:not-sr-only">Skip to content</a>
```

---

## 6. Scalability Assessment

| Concern | Current State | Recommendation |
|---------|--------------|----------------|
| Database | Supabase (PostgreSQL) — ✅ scales to millions of rows | Add database indexes on `products.category`, `orders.user_id` |
| CDN / Assets | Vercel Edge Network — ✅ global | Move product images to Cloudinary for automatic optimisation |
| Chat API | Single serverless function — ✅ stateless | Implement streaming responses (Anthropic supports SSE) for better UX |
| Auth | Supabase Auth — ✅ scales automatically | Add MFA option for account security |
| Search | Client-side fuzzy match — ⚠️ breaks above 500 products | Migrate to Supabase full-text search or Algolia |
| Loyalty Points | Direct DB update via RPC — ✅ atomic | Add a points ledger table for audit trail |

---

## 7. Recommended Sprint Priorities

### Sprint 1 (Week 1–2) — Must Do
1. Add React lazy loading to all route components (ARCH-01)
2. Add global error boundary (ARCH-02)
3. Wire Contact form to Supabase + Resend email (ARCH-03)
4. Add Upstash Redis rate limiting to `api/chat.js` (SEC-12)
5. Add focus trap to LegalModal (A11Y-FIX-01)
6. Add skip-to-content link (A11Y-FIX-02)

### Sprint 2 (Week 3–4) — Should Do
7. Add `path="*"` NotFound page (ARCH-04)
8. Extract route constants (CODE-02)
9. Add DOMPurify to Contact form (SEC-11)
10. Convert PNG assets to WebP (PERF-05)
11. Add React Query for server state caching (ARCH-06)

### Sprint 3 (Month 2) — Could Do
12. Migrate to TypeScript (CODE-03)
13. Implement streaming chat responses
14. Migrate client-side search to Supabase FTS
15. Add `rel="noopener noreferrer"` to all external links (SEC-13)
16. Add database indexes on high-traffic columns
17. Implement CSP nonces (SEC-09)

---

## 8. Infrastructure Diagram

```
User Browser
     │
     ▼
Vercel Edge Network (CDN)
     │
     ├─── Static assets (/dist) ──────────────────────────────► Cache (immutable, 1yr)
     │
     ├─── /api/chat (Serverless Function) ──────────────────────► Anthropic API
     │         │
     │         └── Rate limit: 20 req/IP/min (Upstash Redis)
     │
     └─── SPA (index.html) ──────► React App
                                        │
                                        ├─── Supabase (Auth + DB + RLS)
                                        │         └── PostgreSQL (products, orders,
                                        │                         profiles, wishlist,
                                        │                         reviews, addresses)
                                        │
                                        └─── Razorpay / Stripe (Payments)


GitHub Repository
     │
     └─── GitHub Actions
               ├── quality: lint
               ├── deploy-preview: vercel build + deploy (PRs)
               └── deploy-production: vercel build --prod + deploy (main)
```

---

## 9. Compliance Checklist

| Requirement | Status | Notes |
|-------------|--------|-------|
| Privacy Policy | ✅ | LegalModal implemented |
| Terms of Service | ✅ | LegalModal implemented |
| Cookie Policy | ✅ | LegalModal implemented |
| GDPR data deletion | ⚠️ | `/api/delete-account` endpoint needed |
| Indian IT Act 2000 | ✅ | Privacy policy covers data handling |
| Consumer Protection Act 2019 | ✅ | Terms of Service section 9 |
| PCI-DSS (payments) | ✅ | Delegated to Razorpay/Stripe |
| Accessibility WCAG 2.1 AA | ⚠️ | Focus trap and contrast fixes needed |
