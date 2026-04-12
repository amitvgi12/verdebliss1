# VerdeBliss — QA Test Cases v2.0
**Version:** 2.0.0 | **Target:** https://verdebliss.vercel.app/
**Environments:** Chrome 124 / Safari 17 · iPhone 14 (375px) · iPad (768px) · Desktop (1280px+)

## Execution Summary

| Suite | Tests | Pass | Fail | Blocked |
|-------|-------|------|------|---------|
| Navigation | 14 | | | |
| Home Page | 16 | | | |
| Search | 10 | | | |
| Products | 14 | | | |
| Product Detail | 8 | | | |
| Cart | 12 | | | |
| Chatbot | 8 | | | |
| Auth / Account | 16 | | | |
| Loyalty Points | 8 | | | |
| Footer | 12 | | | |
| Legal Modals | 10 | | | |
| Our Story | 6 | | | |
| Ingredients | 6 | | | |
| Sustainability | 6 | | | |
| Press | 6 | | | |
| Contact | 8 | | | |
| Security | 14 | | | |
| Mobile / Responsive | 14 | | | |
| Accessibility | 10 | | | |
| Performance | 8 | | | |
| **TOTAL** | **190** | | | |

---

## TC-NAV: Navigation (14 tests)
| ID | Title | Steps | Expected | P |
|----|-------|-------|----------|---|
| NAV-01 | Logo renders | 1. Inspect nav img. | logo.png visible, alt="VerdeBliss" | P1 |
| NAV-02 | Logo text fallback | 1. 404 logo. 2. Reload. | "VerdeBliss" text shown | P2 |
| NAV-03 | Logo → home | 1. /products. 2. Click logo. | URL = / | P1 |
| NAV-04 | "Shop" active on /products | 1. Navigate. | Bold + underline | P2 |
| NAV-05 | "Home" active on / | 1. Navigate. | Active styles | P2 |
| NAV-06 | Sticky on scroll | 1. Scroll 400px. | Nav fixed at top | P1 |
| NAV-07 | Cart badge count | 1. Add item. | Terra badge with count | P1 |
| NAV-08 | Account icon green when in | 1. Sign in. | Forest green | P2 |
| NAV-09 | Account icon → /account | 1. Click (logged out). | → /account | P1 |
| NAV-10 | Hamburger at 375px | 1. Resize. | Menu icon, links hidden | P1 |
| NAV-11 | Mobile menu open/close | 1. Tap hamburger. 2. Tap link. | Opens; link = closes + navigates | P1 |
| NAV-12 | Search icon → slide bar | 1. Mobile, tap Search. | Bar slides below nav | P1 |
| NAV-13 | No overflow at 375px | 1. Resize. | All elements in viewport | P1 |
| NAV-14 | Account in mobile menu | 1. Open menu. | Account link present | P2 |

## TC-HOME: Home Page (16 tests)
| ID | Title | Steps | Expected | P |
|----|-------|-------|----------|---|
| HOME-01 | Serum fills circle | 1. Open home. | Image covers circle edge-to-edge | P1 |
| HOME-02 | No padding around image | 1. Inspect circle. | No gap between image and border | P1 |
| HOME-03 | Serum fallback on 404 | 1. Remove serum.png. | Green fallback, no broken icon | P2 |
| HOME-04 | "Shop the Collection" → /products | 1. Click CTA. | Navigates | P1 |
| HOME-05 | Hero button clickable | 1. Click at all widths. | Responds first click (z-index OK) | P1 |
| HOME-06 | 6 product cards load | 1. Open home. | Cards after skeletons | P1 |
| HOME-07 | Skeleton on slow net | 1. Throttle Slow 3G. | Shimmer cards visible | P2 |
| HOME-08 | "View All Products" → /products | 1. Click. | Navigates | P1 |
| HOME-09 | Ingredients section: 6 SVG cards | 1. Scroll. | All 6 cards with titles | P1 |
| HOME-10 | Ingredient cards animate | 1. Scroll. | Stagger slide in | P3 |
| HOME-11 | Testimonials: 3 cards | 1. Scroll. | Stars, name, city | P2 |
| HOME-12 | Newsletter subscribe | 1. Enter email. 2. Click. | Success state | P2 |
| HOME-13 | Hero tags float | 1. Watch. | Two tags animate continuously | P3 |
| HOME-14 | Philosophy section | 1. Scroll. | Forest section with 4 tiles | P2 |
| HOME-15 | Circle bobs gently | 1. Watch. | Loop up-down animation | P3 |
| HOME-16 | Stats: 500+, 4.8★, 50K+ | 1. Check hero. | All 3 visible | P2 |

