# Intentional Security Follow-ups

These items are accepted as low-risk launch trade-offs. Keep them visible during security reviews so they can be revisited when vendor or build-tool constraints change.

## COEP and Razorpay Checkout

- Current decision: do not send `Cross-Origin-Embedder-Policy`.
- Reason: Razorpay Checkout runs in a cross-origin iframe and may rely on credentialed/embed behavior that COEP can disrupt.
- Revisit when: Razorpay publishes checkout embed guidance that explicitly supports COEP, such as `credentialless` or `require-corp`.
- Validation before enabling: complete Razorpay sandbox success, failure, retry, and webhook reconciliation flows in browsers with COEP enabled.

## CSP Style Inline Allowance

- Current decision: keep `'unsafe-inline'` in `style-src` and `style-src-elem`, but not in `script-src`.
- Reason: Next.js and Tailwind v4 can emit runtime style tags; forcing style nonces/hashes risks breaking JIT-generated styles.
- Risk posture: inline style injection is less severe than script execution, and script CSP remains nonce-based with `strict-dynamic`.
- Revisit when: the frontend no longer depends on Tailwind JIT/runtime style injection or the styling pipeline supports stable style nonces/hashes.
- Validation before removing: run visual/a11y coverage on checkout, PDPs, nav/footer, cookie banner, and responsive catalogue views.

## Route-aware script CSP (unsafe-inline on static/ISR routes)

- Current decision: static / ISR public routes serve `script-src 'self' 'unsafe-inline'`; always-dynamic routes (`/account`, `/checkout`, `/contact`, `/quiz`, `/refund`) use a per-request nonce + `'strict-dynamic'`. See `requiresScriptNonce` in `proxy.ts`.
- Reason: a per-request nonce cannot be embedded in statically prerendered / ISR-cached HTML. Applying nonce + `strict-dynamic` to those routes blocks Next.js's bootstrap/hydration scripts and renders blank pages.
- Risk posture: the inline allowance applies only to auth-less marketing/catalogue pages. The single HTML-injection sink (JSON-LD) is escaped via `safeJsonLd`; React auto-escapes everything else. Authenticated/payment routes keep the strict nonce policy.
- Revisit when: public routes can render per-request (so a nonce applies) without losing ISR, or Next emits stable per-build script hashes.
- Validation before changing: load `/`, `/products`, `/products/[id]`, `/blog` and confirm content renders with zero CSP console errors.

## Dev / CI dependency advisories (@lhci/cli)

- Current decision: accept the `npm audit` advisories that exist only in `@lhci/cli` (Lighthouse CI) transitive deps (`tmp` high, `uuid` moderate); keep `@lhci/cli` at the latest release (0.15.1).
- Reason: the production runtime is clean (`npm audit --omit=dev` reports 0). These advisories live in a dev/CI-only tool that runs against our own preview deployments — they are not in the shipped bundle or any production request path. npm's only offered fix is `npm audit fix --force`, which downgrades `@lhci/cli` to 0.1.0 and breaks Lighthouse CI.
- Risk posture: no production exposure; the tool only processes our own URLs in CI (no untrusted input).
- Revisit when: `@lhci/cli` ships a release whose transitive `tmp` / `uuid` are patched.
- Validation before changing: `npm audit --omit=dev` stays at 0 and the Lighthouse CI job passes on a PR.
