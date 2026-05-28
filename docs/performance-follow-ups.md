# Performance Follow-ups

These items are launch-relevant performance debts that should stay visible during CWV reviews.

## P1: Split and Audit Global CSS

- Current state: `app/globals.css` is 90,066 bytes and 4,402 lines.
- Risk: one large global stylesheet is likely render-blocking across pages that use only a subset of the selectors.
- Follow-up: audit unused selectors, move route-specific product/catalogue/checkout/account styles into scoped modules or route-level CSS where Next can split them, and keep only tokens/base primitives in `app/globals.css`.
- Validation: compare Lighthouse/WebPageTest render-blocking CSS and LCP before and after the split on home, products, PDP, quiz, account, and checkout.
