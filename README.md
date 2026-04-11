# 🌿 VerdeBliss — Where Beauty Becomes Luxury

A premium organic cosmetics e-commerce built with **React + Vite**, **Supabase**, and deployed to **Vercel** via **GitHub Actions**.

---

## Architecture Overview

```
GitHub (source) ──push──► GitHub Actions (CI/CD) ──deploy──► Vercel (hosting)
                                                                    │
                                                              Supabase (DB + Auth)
```

---

## Tech Stack

| Layer       | Technology                    |
|-------------|-------------------------------|
| Frontend    | React 18 + Vite               |
| Styling     | Inline styles + Tailwind CSS  |
| Animation   | Framer Motion                 |
| State       | Zustand (cart, auth, wishlist)|
| Routing     | React Router v6               |
| Database    | Supabase (PostgreSQL)         |
| Auth        | Supabase Auth (email + Google)|
| AI Chatbot  | Anthropic Claude API          |
| Payments    | Razorpay                      |
| Hosting     | Vercel                        |
| CI/CD       | GitHub Actions                |

---

## Project Structure

```
verdebliss/
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI: lint → preview/prod deploy
├── supabase/
│   └── schema.sql              # Full DB schema + seed data
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Nav.jsx         # Sticky navbar with search + cart
│   │   │   └── Footer.jsx      # Footer with links
│   │   ├── ui/
│   │   │   ├── ProductCard.jsx # Reusable product tile
│   │   │   ├── SkeletonCard.jsx# Loading placeholder
│   │   │   ├── Stars.jsx       # Star rating display
│   │   │   ├── Badge.jsx       # Vegan/Cruelty-Free badge
│   │   │   └── Toast.jsx       # Global toast notifications
│   │   └── features/
│   │       ├── cart/
│   │       │   └── CartDrawer.jsx     # Slide-in cart
│   │       ├── chat/
│   │       │   └── ChatBot.jsx        # AI chatbot (Claude)
│   │       ├── search/
│   │       │   └── SearchBar.jsx      # Live fuzzy search
│   │       └── loyalty/
│   │           └── LoyaltyPanel.jsx   # Points + tier display
│   ├── pages/
│   │   ├── Home.jsx            # Hero, products, philosophy, testimonials
│   │   ├── Products.jsx        # Filterable product catalogue
│   │   ├── ProductDetail.jsx   # Single product page
│   │   └── Account.jsx         # Auth forms + user dashboard
│   ├── store/
│   │   ├── cartStore.js        # Zustand: cart (persisted)
│   │   ├── authStore.js        # Zustand: Supabase auth
│   │   └── wishlistStore.js    # Zustand: wishlist (persisted + synced)
│   ├── hooks/
│   │   └── useProducts.js      # Supabase data fetching hook
│   ├── lib/
│   │   └── supabase.js         # Supabase client singleton
│   ├── constants/
│   │   ├── theme.js            # Colour + font tokens
│   │   └── products.js         # Static seed data + filter options
│   ├── App.jsx                 # Router + global layout
│   └── main.jsx                # React entry point
├── index.html
├── vite.config.js
├── vercel.json                 # SPA rewrite rules
├── tailwind.config.js
└── package.json
```

---

## Local Development

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_ORG/verdebliss.git
cd verdebliss

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in your Supabase and Anthropic keys

# 4. Run the Supabase schema
# Open Supabase Dashboard → SQL Editor → paste supabase/schema.sql → Run

# 5. Start dev server
npm run dev
```

---

## Deployment: GitHub → Vercel

### Step 1 — Connect Vercel to GitHub
1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Select the `verdebliss` repository
3. Framework preset: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`
6. Add environment variables (see below)
7. Deploy

### Step 2 — Get Vercel tokens for GitHub Actions
```bash
npm i -g vercel
vercel login
vercel link          # links local project → note the org + project IDs
```

### Step 3 — Add GitHub Secrets
Go to GitHub repo → Settings → Secrets → Actions → New repository secret:

| Secret name            | Where to find it                          |
|------------------------|-------------------------------------------|
| `VERCEL_TOKEN`         | vercel.com → Settings → Tokens           |
| `VERCEL_ORG_ID`        | `.vercel/project.json` after `vercel link`|
| `VERCEL_PROJECT_ID`    | `.vercel/project.json` after `vercel link`|
| `VITE_SUPABASE_URL`    | Supabase → Project Settings → API        |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API      |
| `VITE_ANTHROPIC_API_KEY` | console.anthropic.com → API Keys       |
| `VITE_RAZORPAY_KEY_ID` | Razorpay Dashboard → Settings → API Keys |

### Step 4 — Push to main
```bash
git add .
git commit -m "feat: initial verdebliss deployment"
git push origin main
```

GitHub Actions will automatically: lint → build → deploy to Vercel production.
Pull requests get a preview URL automatically.

---

## Supabase Setup

```bash
# Run schema (one-time)
# Supabase Dashboard → SQL Editor → paste supabase/schema.sql

# Enable Google OAuth (optional)
# Supabase Dashboard → Authentication → Providers → Google
# Add your Google OAuth credentials
```

---

## Environment Variables

| Variable                  | Required | Description                     |
|---------------------------|----------|---------------------------------|
| `VITE_SUPABASE_URL`       | ✅       | Your Supabase project URL       |
| `VITE_SUPABASE_ANON_KEY`  | ✅       | Supabase anon/public key        |
| `VITE_ANTHROPIC_API_KEY`  | ✅       | For the Verde chatbot           |
| `VITE_RAZORPAY_KEY_ID`    | Optional | Razorpay test key               |

> **Security note**: The Anthropic API key is exposed to the browser in this setup. For production, proxy the chatbot call through a Vercel Edge Function or Supabase Edge Function.

---

## Features

- 🏠 **Home** — Editorial hero, featured products, philosophy, testimonials, newsletter
- 🛍️ **Shop** — Filterable catalogue (category + skin type), sortable, skeleton loaders
- 📦 **Product Detail** — Ingredient panel, related products, add to cart/wishlist
- 🔍 **Smart Search** — Fuzzy match, live autocomplete, recent searches, keyboard nav
- 🛒 **Cart** — Slide-in drawer, qty controls, loyalty points preview
- 💚 **Loyalty System** — 3 tiers, auto-earn, real-time sync via Supabase
- 👤 **Account** — Supabase auth, Google OAuth, order history, wishlist, dashboard
- 🌿 **AI Chatbot** — Claude-powered beauty advisor with product knowledge
- 📱 **Responsive** — Mobile-first at 375px, 768px, 1280px breakpoints

---

## License

MIT © 2026 VerdeBliss
