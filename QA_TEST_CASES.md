# VerdeBliss — QA Test Cases
**Version:** 1.0.0 | **Prepared by:** QA Engineer
**Environments:** Chrome 124 / Safari 17 / Firefox 125 · iPhone 14 (375px) · iPad (768px) · Desktop (1280px+)

---

## Execution Summary Template

| Suite | Total | Pass | Fail | Blocked |
|-------|-------|------|------|---------|
| Navigation | 12 | | | |
| Home Page | 14 | | | |
| Search | 10 | | | |
| Products | 14 | | | |
| Product Detail | 8 | | | |
| Cart | 12 | | | |
| Chatbot | 8 | | | |
| Auth / Account | 16 | | | |
| Loyalty Points | 8 | | | |
| Footer | 8 | | | |
| Security | 12 | | | |
| Mobile / Responsive | 12 | | | |
| Accessibility | 8 | | | |
| Performance | 6 | | | |
| **TOTAL** | **148** | | | |

---

## TC-NAV: Navigation

| ID | Title | Steps | Expected | Priority |
|----|-------|-------|----------|----------|
| NAV-01 | Logo renders from image | 1. Open homepage. 2. Inspect `<img>` in nav. | logo.png visible, alt="VerdeBliss", height=40px | P1 |
| NAV-02 | Logo text fallback on 404 | 1. Rename logo.png. 2. Reload. | "VerdeBliss" text shown, no broken icon | P2 |
| NAV-03 | Logo click → home | 1. Go to /products. 2. Click logo. | URL becomes `/`, Home renders | P1 |
| NAV-04 | "Shop" link active state | 1. Navigate to /products. | "Shop" bold with forest underline | P2 |
| NAV-05 | "Home" active on root | 1. Navigate to `/`. | "Home" active styles applied | P2 |
| NAV-06 | Sticky nav on scroll | 1. Scroll 400px down. | Nav remains fixed at top | P1 |
| NAV-07 | Cart badge shows item count | 1. Add product to cart. | Terra-coloured badge with count appears | P1 |
| NAV-08 | Cart badge spring animation | 1. Add first item. | Badge scales from 0 with spring motion | P3 |
| NAV-09 | Account icon → /account | 1. Click User icon (logged out). | Redirects to /account login form | P1 |
| NAV-10 | Account icon green when logged in | 1. Sign in. 2. Check icon colour. | User icon colour = C.forest green | P2 |
| NAV-11 | Mobile hamburger appears <768px | 1. Resize to 375px. | Menu icon visible, nav links hidden | P1 |
| NAV-12 | Mobile menu open/close | 1. Tap hamburger. 2. Tap a link. | Slide-in panel opens; tapping link closes it and navigates | P1 |

---

## TC-HOME: Home Page

| ID | Title | Steps | Expected | Priority |
|----|-------|-------|----------|----------|
| HOME-01 | Hero shows serum.png | 1. Open homepage. | Animated serum bottle visible in hero | P1 |
| HOME-02 | Serum fallback emoji | 1. Remove serum.png. 2. Reload. | 🌿 emoji shown — no broken image | P2 |
| HOME-03 | "Shop the Collection" navigates | 1. Click hero CTA. | Navigates to /products | P1 |
| HOME-04 | Hero button clickable (z-index fix) | 1. Click CTA on all viewport widths. | Button responds on first click — no dead zone | P1 |
| HOME-05 | Product grid loads 6 cards | 1. Open homepage. | 6 product cards visible after skeletons | P1 |
| HOME-06 | Skeleton screens during load | 1. Throttle to Slow 3G. 2. Reload. | 6 shimmer skeletons before real cards | P2 |
| HOME-07 | "View All Products" navigates | 1. Click button below grid. | Navigates to /products | P1 |
| HOME-08 | Ingredients section visible | 1. Scroll to ingredients. | 6 SVG ingredient cards with titles + descriptions | P1 |
| HOME-09 | Ingredient cards animate in | 1. Scroll to section. | Cards fade+slide up staggered via whileInView | P3 |
| HOME-10 | Testimonials render | 1. Scroll to testimonials. | 3 cards with star ratings, names, cities | P2 |
| HOME-11 | Newsletter subscribe success | 1. Enter email. 2. Click Subscribe. | "You're on the list!" success state shown | P2 |
| HOME-12 | Newsletter empty field | 1. Click Subscribe with empty field. | No crash; browser or silent guard | P2 |
| HOME-13 | Floating hero badges animate | 1. Load homepage. | "Bakuchiol Serum" and "SPF 50 Shield" float continuously | P3 |
| HOME-14 | Philosophy section visible | 1. Scroll to philosophy. | Forest-green section with 4 benefit tiles | P2 |

