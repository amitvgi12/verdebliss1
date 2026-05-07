# VerdeBliss — Certified Organic Skincare

Production e-commerce platform for VerdeBliss, a luxury organic skincare brand from India. Built on Next.js 16 App Router with Supabase, Razorpay, and an AI-powered support chatbot.

**Live site:** [www.verdebliss.com](https://www.verdebliss.com)

---

## Stack

- **Framework:** Next.js 16 (App Router) · React 19
- **Styling:** CSS-in-JS via inline styles + design tokens (`constants/theme.js`)
- **Fonts:** `next/font/google` — Cormorant Garamond + DM Sans (zero layout shift, self-hosted at build)
- **State:** Zustand (cart, auth, wishlist, toast) with `persist` middleware
- **Backend:** Supabase (Postgres + Auth + RLS + Edge Functions)
- **Payments:** Razorpay Checkout SDK (UPI / Cards / Net Banking / EMI)
- **AI Chatbot:** Google Gemini 2.5 Flash (with 2.0-flash fallback) via server-side route handler
- **Animation:** Framer Motion (with `useReducedMotion` for WCAG 2.3.3 compliance)
- **Testing:** Vitest + React Testing Library + JSDOM
- **Linting:** ESLint 9 (flat config) + Prettier 3
- **Hosting:** Vercel (CI/CD via GitHub Actions)

---

## Project Structure

```
verdebliss/
├── app/                          ← Next.js App Router (only routing surface)
│   ├── layout.jsx                ← Root layout, metadata, JSON-LD, MotionProvider
│   ├── page.jsx                  ← Home
│   ├── globals.css               ← Skip-link, focus-visible, reduced motion, .sr-only
│   ├── account/                  ← My Account dashboard
│   ├── api/chat/route.js         ← Gemini AI chatbot proxy
│   ├── blog/                     ← Journal index + dynamic [slug] posts
│   ├── checkout/                 ← Razorpay checkout (with order persistence)
│   ├── contact/, our-story/, ingredients/, sustainability/, press/
│   ├── faq/                      ← FAQ with FAQPage JSON-LD schema
│   ├── products/                 ← Listing + dynamic [id] detail (SSR Product JSON-LD)
│   └── quiz/                     ← Skin Quiz with recommendation engine
├── components/
│   ├── features/
│   │   ├── cart/CartDrawer.jsx
│   │   ├── chat/ChatBot.jsx
│   │   ├── loyalty/LoyaltyPanel.jsx
│   │   ├── reviews/ReviewSection.jsx   ← Customer review submission + display
│   │   └── search/SearchBar.jsx        ← With aria-live region
│   ├── layout/
│   │   ├── Footer.jsx
│   │   └── Nav.jsx
│   └── ui/
│       ├── AuthInitializer.jsx
│       ├── Badge.jsx, CookieConsent.jsx, IngredientCard.jsx, LegalModal.jsx
│       ├── MotionProvider.jsx          ← WCAG 2.3.3 reduced-motion wrapper
│       ├── ProductCard.jsx, ProductImage.jsx (next/image)
│       └── SkeletonCard.jsx, Stars.jsx, Toast.jsx
├── constants/
│   ├── productCompliance.js      ← INCI, allergens, PAO per SKU
│   ├── products.js               ← Product catalogue (8 SKUs)
│   ├── shipping.js               ← FREE_SHIPPING_THRESHOLD (single source)
│   └── theme.js                  ← Design tokens (incl. WCAG-AA goldText)
├── hooks/
│   ├── useProducts.js            ← Server + client fetchers
│   └── useWindowWidth.js
├── lib/
│   ├── supabase.js               ← Client SDK
│   └── products-server.js        ← getProductServer / getProductsServer
├── store/
│   ├── authStore.js              ← Supabase auth + profile
│   ├── cartStore.js              ← Persisted cart (localStorage)
│   ├── toastStore.js
│   └── wishlistStore.js          ← Synced to Supabase when logged in
├── public/
│   ├── images/                   ← /products/*.webp, /ingredients/*.webp
│   ├── favicon.svg, manifest.json
│   ├── robots.txt                ← Sitemap directive points to verdebliss.com
│   └── sitemap.xml               ← All product/blog/static URLs (verdebliss.com)
├── supabase/
│   ├── schema.sql                ← Tables + RLS + increment_points RPC
│   └── seed_test_data.sql        ← Test users (kavya, rahul, priya)
├── tests/                        ← Vitest unit + component tests
├── .github/workflows/main.yml    ← Lint → test → preview → production
├── eslint.config.mjs             ← ESLint 9 flat config (browser/node/vitest globals)
├── next.config.js                ← 6 security headers, CSP, immutable cache
├── package.json
├── tsconfig.json                 ← TS support enabled (allowJs)
├── vercel.json                   ← Framework: nextjs, installCommand: npm ci
└── vitest.config.js              ← ESM-compatible (fileURLToPath)
```

---

## Setup

### 1. Install

```bash
npm ci
```

### 2. Environment

Copy `.env.example` to `.env.local` and fill in:

```bash
# Supabase — public keys
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# Razorpay — public key (server-side uses RAZORPAY_KEY_SECRET separately)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxx

# Gemini — server-side ONLY (no NEXT_PUBLIC_ prefix)
GEMINI_API_KEY=AIzaxxx
```

### 3. Database

Run `supabase/schema.sql` in your Supabase SQL Editor to create:

- `profiles`, `orders`, `wishlist`, `reviews` tables
- RLS policies (users read own data only)
- `increment_points(user_id, points)` RPC function

For seed data: run `supabase/seed_test_data.sql` (creates 3 test accounts).

### 4. Develop

```bash
npm run dev          # http://localhost:3000
npm run build        # Production build
npm start            # Run production server
```

---

## Scripts

| Command                 | Purpose                                                  |
| ----------------------- | -------------------------------------------------------- |
| `npm run dev`           | Next.js dev server with HMR                              |
| `npm run build`         | Production build (static generation for products + blog) |
| `npm start`             | Run production server                                    |
| `npm run lint`          | ESLint check                                             |
| `npm run format`        | Prettier write                                           |
| `npm run format:check`  | Prettier check (CI)                                      |
| `npm test`              | Vitest run once                                          |
| `npm run test:watch`    | Vitest watch mode                                        |
| `npm run test:coverage` | Coverage report (v8)                                     |

---

## Test Accounts

After running `seed_test_data.sql`, sign in with:

| Email                 | Password     | Tier               | Points | Orders |
| --------------------- | ------------ | ------------------ | ------ | ------ |
| kavya@verdebliss.test | TestPass123! | Gold Botanist      | 620    | 3      |
| rahul@verdebliss.test | TestPass123! | Green Leaf         | 85     | 1      |
| priya@verdebliss.test | TestPass123! | Platinum Alchemist | 1750   | 5      |

---

## Audit Compliance

This codebase has all 26 audit fixes from the May 2026 site audit applied. Highlights:

### Critical

- **2.1** `MotionProvider` wraps app in `MotionConfig` so Framer Motion respects OS-level `prefers-reduced-motion` (WCAG 2.3.3)
- **2.2** `next/image` in `ProductImage` — automatic WebP/AVIF, responsive sizes, lazy loading, CLS prevention
- **2.3** Prettier 3 with `.prettierrc` and `format` script

### SEO & Performance

- **3.1/3.2** `sitemap.xml` and `robots.txt` use canonical `verdebliss.com` (not vercel.app)
- **3.3** Per-product SSR metadata + `generateStaticParams` pre-renders all 8 product pages with Product JSON-LD
- **3.6** FAQ page with `FAQPage` JSON-LD schema for Google rich snippets
- **4.5** `next/font/google` replaces synchronous Google Fonts `<link>`
- **4.6** Hero image preloaded with `fetchPriority="high"`

### Accessibility (WCAG 2.1)

- **6.1** Skip-to-content link in `globals.css`
- **6.2** `*:focus-visible` ring (2px solid forest, 3px offset)
- **6.6** `SearchBar` `aria-live="polite"` region announces results to screen readers
- **6.7** `goldText` token (#8B6914) for small text on light backgrounds — WCAG AA compliant 4.5:1 contrast
- **6.8** All accordion buttons have `aria-expanded` + `aria-controls`

### E-Commerce

- **7.4** Customer review submission UI with star picker, validation, pending-moderation flow
- **7.5** 5-question Skin Quiz at `/quiz` with recommendation engine + 10% bundle discount CTA
- **7.9** Sold Out badge + disabled Add button when `stock=0`
- **7.10** FAQ page at `/faq` with 12 Q&A pairs
- **8.7** `shipping.js` constants imported into `CheckoutClient` and `CartDrawer` (single source of truth)
- **8.9** `increment_points` PostgreSQL RPC awards loyalty points + recalculates tier atomically

### Compliance (Section 11)

- **11.2** Full INCI ingredient lists for all 8 SKUs in descending concentration order
- **11.3** Allergen warnings + patch test notice on every product page
- **11.4** Cruelty-Free + Vegan certification badges link externally to leapingbunny.org / peta.org
- **11.5** "100% Natural" replaced with verifiable "95%+ Organic Ingredients"
- **11.6/11.9** FTC disclaimers + Verified Purchase tags on testimonials
- **11.7** GDPR/CCPA-compliant cookie consent with granular essential/analytics/marketing toggles
- **11.10** PAO (Period After Opening) symbols (12M / 18M) on all products

### Security

- **5.1** All 6 security headers: HSTS, X-Frame-Options DENY, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy
- **5.2** Content Security Policy whitelisting Supabase, Razorpay, Gemini API
- **5.3** `GEMINI_API_KEY` server-side only (no `NEXT_PUBLIC_` prefix) — proxied through `/api/chat`
- **5.4** Rate limiting (20 req/min/IP) on chat API

### Code Quality

- **8.1** ESLint 9 flat config with proper browser/node/vitest globals per file pattern
- **8.2** All CI jobs use `npm ci` (not `npm install`) for reproducible builds
- **8.3** `vitest.config.js` ESM-compatible via `fileURLToPath(import.meta.url)`

---

## Deployment

Push to `main` → GitHub Actions runs lint + tests → Vercel deploys automatically.

For manual deploy:

```bash
vercel deploy --prod
```

Required Vercel env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `GEMINI_API_KEY`.

---

## License

Proprietary — VerdeBliss Cosmetics Pvt. Ltd. © 2026
