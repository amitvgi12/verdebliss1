# Security Best Practices Report

Date: 2026-06-01

## Executive Summary

Reviewed the TypeScript/Next.js 16.2.6 application, React client code, Supabase schema/RLS, Razorpay checkout/webhook flow, CSP/proxy configuration, and public API routes using the local security-best-practices guidance for Next.js server code, React frontend code, and general browser JavaScript.

No critical code-level vulnerabilities were found in the reviewed paths. The application has several strong controls already in place: Razorpay webhook raw-body HMAC verification, server-side checkout amount/cart validation, Supabase RLS on sensitive customer tables, service-role-only commerce RPCs, route-aware CSP/security headers, Turnstile on high-abuse forms, and CSRF checks on state-changing app routes.

The highest-priority gaps are trust-boundary and hardening issues: spoofable client-IP headers can weaken rate limits if direct-to-origin access is possible, Supabase bearer tokens are persisted in browser storage, newsletter links derive their host from the incoming request, some public routes return raw internal/vendor errors, and the CSP reporting endpoint can be abused for noisy logging.

Dependency advisory coverage was not completed. `npm audit --omit=dev --json` needs network access and was blocked because it would send dependency metadata to the npm registry.

## Remediation Status

- `SEC-001` remediated on 2026-06-01. The proxy now strips caller-supplied origin-trust headers, stamps Cloudflare verification only after the origin secret matches, supports `CF_ORIGIN_GATE_REQUIRED=true` production fail-closed mode, and `lib/client-ip.ts` trusts `cf-connecting-ip` only when that verified marker is present.

## Scope And Evidence

- Stack: TypeScript, Next.js App Router, React, Supabase, Razorpay, Gemini API.
- Relevant local guidance loaded:
  - `javascript-typescript-nextjs-web-server-security.md`
  - `javascript-typescript-react-web-frontend-security.md`
  - `javascript-general-web-frontend-security.md`
- Package evidence: `package.json` uses `next` `16.2.6`, `react` `19.2.5`, and `react-dom` `19.2.5`. This Next.js version is above the patched-version thresholds called out by the local guidance for the 2025 React/Next advisory, but this is not a full live advisory audit.

## Critical Findings

None found.

## High Findings

### SEC-001: Rate limits can be bypassed if spoofed forwarding headers reach the app

- Rule ID: `NEXT-DOS-001`, `NEXT-PROXY-001`
- Severity: High
- Status: Remediated on 2026-06-01.
- Location:
  - `lib/client-ip.ts:36`
  - `lib/rate-limit.ts:163`
  - `proxy.ts:27`
  - `proxy.ts:70`
  - `CLOUDFLARE_WAF.md:9`
- Evidence:
  ```ts
  const cf = pickFirst(request.headers.get('cf-connecting-ip'))
  if (cf) return { ip: cf, source: 'cf' }
  ```
  ```ts
  const CF_ORIGIN_SECRET = process.env.CF_ORIGIN_SECRET
  const CF_ORIGIN_GATE_ENABLED = Boolean(CF_ORIGIN_SECRET)
  ```
  ```ts
  const ip = getClientIp(request)
  const ipKey = `${scope}:ip:${ip}`
  ```
- Impact: If the Vercel origin or any API route is reachable without the Cloudflare origin secret, an attacker can spoof `cf-connecting-ip`, `x-vercel-forwarded-for`, or `x-forwarded-for` and rotate apparent IPs to evade checkout, chat, contact, newsletter, refund, and review rate limits.
- Fix: Fail closed in production unless `CF_ORIGIN_SECRET` or an equivalent authenticated-origin control is configured. Only trust `cf-connecting-ip` after the Cloudflare gate has passed, and avoid trusting generic `x-forwarded-for` unless the upstream proxy is known and strips user-supplied values.
- Mitigation: Keep Cloudflare WAF/rate-limit rules enabled and verify direct `*.vercel.app` origin access is not usable for API calls.
- False positive notes: This is mitigated if production traffic can only reach the app through Cloudflare and `CF_ORIGIN_SECRET` is set correctly. That cannot be proven from repo code alone.

### SEC-002: Supabase access tokens are persisted in browser storage and reused as bearer tokens

- Rule ID: `REACT-AUTH-001`, `JS-STORAGE-001`, `NEXT-SECRETS-002`
- Severity: High
- Location:
  - `lib/supabase.ts:31`
  - `app/checkout/CheckoutClient.tsx:110`
  - `lib/api-client.ts:18`
  - `components/features/chat/ChatBot.tsx:192`
  - `components/features/reviews/ReviewSection.tsx:82`
- Evidence:
  ```ts
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  ```
  ```ts
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
  ```
  ```ts
  if (options.authToken) headers['Authorization'] = `Bearer ${options.authToken}`
  ```