---

## TC-SEARCH: Smart Search Bar

| ID | Title | Steps | Expected | Priority |
|----|-------|-------|----------|----------|
| SRCH-01 | Dropdown on typing ≥2 chars | 1. Focus search. 2. Type "ser". | Dropdown with matching products | P1 |
| SRCH-02 | No dropdown for 1 char | 1. Type "s". | No dropdown | P2 |
| SRCH-03 | Fuzzy match | 1. Type "mosturisr". | Moisturiser products in results | P1 |
| SRCH-04 | Result shows image + price | 1. Search "serum". | Each result: emoji, name, category, price | P2 |
| SRCH-05 | Click result navigates | 1. Search "toner". 2. Click result. | Navigates to /products/{id} | P1 |
| SRCH-06 | Keyboard navigation | 1. Type "serum". 2. ArrowDown ×2. 3. Enter. | 2nd result highlighted → Enter navigates | P1 |
| SRCH-07 | Escape closes dropdown | 1. Open dropdown. 2. Press Escape. | Dropdown closes, input clears | P2 |
| SRCH-08 | Recent searches shown | 1. Click a result. 2. Re-focus empty bar. | Previous term under "RECENT" | P2 |
| SRCH-09 | No-results message | 1. Type "xyzabc". | "No results for xyzabc" message | P2 |
| SRCH-10 | Clear X button | 1. Type "serum". 2. Click X. | Input clears, dropdown closes | P2 |

---

## TC-PRODUCTS: Products Page

| ID | Title | Steps | Expected | Priority |
|----|-------|-------|----------|----------|
| PROD-01 | All 8 products by default | 1. Navigate to /products. | 8 product cards visible | P1 |
| PROD-02 | Category filter + URL param | 1. Click "Serum". | Only serums shown; URL has ?cat=Serum | P1 |
| PROD-03 | Footer link activates filter | 1. Click "Serums" in footer. | Navigates to /products?cat=Serum, filter active | P1 |
| PROD-04 | Skin type filter | 1. Click "Dry". | Products for dry skin; URL has ?skin=Dry | P1 |
| PROD-05 | Combined filters | 1. Select Serum + Oily. | Only serums for oily skin shown | P2 |
| PROD-06 | Clear filters | 1. Apply filter. 2. Click "Clear Filters". | All 8 products, URL params cleared | P1 |
| PROD-07 | Sort: Price Low→High | 1. Select "Price Low→High". | ₹890 Lip Elixir first | P2 |
| PROD-08 | Sort: Top Rated | 1. Select "Top Rated". | SPF 50 Shield (4.9★) first | P2 |
| PROD-09 | Sort URL param written | 1. Sort by Top Rated. | URL contains ?sort=Top+Rated | P3 |
| PROD-10 | Empty state | 1. Select Serum + Sensitive. | Empty state with 🌿 and "Clear Filters" button | P2 |
| PROD-11 | Skeleton on slow load | 1. Throttle to Slow 3G. 2. Open /products. | Shimmer skeletons before cards | P2 |
| PROD-12 | Cards animate in | 1. Navigate to /products. | Cards stagger fade+slide up | P3 |
| PROD-13 | Filter persists on reload | 1. Apply ?cat=Serum. 2. Reload. | Serum filter still active | P2 |
| PROD-14 | Page H1 updates with category | 1. Filter by Toner. | H1 reads "Toners" | P2 |

---

## TC-DETAIL: Product Detail Page

| ID | Title | Steps | Expected | Priority |
|----|-------|-------|----------|----------|
| DETAIL-01 | Card click navigates | 1. Click any product card. | /products/{id} loads | P1 |
| DETAIL-02 | Correct data shown | 1. Open Bakuchiol Serum. | Name, ₹2,850, ingredient "Bakuchiol" visible | P1 |
| DETAIL-03 | Product image + logo overlay | 1. Open any detail page. | Serum image + VerdeBliss logo watermark bottom-left | P1 |
| DETAIL-04 | Add to cart | 1. Click "Add to Cart". | Button → "Added! ✓", cart badge increments | P1 |
| DETAIL-05 | Wishlist heart toggle | 1. Click heart. 2. Click again. | Fills terra colour, then unfills | P2 |
| DETAIL-06 | Points preview | 1. Open ₹2,850 product. | "Earn 285 loyalty points" shown | P2 |
| DETAIL-07 | Related products | 1. Open a Serum. | Up to 4 products from same category below | P2 |
| DETAIL-08 | Back button | 1. Click "← Back to Products". | Returns to /products | P2 |