## TC-SEARCH: Smart Search (10 tests)
| ID | Title | Steps | Expected | P |
|----|-------|-------|----------|---|
| SRCH-01 | Dropdown ≥2 chars | 1. Type "ser". | Results appear | P1 |
| SRCH-02 | No dropdown 1 char | 1. Type "s". | No dropdown | P2 |
| SRCH-03 | Fuzzy match | 1. Type "mosturisr". | Moisturiser results | P1 |
| SRCH-04 | Result: icon + price | 1. Search "serum". | Icon, name, cat, price | P2 |
| SRCH-05 | Click → product page | 1. Search. 2. Click. | → /products/{id} | P1 |
| SRCH-06 | Keyboard nav | 1. Type, ArrowDown ×2, Enter. | Highlights + navigates | P1 |
| SRCH-07 | Escape closes | 1. Open. 2. Escape. | Closes | P2 |
| SRCH-08 | Recent searches | 1. Click result. 2. Re-focus. | Under "RECENT" | P2 |
| SRCH-09 | No-results message | 1. Type "xyzabc". | Message shown | P2 |
| SRCH-10 | X clears input | 1. Type. 2. Click X. | Cleared | P2 |

## TC-PRODUCTS: Products Page (14 tests)
| ID | Title | Steps | Expected | P |
|----|-------|-------|----------|---|
| PROD-01 | 8 products default | 1. /products. | 8 cards | P1 |
| PROD-02 | Category filter + URL | 1. Click "Serum". | Serums; ?cat=Serum | P1 |
| PROD-03 | Footer link activates filter | 1. Footer "Serums". | /products?cat=Serum, active | P1 |
| PROD-04 | Skin type filter | 1. "Dry". | Dry products; ?skin=Dry | P1 |
| PROD-05 | Combined filters | 1. Serum + Oily. | Only Oily serums | P2 |
| PROD-06 | Clear filters | 1. Apply. 2. Clear. | All 8, URL cleared | P1 |
| PROD-07 | Sort Price Low→High | 1. Select. | ₹890 first | P2 |
| PROD-08 | Sort Top Rated | 1. Select. | 4.9★ first | P2 |
| PROD-09 | Empty state | 1. Serum + Sensitive. | Empty + Clear button | P2 |
| PROD-10 | Skeleton on slow load | 1. Throttle. | Skeletons | P2 |
| PROD-11 | H1 updates | 1. Filter Toner. | H1 = "Toners" | P2 |
| PROD-12 | Filter persists reload | 1. ?cat=Serum. 2. Reload. | Still active | P2 |
| PROD-13 | Product image shows | 1. Any card. | Serum bottle visible | P1 |
| PROD-14 | Logo watermark on image | 1. Any card. | VB logo bottom-left | P2 |

## TC-DETAIL: Product Detail (8 tests)
| ID | Title | Steps | Expected | P |
|----|-------|-------|----------|---|
| DETAIL-01 | Card click navigates | 1. Click card. | /products/{id} | P1 |
| DETAIL-02 | Correct data | 1. Bakuchiol Serum. | Name, ₹2,850, ingredient | P1 |
| DETAIL-03 | Image fills area | 1. Open detail. | Full-fill display | P1 |
| DETAIL-04 | Add to cart | 1. Click. | "Added! ✓", badge++ | P1 |
| DETAIL-05 | Wishlist toggle | 1. Heart ×2. | Fill/unfill | P2 |
| DETAIL-06 | Points preview | 1. ₹2,850. | "Earn 285 points" | P2 |
| DETAIL-07 | Related products | 1. Open Serum. | ≤4 same-cat below | P2 |
| DETAIL-08 | Back button | 1. Click ←. | Returns to /products | P2 |

