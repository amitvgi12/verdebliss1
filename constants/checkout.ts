/**
 * Checkout limits — client + server safe.
 *
 * `lib/commerce.ts` is server-only because it imports `node:crypto`. Importing
 * `COD_MAX_TOTAL` from there pulls the whole server module into the client
 * bundle and breaks the build. Constants that both sides need to agree on go
 * here instead.
 *
 * Server code in `lib/commerce.ts` re-exports this so existing callers that
 * import `{ COD_MAX_TOTAL } from '@/lib/commerce'` keep working.
 */

// Cap raised from ₹500 (which collided with the ₹499 free-shipping threshold
// and made COD effectively unreachable for any cart of 2+ items) to a level
// usable by real customers.
export const COD_MAX_TOTAL = 2500