---

## TC-CART: Cart Drawer

| ID | Title | Steps | Expected | Priority |
|----|-------|-------|----------|----------|
| CART-01 | Opens from nav icon | 1. Click ShoppingBag. | Drawer slides from right | P1 |
| CART-02 | Badge updates on add | 1. Click "Add" on a card. | Badge count increments, drawer doesn't auto-open | P1 |
| CART-03 | Empty state | 1. Open empty cart. | Illustration + "Browse Products" CTA | P2 |
| CART-04 | Item appears in cart | 1. Add Rose Hip. 2. Open cart. | Name, price, qty=1 shown | P1 |
| CART-05 | Qty increment | 1. Click + for item. | Qty increases, subtotal updates | P1 |
| CART-06 | Qty min=1 | 1. Click − at qty=1. | Qty stays at 1 | P1 |
| CART-07 | Remove item | 1. Click "Remove". | Item removed from list | P1 |
| CART-08 | Subtotal calculation | 1. Add 2× Bakuchiol (₹2,850) + 1× Lip Elixir (₹890). | Subtotal = ₹6,590 | P1 |
| CART-09 | Points preview in cart | 1. Add ₹2,850 item. | "You'll earn 285 loyalty points" | P2 |
| CART-10 | Persists on reload | 1. Add items. 2. Hard reload. | Items still in cart (Zustand persist) | P1 |
| CART-11 | Overlay closes cart | 1. Open cart. 2. Click dark overlay. | Cart closes | P2 |
| CART-12 | Checkout button | 1. Click "Proceed to Checkout". | Cart closes, navigates to /checkout | P2 |

---

## TC-CHAT: AI Chatbot

| ID | Title | Steps | Expected | Priority |
|----|-------|-------|----------|----------|
| CHAT-01 | Bubble visible | 1. Load any page. | Green floating button bottom-right | P1 |
| CHAT-02 | Panel opens | 1. Click bubble. | Chat panel with "Verde" header + logo | P1 |
| CHAT-03 | Greeting shown | 1. Open chat. | Initial Verde welcome message visible | P1 |
| CHAT-04 | Quick replies visible | 1. Open chat (< 3 messages). | 4 quick-reply chips shown | P2 |
| CHAT-05 | Quick reply sends + responds | 1. Click "Best serum for dry skin?". | Message sent; Verde responds with recommendation | P1 |
| CHAT-06 | Typing indicator | 1. Send a message. | 3 animated dots while awaiting response | P2 |
| CHAT-07 | Enter key sends | 1. Type message. 2. Press Enter. | Message sent without clicking Send | P2 |
| CHAT-08 | Panel closes | 1. Click X bubble. | Chat slides closed | P1 |

---

## TC-AUTH: Authentication & Account

| ID | Title | Steps | Expected | Priority |
|----|-------|-------|----------|----------|
| AUTH-01 | Login form shows when logged out | 1. Navigate to /account. | Login card rendered | P1 |
| AUTH-02 | Toggle to register | 1. Click "Sign up free". | Name + Skin Type fields appear | P1 |
| AUTH-03 | Valid login → dashboard | 1. Enter valid credentials. 2. Sign In. | Dashboard with profile name shown | P1 |
| AUTH-04 | Wrong password → error | 1. Enter wrong password. | Red error message displayed | P1 |
| AUTH-05 | Unknown email → error | 1. Enter unregistered email. | Supabase error shown | P2 |
| AUTH-06 | Register new user | 1. Fill all fields. 2. Submit. | Account created, auto-logged in | P1 |
| AUTH-07 | Skin type in profile | 1. Register with "Oily". | Profile card shows "Oily skin" | P2 |
| AUTH-08 | Google OAuth button present | 1. View login form. | "Continue with Google" button visible | P2 |
| AUTH-09 | Sign out | 1. Click "Sign Out". | Login form shown, user data cleared | P1 |
| AUTH-10 | First-name greeting | 1. Log in as "Priya Sharma". | "Hello, Priya 🌿" in header | P1 |
| AUTH-11 | Order history rows | 1. Log in with orders. | Order rows: ID, date, total, status | P2 |
| AUTH-12 | Order status badge colours | 1. View Delivered + Shipped orders. | Delivered = green, Shipped = amber | P2 |
| AUTH-13 | Wishlist grid | 1. Wishlist 2 products. 2. View account. | Both products in wishlist grid | P2 |
| AUTH-14 | Wishlist syncs on login | 1. Wishlist as guest. 2. Log in. | Server wishlist merged | P2 |
| AUTH-15 | Dashboard not shown logged out | 1. /account when logged out. | Login form, not dashboard | P1 |
| AUTH-16 | Loading state on hard reload | 1. Hard-reload while logged in. | "Loading…" briefly, then dashboard | P3 |