- Impact: Any XSS, compromised third-party script, malicious extension, or browser-side supply-chain compromise can read persisted Supabase tokens and call customer or staff-capable endpoints until the token expires.
- Fix: Prefer Supabase SSR auth with `HttpOnly`, `Secure` in production, `SameSite` cookies and server-side session lookup. For app API calls, read the authenticated user server-side from cookies rather than asking the client to attach bearer tokens.
- Mitigation: Keep CSP strict, minimize third-party script execution, shorten token lifetime where feasible, and require step-up checks for staff actions.
- False positive notes: Supabase browser auth commonly persists sessions this way, and the current CSP reduces XSS risk. It still conflicts with the frontend guidance for sensitive token storage.

## Medium Findings

### SEC-003: Newsletter confirmation URLs and redirects derive the origin from the incoming request

- Rule ID: `NEXT-HOST-001`, `NEXT-REDIRECT-001`
- Severity: Medium
- Location:
  - `lib/newsletter-confirmation.ts:19`
  - `app/api/newsletter/route.ts:78`
  - `app/api/newsletter/confirm/route.ts:6`
- Evidence:
  ```ts
  export function newsletterConfirmationUrl(requestUrl: string, token: string): string {
    const url = new URL('/api/newsletter/confirm', requestUrl)
  ```
  ```ts
  const confirmationUrl = newsletterConfirmationUrl(request.url, token)
  ```
  ```ts
  const redirectUrl = new URL('/', request.url)
  ```
- Impact: If an attacker can influence the `Host` or forwarded host seen by Next.js, confirmation emails and redirect `Location` headers may point at an attacker-controlled domain. That can enable phishing or newsletter token capture.
- Fix: Build confirmation links and redirects from a canonical allowlisted origin such as `SITE_URL` or a server-only `APP_ORIGIN`, not from `request.url`.
- Mitigation: Ensure the edge/CDN overwrites host headers and blocks direct-origin requests.
- False positive notes: This is mitigated if Vercel/Cloudflare always enforce the canonical host before the request reaches the app.

### SEC-004: Public API routes return raw internal or provider error messages

- Rule ID: `NEXT-ERROR-001`, `NEXT-LOG-001`
- Severity: Medium
- Location:
  - `app/api/contact/route.ts:79`
  - `app/api/contact/route.ts:82`
  - `app/api/reviews/route.ts:61`
  - `app/api/reviews/route.ts:91`
  - `app/api/checkout/verify-razorpay/route.ts:64`
  - `app/api/checkout/verify-razorpay/route.ts:70`
  - `lib/commerce.ts:545`
- Evidence:
  ```ts
  if (error) throw new Error(error.message)
  ```
  ```ts
  {
    error: error instanceof Error ? error.message : 'Unable to submit message'
  }
  ```
  ```ts
  throw new Error(error.message)
  ```
- Impact: Database constraint names, RPC/function names, provider response descriptions, or operational details can leak to unauthenticated or customer-facing clients, helping attackers map the backend and making sensitive misconfiguration easier to enumerate.
- Fix: Log raw errors server-side with a correlation id and return stable user-facing messages plus structured error codes.
- Mitigation: Keep detailed errors only for non-production environments.
- False positive notes: Some user-facing validation messages are intentional and safe. The issue is returning unclassified caught exception text from database/vendor paths.

### SEC-005: CSP reporting endpoint is unauthenticated, gate-exempt, and not rate-limited

- Rule ID: `NEXT-DOS-001`, `NEXT-LOG-001`
- Severity: Medium
- Location:
  - `proxy.ts:45`
  - `proxy.ts:97`
  - `app/api/csp-report/route.ts:27`
  - `app/api/csp-report/route.ts:38`
  - `app/api/csp-report/route.ts:82`
- Evidence:
  ```ts
  const CF_ORIGIN_GATE_EXEMPT = (path: string) =>
    path.startsWith('/api/webhooks/') || path === '/api/version' || path === '/api/csp-report'
  ```
  ```ts
  response.headers.set('Reporting-Endpoints', 'csp-endpoint="/api/csp-report"')
  ```
  ```ts
  reportError('csp_violation', {
    reports,
    userAgent: request.headers.get('user-agent') ?? null,
  })
  ```
- Impact: Anyone can generate many small reports to produce log/Sentry noise and potential monitoring cost. Allowed report fields can also include URLs with sensitive query strings unless they are stripped before logging.
- Fix: Add a low-cost IP rate limit or sampling before `reportError`, and normalize report URLs by dropping query strings and fragments.
- Mitigation: Keep the current 20 KB payload cap and field allowlist; configure log-drain/Sentry quotas.
- False positive notes: Browser CSP reports are intentionally unauthenticated, so the goal is abuse containment rather than authentication.

## Low Findings

### SEC-006: Third-party checkout and bot-defense scripts run without Subresource Integrity

- Rule ID: `REACT-SRI-001`, `JS-SRI-001`, `REACT-3P-001`
- Severity: Low
- Location:
  - `app/checkout/CheckoutClient.tsx:91`
  - `components/ui/TurnstileWidget.tsx:81`
  - `proxy.ts:150`