## TC-CART: Cart Drawer (12 tests)
| ID | Title | Steps | Expected | P |
|----|-------|-------|----------|---|
| CART-01 | Opens from nav | 1. Click cart. | Slides right | P1 |
| CART-02 | Badge on add | 1. Add item. | Badge++ ; drawer stays closed | P1 |
| CART-03 | Empty state | 1. Open empty. | Illustration + Browse CTA | P2 |
| CART-04 | Item shown | 1. Add + open. | Name, price, qty=1 | P1 |
| CART-05 | Qty increment | 1. +. | Qty++ | P1 |
| CART-06 | Qty min 1 | 1. − at 1. | Stays 1 | P1 |
| CART-07 | Remove | 1. Remove. | Gone | P1 |
| CART-08 | Subtotal: 2×₹2850 + 1×₹890 | 1. Add. | ₹6,590 | P1 |
| CART-09 | Points preview | 1. ₹2,850. | "earn 285 points" | P2 |
| CART-10 | Persists reload | 1. Add. 2. Reload. | Still in cart | P1 |
| CART-11 | Overlay closes | 1. Open. 2. Click overlay. | Closes | P2 |
| CART-12 | Checkout | 1. Click Proceed. | Cart closes + navigates | P2 |

## TC-CHAT: Chatbot (8 tests)
| ID | Title | Steps | Expected | P |
|----|-------|-------|----------|---|
| CHAT-01 | Bubble visible | 1. Any page. | Green bubble bottom-right | P1 |
| CHAT-02 | Panel opens | 1. Click. | "Verde" panel | P1 |
| CHAT-03 | Logo in header | 1. Open. | logo.png in header | P2 |
| CHAT-04 | Greeting shown | 1. Open. | Welcome message | P1 |
| CHAT-05 | Quick replies | 1. Open (<3 msgs). | 4 chips | P2 |
| CHAT-06 | AI responds | 1. Click chip. | Response with product names | P1 |
| CHAT-07 | Typing indicator | 1. Send. | 3 animated dots | P2 |
| CHAT-08 | Closes | 1. Click X. | Closes | P1 |

## TC-AUTH: Authentication (16 tests)
| ID | Title | Steps | Expected | P |
|----|-------|-------|----------|---|
| AUTH-01 | Login form | 1. /account (out). | Login card | P1 |
| AUTH-02 | Toggle register | 1. "Sign up". | Name + Skin fields | P1 |
| AUTH-03 | Valid login | 1. Valid creds. | Dashboard | P1 |
| AUTH-04 | Bad password → error | 1. Wrong pass. | Red error | P1 |
| AUTH-05 | Register | 1. Fill all. | Created + logged in | P1 |
| AUTH-06 | Skin type in profile | 1. Reg "Oily". | "Oily skin" in card | P2 |
| AUTH-07 | Google button | 1. Login form. | Button visible | P2 |
| AUTH-08 | Sign out | 1. Click. | Login form | P1 |
| AUTH-09 | First-name greeting | 1. Login "Priya". | "Hello, Priya 🌿" | P1 |
| AUTH-10 | Order history | 1. Login w/ orders. | Rows visible | P2 |
| AUTH-11 | Status badges | 1. Delivered+Shipped. | Green + amber | P2 |
| AUTH-12 | Wishlist grid | 1. Wishlist 2. | Both shown | P2 |
| AUTH-13 | Protected route | 1. /account out. | Login only | P1 |
| AUTH-14 | Loading state | 1. Hard reload in. | "Loading…" then dash | P3 |
| AUTH-15 | Wishlist sync | 1. Guest wishlist. 2. Login. | Merged | P2 |
| AUTH-16 | Error styled | 1. Bad creds. | Red box visible | P2 |

## TC-LOYALTY: Loyalty Points (8 tests)
| ID | Title | Steps | Expected | P |
|----|-------|-------|----------|---|
| LOY-01 | Balance shown | 1. Dashboard. | Large number | P1 |
| LOY-02 | Tier badge | 1. 840 pts. | "🏆 Gold Botanist" | P1 |
| LOY-03 | Progress bar | 1. 840/1500. | ~56%; "660 to Platinum" | P1 |
| LOY-04 | Earn rates | 1. Panel. | 50/20/1 | P2 |
| LOY-05 | Redeemable value | 1. 840 pts. | "₹400" | P2 |
| LOY-06 | Cart preview | 1. ₹2,450 item. | "earn 245 pts" | P2 |
| LOY-07 | Product preview | 1. ₹1,990 item. | "Earn 199 pts" | P2 |
| LOY-08 | Bar animates | 1. Scroll to panel. | 0→% over 1.2s | P3 |