---

## TC-LOYALTY: Loyalty Points

| ID | Title | Steps | Expected | Priority |
|----|-------|-------|----------|----------|
| LOY-01 | Balance displayed prominently | 1. Log in. 2. View dashboard. | Large serif number in green gradient panel | P1 |
| LOY-02 | Tier badge shown | 1. Account with 840 pts. | "🏆 Gold Botanist" badge visible | P1 |
| LOY-03 | Progress bar accuracy | 1. 840/1500 pts account. | Bar ~56% filled; "660 pts until Platinum" | P1 |
| LOY-04 | Earn rates displayed | 1. View panel. | 50pts/20pts/1pt rates shown | P2 |
| LOY-05 | Redeemable value | 1. 840 pts. | "₹400 redeemable value" shown | P2 |
| LOY-06 | Cart shows earn preview | 1. Add ₹2,450 item. | "earn 245 loyalty points" in cart footer | P2 |
| LOY-07 | Product detail shows earn | 1. Open ₹1,990 product. | "Earn 199 loyalty points" shown | P2 |
| LOY-08 | Bar animates on view | 1. Scroll to panel. | Width animates 0→correct % over 1.2s | P3 |

---

## TC-FOOTER: Footer Navigation

| ID | Title | Steps | Expected | Priority |
|----|-------|-------|----------|----------|
| FOOT-01 | Serums → /products?cat=Serum | 1. Click "Serums" in footer. | Navigates + Serum filter active | P1 |
| FOOT-02 | SPF → /products?cat=SPF | 1. Click "SPF". | Navigates + SPF filter active | P1 |
| FOOT-03 | My Account → /account | 1. Click "My Account". | Navigates to /account | P1 |
| FOOT-04 | Our Story → toast | 1. Click "Our Story". | "Our Story — coming soon! 🌿" toast | P2 |
| FOOT-05 | Footer logo → home | 1. Click footer logo. | Navigates to / | P2 |
| FOOT-06 | Privacy Policy → toast | 1. Click "Privacy Policy". | Coming soon toast shown | P2 |
| FOOT-07 | Footer responsive | 1. Resize to 375px. | Columns stack vertically, no overflow | P1 |
| FOOT-08 | Email visible | 1. View footer. | hello@verdebliss.in displayed | P3 |

---

## TC-SEC: Security

| ID | Title | Steps | Expected | Priority |
|----|-------|-------|----------|----------|
| SEC-01 | API key absent from bundle | 1. DevTools → Search JS files for "sk-ant". | No key found | P1 |
| SEC-02 | Rate limit enforced | 1. Send 21 POSTs to /api/chat in 60s. | 21st returns HTTP 429 | P1 |
| SEC-03 | GET blocked on /api/chat | 1. GET /api/chat. | HTTP 405 Method Not Allowed | P2 |
| SEC-04 | Empty messages rejected | 1. POST `{"messages":[]}`. | HTTP 400 | P2 |
| SEC-05 | >40 messages rejected | 1. POST 41 message array. | HTTP 400 | P2 |
| SEC-06 | Long content rejected | 1. POST message content >2000 chars. | HTTP 400 | P2 |
| SEC-07 | X-Frame-Options: DENY | 1. curl -I https://verdebliss.vercel.app | Header present | P1 |
| SEC-08 | X-Content-Type-Options | 1. curl -I site. | nosniff header present | P1 |
| SEC-09 | HSTS header | 1. curl -I site. | max-age=63072000 present | P1 |
| SEC-10 | CSP header | 1. curl -I site. | Content-Security-Policy present | P1 |
| SEC-11 | CORS blocks evil.com | 1. POST /api/chat with Origin: https://evil.com | HTTP 403 | P1 |
| SEC-12 | Anon cannot read profiles | 1. Query profiles table with anon key. | Empty or 401 | P1 |

---

## TC-MOB: Mobile & Responsive

