# VerdeBliss Audit Fixes Applied

This package applies the critical, major, and minor fixes identified in the fresh audit across architecture, security, performance, SEO/accessibility, and D2C commerce readiness.

## Critical security and commerce fixes

- Added server-owned checkout APIs for Razorpay order creation, Razorpay payment verification, and Cash on Delivery order creation.
- Removed browser-side order creation from checkout.
- Removed browser-side loyalty-point mutation from checkout.
- Added server-side cart normalization so product price, subtotal, shipping, total, and loyalty points are recalculated from product IDs and quantities.
- Added Razorpay signature verification using `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`.
- Added service-role Supabase admin helper for trusted server mutations only.
- Hardened Supabase schema and RLS to prevent public/authenticated execution of unsafe loyalty mutation paths.
- Replaced the unsafe `increment_points` function with service-role-only `apply_loyalty_points`.
- Replaced permissive refund status updates with staff-only policy enforcement.

## D2C commerce fixes

- Added normalized `order_items` table.
- Added `payment_events` ledger.
- Added `loyalty_ledger` table.
- Added `customer_consents` table for newsletter consent.
- Added `contact_tickets` table for contact/support form submissions.
- Added refund request API that validates the logged-in user from the auth token.
- Added server-side product lookup with Supabase service-role fallback to static catalog.
- Aligned product schema IDs with the app route/cart model.

## SEO and accessibility fixes

- Replaced invalid `metadata.other['script:ld+json']` usage with real `<script type="application/ld+json">` structured-data rendering.
- Added reusable structured-data utilities.
- Added dynamic sitemap generation.
- Fixed product JSON-LD image-path mapping.
- Added visible/hidden accessible labels to contact/newsletter forms.
- Replaced clickable search dropdown divs with semantic buttons.
- Implemented real Privacy Policy and Cookie Policy modal actions from the cookie banner.
- Improved legal modal keyboard behavior with focus trapping and focus restoration.

## Performance fixes

- Replaced remaining raw image tags with `next/image` in primary app/components surfaces.
- Recompressed oversized product, ingredient, and logo images.
- Reduced large product/ingredient assets from multi-megabyte files to web-optimized WebP files.
- Added safer browser-only lazy Supabase client initialization to avoid server/build open handles.

## Bug fixes

- Removed duplicate review rendering on product detail pages.
- Added review moderation schema fields: `title`, `approved`, and `updated_at`.
- Added backend contact and newsletter routes and connected the UI forms to them.
- Server-side chat support now derives profile/order context from the auth token and service role instead of trusting client-supplied account context.

## Validation run

- `npm run format:check` passed.
- `npm run lint` passed.
- `npx tsc --noEmit` passed.
- `npm test` passed: 52 tests across 3 test files.
- `next build --experimental-build-mode generate` completed and produced the route table.

Note: In this container, standard `npm run build` compiled, generated static pages, finalized optimization, and wrote `.next` build artifacts, but the process did not return cleanly after `Collecting build traces`. Standalone TypeScript/lint/test checks passed, and the Next generate phase completed successfully.

## 2026-05-08 follow-up fix

- Made `supabase/schema.sql` idempotent so re-running it on an existing Supabase project no longer fails with `ERROR: 42P07: relation "products" already exists`.
- Preserved existing UUID product tables instead of forcing a destructive ID-type migration.
- Updated checkout product lookup to support both UUID product IDs from Supabase and text/static fallback product IDs.
- Added `supabase/README_RUN_SCHEMA.md` with execution notes.