## TC-FOOTER: Footer (12 tests)
| ID | Title | Steps | Expected | P |
|----|-------|-------|----------|---|
| FOOT-01 | Logo visible (not blank) | 1. Scroll to footer. | Logo in white container, clearly visible | P1 |
| FOOT-02 | Footer logo → home | 1. Click logo. | → / | P2 |
| FOOT-03 | Serums → filter | 1. Click "Serums". | /products?cat=Serum | P1 |
| FOOT-04 | SPF → filter | 1. Click "SPF". | /products?cat=SPF | P1 |
| FOOT-05 | My Account | 1. Click. | → /account | P1 |
| FOOT-06 | Contact → page | 1. Click. | → /contact | P1 |
| FOOT-07 | Our Story → page | 1. Click. | → /our-story | P1 |
| FOOT-08 | Ingredients → page | 1. Click. | → /ingredients | P1 |
| FOOT-09 | Sustainability → page | 1. Click. | → /sustainability | P1 |
| FOOT-10 | Press → page | 1. Click. | → /press | P1 |
| FOOT-11 | Privacy Policy → modal | 1. Click. | Modal with full content | P1 |
| FOOT-12 | Responsive | 1. 375px. | Columns stack | P1 |

## TC-LEGAL: Legal Modals (10 tests)
| ID | Title | Steps | Expected | P |
|----|-------|-------|----------|---|
| LEGAL-01 | Privacy modal opens | 1. Click "Privacy Policy". | Modal + 7 sections | P1 |
| LEGAL-02 | Terms modal opens | 1. Click "Terms". | Modal + 9 sections | P1 |
| LEGAL-03 | Cookie modal opens | 1. Click "Cookie". | Modal + 6 sections | P1 |
| LEGAL-04 | Content scrollable | 1. Open Privacy. | Can scroll all sections | P1 |
| LEGAL-05 | Overlay click closes | 1. Click outside. | Closes | P1 |
| LEGAL-06 | Escape closes | 1. Escape key. | Closes | P1 |
| LEGAL-07 | X button closes | 1. Click X. | Closes | P1 |
| LEGAL-08 | "I understand" closes | 1. Click. | Closes | P1 |
| LEGAL-09 | Body scroll locked | 1. Open. 2. Try scroll. | Page frozen | P2 |
| LEGAL-10 | role="dialog" present | 1. Inspect DOM. | role + aria-modal | P2 |

## TC-STORY: Our Story /our-story (6 tests)
| ID | Title | Steps | Expected | P |
|----|-------|-------|----------|---|
| STORY-01 | Page loads | 1. /our-story. | Renders, no error | P1 |
| STORY-02 | Hero visible | 1. View. | Dark green hero + H1 | P1 |
| STORY-03 | Timeline: 6 entries | 1. Scroll. | 2019–2026 entries | P1 |
| STORY-04 | Entries animate | 1. Scroll. | Slide in from left | P3 |
| STORY-05 | Team: 4 cards | 1. Scroll. | 4 member cards | P2 |
| STORY-06 | CTA → /products | 1. Click. | Navigates | P1 |

## TC-ING: Ingredients /ingredients (6 tests)
| ID | Title | Steps | Expected | P |
|----|-------|-------|----------|---|
| ING-01 | Page loads | 1. /ingredients. | Renders | P1 |
| ING-02 | 8 cards with SVG | 1. Scroll. | 8 illustrated cards | P1 |
| ING-03 | Source info | 1. Any card. | "SOURCE" + botanical name | P2 |
| ING-04 | Best For tag | 1. Any card. | Skin type chip | P2 |
| ING-05 | Never Use: 6 tiles | 1. Scroll. | 6 ✕ tiles | P2 |
| ING-06 | Shop CTA | 1. Click. | → /products | P1 |