| ID | Title | Steps | Expected | Priority |
|----|-------|-------|----------|----------|
| MOB-01 | No icon bleed at 375px | 1. Resize to 375px. | All nav icons within viewport, no scroll | P1 |
| MOB-02 | Search slides down | 1. Tap Search icon on mobile. | Bar slides down below nav | P1 |
| MOB-03 | Hero text readable | 1. At 375px, view hero. | H1 uses clamp() — no overflow or tiny text | P1 |
| MOB-04 | Product grid 1-column | 1. At 375px, view /products. | Single column product cards | P1 |
| MOB-05 | Sidebar stacks above | 1. At 375px, open /products. | Filter above grid, not beside | P1 |
| MOB-06 | Cart drawer fits | 1. Open cart at 375px. | Drawer full/near-full width | P2 |
| MOB-07 | Chatbot fits mobile | 1. Open chat at 375px. | Width = min(340px, 100vw-40px) — no overflow | P1 |
| MOB-08 | Footer stacks | 1. View footer at 375px. | 4 columns stack via auto-fit grid | P1 |
| MOB-09 | Testimonials stack | 1. At 375px, scroll to testimonials. | Cards stack, no horizontal overflow | P1 |
| MOB-10 | Ingredient grid wraps | 1. At 375px, scroll to ingredients. | Cards wrap to 2 or 1 column | P1 |
| MOB-11 | Wishlist tap target | 1. iPhone — tap heart on card. | Heart responds reliably (30×30 touch target) | P2 |
| MOB-12 | Tablet 768px layout | 1. Resize to 768px. | 2-col product grid, sidebar visible, desktop nav | P2 |

---

## TC-A11Y: Accessibility

| ID | Title | Steps | Expected | Priority |
|----|-------|-------|----------|----------|
| A11Y-01 | Nav ARIA labels | 1. Inspect nav buttons. | aria-label on Account, Cart, hamburger | P1 |
| A11Y-02 | Cart count in ARIA | 1. Add 3 items. | aria-label="Cart, 3 items" | P1 |
| A11Y-03 | Search input label | 1. Inspect search. | aria-label="Search products" | P2 |
| A11Y-04 | Chat dialog role | 1. Open chat, inspect. | role="dialog" + aria-label | P2 |
| A11Y-05 | Logo alt text | 1. Inspect logo img. | alt="VerdeBliss" | P1 |
| A11Y-06 | Decorative logo aria-hidden | 1. Inspect chatbot header logo. | aria-hidden="true" on decorative image | P2 |
| A11Y-07 | Focus visible | 1. Tab through all buttons. | Every element shows visible focus ring | P1 |
| A11Y-08 | Colour contrast ≥4.5:1 | 1. Run axe DevTools. | No contrast failures on body text | P1 |

---

## TC-PERF: Performance

| ID | Title | Steps | Expected | Priority |
|----|-------|-------|----------|----------|
| PERF-01 | JS bundle split | 1. Network tab on /. | 5 separate chunk files loaded | P2 |
| PERF-02 | Vendor chunks cached | 1. Hard reload then soft reload. | Vendor chunks from disk cache on 2nd load | P2 |
| PERF-03 | Lazy image loading | 1. Inspect ProductImage imgs. | loading="lazy" on all product images | P2 |
| PERF-04 | Footer logo via CSS filter | 1. Inspect footer logo. | filter: brightness(0) invert(1) applied | P3 |
| PERF-05 | LCP ≤ 2.5s | 1. Run Lighthouse on homepage. | LCP score ≤ 2.5s | P2 |
| PERF-06 | CLS ≤ 0.1 | 1. Run Lighthouse. | No layout shift on load | P2 |

---

## Regression Checklist (after every deploy)

- [ ] NAV-03 — Logo navigates home
- [ ] HOME-03 — "Shop the Collection" button works
- [ ] HOME-04 — Hero button not blocked by overlay (z-index fix)
- [ ] PROD-03 — Footer "Serums" activates filter
- [ ] SRCH-05 — Search result navigates to product
- [ ] CART-08 — Subtotal calculation correct
- [ ] AUTH-03 — Login with valid credentials
- [ ] AUTH-09 — Sign out clears session
- [ ] SEC-01 — API key absent from JS bundle
- [ ] MOB-01 — No horizontal scroll at 375px
- [ ] LOY-03 — Progress bar % accurate

---

## Bug Report Template

```
ID:          BUG-2026-###
Title:       [Short description]
Severity:    Critical / High / Medium / Low
TC Ref:      [e.g. MOB-01]
Reported:    [Date]

Steps to Reproduce:
1.
2.
3.

Expected:    [What should happen]
Actual:      [What happened]
Device:      [Browser + OS + viewport]
Screenshot:  [attach]
```
