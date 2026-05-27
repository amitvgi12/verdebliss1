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