## TC-SUSTAIN: Sustainability /sustainability (6 tests)
| ID | Title | Steps | Expected | P |
|----|-------|-------|----------|---|
| SUS-01 | Page loads | 1. /sustainability. | Renders | P1 |
| SUS-02 | 6 metric tiles | 1. View. | 92%, 84%, 41%, 34, 12, ₹5 | P1 |
| SUS-03 | 6 pillar cards | 1. Scroll. | All 6 with icons | P2 |
| SUS-04 | Progress bars animate | 1. Scroll. | Fill from 0 | P2 |
| SUS-05 | Bar accuracy | 1. Recyclable. | Shows 92% | P2 |
| SUS-06 | Responsive 375px | 1. Resize. | No overflow | P2 |

## TC-PRESS: Press /press (6 tests)
| ID | Title | Steps | Expected | P |
|----|-------|-------|----------|---|
| PRESS-01 | Page loads | 1. /press. | Renders | P1 |
| PRESS-02 | 6 coverage cards | 1. Scroll. | Vogue, Forbes, etc. | P1 |
| PRESS-03 | Awards: 6 rows | 1. Scroll. | Year, award, badge | P2 |
| PRESS-04 | Download Kit → toast | 1. Click. | Info toast with email | P2 |
| PRESS-05 | Cards animate | 1. Scroll. | Fade+slide | P3 |
| PRESS-06 | Contact email visible | 1. Hero. | press@verdebliss.in | P2 |

## TC-CONTACT: Contact /contact (8 tests)
| ID | Title | Steps | Expected | P |
|----|-------|-------|----------|---|
| CONT-01 | Page loads | 1. /contact. | Renders | P1 |
| CONT-02 | 4 channel cards | 1. View left col. | Email, Phone, Chat, Address | P1 |
| CONT-03 | Form fields present | 1. View form. | Name, Email, Topic, Message | P1 |
| CONT-04 | Submit all fields | 1. Fill. 2. Submit. | Loading → success | P1 |
| CONT-05 | Empty required guard | 1. Leave Name empty. | No submission | P1 |
| CONT-06 | Success shows checkmark | 1. Submit. | Green ✓ + "Message sent!" | P2 |
| CONT-07 | Topic dropdown: 6 options | 1. Open. | 6 topics | P2 |
| CONT-08 | Responsive 375px | 1. Resize. | Form stacks below channels | P2 |

## TC-SEC: Security (14 tests)
| ID | Title | Steps | Expected | P |
|----|-------|-------|----------|---|
| SEC-01 | No API key in bundle | 1. DevTools search "sk-ant". | Not found | P1 |
| SEC-02 | Rate limit 429 | 1. 21 POSTs in 60s. | 21st = 429 | P1 |
| SEC-03 | GET blocked | 1. GET /api/chat. | 405 | P2 |
| SEC-04 | Empty msgs rejected | 1. POST []. | 400 | P2 |
| SEC-05 | >40 msgs rejected | 1. POST 41. | 400 | P2 |
| SEC-06 | Long content rejected | 1. >2000 chars. | 400 | P2 |
| SEC-07 | X-Frame-Options | 1. curl -I site. | DENY | P1 |
| SEC-08 | nosniff | 1. curl -I. | Present | P1 |
| SEC-09 | HSTS | 1. curl -I. | max-age=63072000 | P1 |
| SEC-10 | CSP | 1. curl -I. | Present | P1 |
| SEC-11 | CORS evil.com | 1. evil.com origin. | 403 | P1 |
| SEC-12 | Supabase anon no profiles | 1. Query directly. | Empty/401 | P1 |
| SEC-13 | Footer logo visible | 1. Inspect footer. | White container, not blank | P2 |
| SEC-14 | Modal Escape closes | 1. Open. 2. Escape. | Closes cleanly | P2 |

