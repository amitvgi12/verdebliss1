# Patch notes — product routes and Razorpay checkout

This patch addresses two live issues reported after deployment.

## 1. Product detail page stuck on `Loading...`

Root cause: `ProductDetailClient` always read the `loading` state from `useProduct()`. When a product was already supplied by the server as `initialProduct`, the hook was intentionally called without an ID, but its initial `loading` state remained `true`. The client therefore rendered the loading screen forever.

Fixes applied:

- Product detail now renders immediately when `initialProduct` is present.
- `useProduct()` now sets `loading=false` when no client fetch is needed.
- `useProduct()` now queries by `slug` first and only queries `id` when the route parameter is UUID-shaped, avoiding invalid UUID errors on existing Supabase projects.
- Product cards and search results now route to product slugs when available, for example `/products/rose-hip-glow-moisturiser` instead of `/products/2`.
- Sitemap and product canonical metadata now use slug URLs.

## 2. Razorpay prompt: server credentials are not configured

Root cause: secure checkout requires both browser and server Razorpay credentials. The public key alone is not enough because the server must create the Razorpay order and verify the payment signature.

Required deployment environment variables:

```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_or_test_xxxxx
RAZORPAY_KEY_ID=rzp_live_or_test_xxxxx
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

For Vercel, add them under Project Settings → Environment Variables, then redeploy.

Fixes applied:

- Checkout API now returns a structured 503 response with code `RAZORPAY_SERVER_CREDENTIALS_MISSING` when server credentials are missing.
- Checkout UI now shows a clean inline error message instead of only using browser alerts.
- README environment-variable documentation has been updated.

## Validation run

```text
npm run format:check  passed
npm run lint          passed
npx tsc --noEmit      passed
npm test              passed — 52 tests
npx next build --experimental-build-mode generate passed
```

Note: in this container, standard `next build` compiles and generates pages, but can hang during `Collecting build traces`; the generate build mode completed and printed the route table.