- Evidence:
  ```ts
  script.src = 'https://checkout.razorpay.com/v1/checkout.js'
  ```
  ```ts
  script.src = SCRIPT_SRC
  ```
  ```ts
  const scriptHosts =
    'https://checkout.razorpay.com https://cdn.razorpay.com https://challenges.cloudflare.com https://va.vercel-scripts.com'
  ```
- Impact: If a third-party script provider is compromised, script runs with the application origin's browser privileges and can read non-HttpOnly tokens or customer data available in the page.
- Fix: Use SRI where the vendor provides stable immutable assets, or self-host only if the vendor permits and supports it. Otherwise keep the CSP host list minimal and document the vendor risk acceptance.
- Mitigation: Moving auth tokens to HttpOnly cookies would sharply reduce the impact of third-party script compromise.
- False positive notes: Razorpay and Turnstile scripts are often dynamic and may not be compatible with SRI. This is a supply-chain hardening gap, not an immediate exploit.

### SEC-007: Static/ISR routes intentionally fall back to `'unsafe-inline'` script CSP

- Rule ID: `NEXT-CSP-001`, `REACT-CSP-001`, `JS-CSP-002`
- Severity: Low
- Location:
  - `proxy.ts:52`
  - `proxy.ts:155`
  - `tests/proxy-csp.test.ts:45`
- Evidence:
  ```ts
  const scriptCore = useNonce
    ? `'self' 'nonce-${nonce}' 'strict-dynamic' ${scriptHosts}`
    : `'self' 'unsafe-inline' ${scriptHosts}`
  ```
  ```ts
  it('uses unsafe-inline scripts without a nonce or strict-dynamic', () => {
  ```
- Impact: Public static pages have a weaker script CSP than dynamic account/checkout/form routes. Any future XSS on those routes would have less browser-enforced containment.
- Fix: Continue tracking Next.js/static rendering options that allow nonce or hash-based CSP on static routes. Consider route-specific hashes if the generated inline script surface becomes stable.
- Mitigation: The current implementation confines nonce CSP to authenticated/high-risk routes and has regression tests documenting the trade-off.
- False positive notes: This appears to be an intentional compatibility decision to avoid blank static/ISR pages.

### SEC-008: Public version endpoint exposes environment and capability booleans

- Rule ID: `NEXT-LOG-001`, `NEXT-SECRETS-001`
- Severity: Low
- Location:
  - `app/api/version/route.ts:11`
  - `lib/runtime-env.ts:65`
- Evidence:
  ```ts
  return NextResponse.json({
    name: pkg.name,
    version: pkg.version,
    gitSha: getPublicRevision(isProduction),
    environment,
    builtAt: process.env.NEXT_PUBLIC_BUILD_TIME ?? 'unknown',
    deployedAt:
      process.env.VERCEL_DEPLOYMENT_CREATED_AT ?? process.env.NEXT_PUBLIC_BUILD_TIME ?? 'unknown',
    capabilities: getEnvironmentCapabilities(),
  ```
- Impact: Attackers can use deployment timing, environment, and missing capability booleans for reconnaissance.
- Fix: In production, return only the fields required by health checks, or protect detailed diagnostics behind an internal secret/header.
- Mitigation: `gitSha` is already redacted in production unless explicitly exposed.
- False positive notes: This may be intentionally public for smoke tests and launch checks.

## Positive Controls Observed

- Razorpay webhook uses raw-body signature verification before JSON parsing: `app/api/webhooks/razorpay/route.ts:35`.
- Razorpay payment verification ignores browser-submitted cart/address data and uses the trusted checkout session: `app/api/checkout/verify-razorpay/route.ts:32`.
- Checkout finalization validates payment order, amount, currency, and status before persisting the order: `lib/commerce.ts:588`.
- State-changing customer routes use same-origin/custom-header CSRF checks: `lib/csrf.ts:46`.
- Supabase RLS is enabled on customer and operational tables: `supabase/schema.sql:897`.
- Sensitive commerce RPCs are revoked from `anon` and `authenticated` and granted only to `service_role`: `supabase/schema.sql:872`.
- JSON-LD rendering escapes HTML-sensitive characters: `lib/seo.ts:163`.
- No committed `.env` files were found; only `.env.example` is present.

## Recommended Fix Order

1. Make production origin/header trust fail closed and harden client IP extraction (`SEC-001`).
2. Plan migration from browser-persisted bearer tokens to server-side/HttpOnly-cookie Supabase auth (`SEC-002`).
3. Replace host-derived newsletter URLs with a canonical allowlisted origin (`SEC-003`).
4. Normalize public API error handling (`SEC-004`).
5. Rate-limit and redact the CSP report endpoint (`SEC-005`).
6. Document or reduce accepted frontend supply-chain/CSP trade-offs (`SEC-006`, `SEC-007`, `SEC-008`).

## Verification Notes

- `npm audit --omit=dev --json` was attempted but could not complete without external registry access.
- No tests were run because this task produced a report only and did not change application behavior.