## TC-MOB: Mobile & Responsive (14 tests)
| ID | Title | Steps | Expected | P |
|----|-------|-------|----------|---|
| MOB-01 | No overflow 375px | 1. Resize. | No horizontal scroll | P1 |
| MOB-02 | Search slide bar | 1. Mobile tap Search. | Slides down | P1 |
| MOB-03 | Hero text readable | 1. 375px. | clamp() — no overflow | P1 |
| MOB-04 | Hero circle fills | 1. 375px. | Serum fills circle | P1 |
| MOB-05 | Products 1-col | 1. 375px. | Single column | P1 |
| MOB-06 | Sidebar stacks | 1. 375px, /products. | Filter above grid | P1 |
| MOB-07 | Cart full-width | 1. 375px, open. | Full-width | P2 |
| MOB-08 | Chat no overflow | 1. 375px, open. | min(340px,100vw-40px) | P1 |
| MOB-09 | Footer stacks | 1. 375px. | 4 cols stacked | P1 |
| MOB-10 | Legal modal fits | 1. 375px, open. | Scrollable, no overflow | P1 |
| MOB-11 | Company pages responsive | 1. /our-story 375px. | Stacks, readable | P2 |
| MOB-12 | Contact form usable | 1. /contact 375px. | Fills viewport | P2 |
| MOB-13 | Timeline 1-col | 1. /our-story 375px. | Single column | P2 |
| MOB-14 | Tablet 768px | 1. Resize. | 2-col, sidebar visible | P2 |

## TC-A11Y: Accessibility (10 tests)
| ID | Title | Steps | Expected | P |
|----|-------|-------|----------|---|
| A11Y-01 | Nav ARIA labels | 1. Inspect. | aria-label on Account, Cart, menu | P1 |
| A11Y-02 | Cart count ARIA | 1. 3 items. | "Cart, 3 items" | P1 |
| A11Y-03 | Search label | 1. Inspect. | aria-label="Search products" | P2 |
| A11Y-04 | Chat dialog role | 1. Open. | role="dialog" + aria-label | P2 |
| A11Y-05 | Legal modal role | 1. Open modal. | role="dialog" + aria-modal | P2 |
| A11Y-06 | Logo alt text | 1. Inspect img. | alt="VerdeBliss" | P1 |
| A11Y-07 | Decorative aria-hidden | 1. Chatbot logo. | aria-hidden="true" | P2 |
| A11Y-08 | Focus visible | 1. Tab through. | Ring on every element | P1 |
| A11Y-09 | Contrast body text | 1. Run axe. | No failures | P1 |
| A11Y-10 | Modal keyboard nav | 1. Tab in modal. | "I understand" reachable | P2 |

## TC-PERF: Performance (8 tests)
| ID | Title | Steps | Expected | P |
|----|-------|-------|----------|---|
| PERF-01 | 5 JS chunks | 1. Network tab /. | 5 chunk files | P2 |
| PERF-02 | Vendor cache | 1. Reload ×2. | Vendors from cache | P2 |
| PERF-03 | Product imgs lazy | 1. Inspect. | loading="lazy" | P2 |
| PERF-04 | Hero img eager | 1. Inspect hero. | No lazy attr | P2 |
| PERF-05 | Footer logo no filter | 1. Inspect. | White container | P3 |
| PERF-06 | LCP ≤ 2.5s | 1. Lighthouse. | ≤ 2.5s | P2 |
| PERF-07 | CLS ≤ 0.1 | 1. Lighthouse. | ≤ 0.1 | P2 |
| PERF-08 | No chunk >200kB gzip | 1. Check dist. | All ≤ 55 kB gzip | P2 |

---

## Regression Checklist (Run After Every Deploy)
- [ ] NAV-03 — Logo navigates home
- [ ] HOME-01 — Serum fills circle edge-to-edge
- [ ] HOME-04 — "Shop the Collection" works
- [ ] HOME-05 — Hero button not blocked
- [ ] PROD-03 — Footer "Serums" activates filter
- [ ] FOOT-01 — Footer logo clearly visible (not blank)
- [ ] FOOT-07 — Our Story link navigates
- [ ] FOOT-11 — Privacy Policy modal opens
- [ ] LEGAL-06 — Escape closes modal
- [ ] SRCH-05 — Search result navigates
- [ ] CART-08 — Subtotal ₹6,590 correct
- [ ] AUTH-03 — Login works
- [ ] AUTH-08 — Sign out works
- [ ] SEC-01 — API key absent from bundle
- [ ] MOB-01 — No overflow at 375px
- [ ] CONT-04 — Contact form submits

---

## Bug Report Template
```
ID:          BUG-2026-###
Severity:    Critical / High / Medium / Low
TC Ref:      [e.g. MOB-01]
Target URL:  https://verdebliss.vercel.app/
Steps:
1.
2.
Expected:    
Actual:      
Device:      
Screenshot:  
```
