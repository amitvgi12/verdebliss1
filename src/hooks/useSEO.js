/**
 * useSEO.js — Dynamic page title + meta description per route
 *
 * This is the SPA-safe approach to per-page SEO for a Vite/React app:
 * - Updates document.title dynamically on every route change
 * - Updates the meta[name="description"] tag
 * - Injects page-specific JSON-LD (Product schema on /products/:id)
 *
 * Limitation: Googlebot and modern crawlers execute JavaScript, so they
 * will see the updated title/description. Legacy crawlers see the fallback
 * in index.html. For full SSR SEO, migrate to Next.js / Remix.
 *
 * Usage:
 *   useSEO({ title: 'Shop Serums', description: 'Browse our organic serum range.' })
 */

import { useEffect } from 'react'

const SITE = 'VerdeBliss'
const DEFAULT_DESC = 'Premium certified organic skincare from India. Vegan, cruelty-free botanicals. Free shipping above ₹499.'

export function useSEO({ title, description, jsonLd } = {}) {
  useEffect(() => {
    // 1. Update page title
    const fullTitle = title ? `${title} | ${SITE}` : `${SITE} — Certified Organic Skincare India`
    document.title = fullTitle

    // 2. Update meta description
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) metaDesc.setAttribute('content', description ?? DEFAULT_DESC)

    // 3. Update OG title + description to match
    const ogTitle = document.querySelector('meta[property="og:title"]')
    const ogDesc  = document.querySelector('meta[property="og:description"]')
    if (ogTitle) ogTitle.setAttribute('content', fullTitle)
    if (ogDesc)  ogDesc.setAttribute('content', description ?? DEFAULT_DESC)

    // 4. Inject page-specific JSON-LD (e.g. Product schema on product pages)
    const existingScript = document.getElementById('page-jsonld')
    if (existingScript) existingScript.remove()

    if (jsonLd) {
      const script = document.createElement('script')
      script.id = 'page-jsonld'
      script.type = 'application/ld+json'
      script.textContent = JSON.stringify(jsonLd)
      document.head.appendChild(script)
    }

    // 5. Cleanup: restore defaults when component unmounts
    return () => {
      document.title = `${SITE} — Certified Organic Skincare India`
      if (metaDesc) metaDesc.setAttribute('content', DEFAULT_DESC)
      const leftover = document.getElementById('page-jsonld')
      if (leftover) leftover.remove()
    }
  }, [title, description, jsonLd])
}

/* ── Pre-built SEO configs for each page ──────────────────────────── */
export const PAGE_SEO = {
  home: {
    title: 'Certified Organic Skincare India',
    description: 'VerdeBliss — luxury certified organic skincare. Bakuchiol, niacinamide, rosehip formulas. Vegan, cruelty-free. Shop now.',
  },
  products: {
    title: 'Shop Organic Skincare',
    description: 'Browse VerdeBliss certified organic serums, moisturisers, cleansers and SPF. Filter by skin type. Free shipping above ₹499.',
  },
  ourStory: {
    title: 'Our Story — Founded in Pune, 2019',
    description: 'How VerdeBliss went from a Pune kitchen to 50,000 customers across India, UK, and UAE — without ever compromising on organic integrity.',
  },
  ingredients: {
    title: 'Ingredient Glossary — What\'s in Your Skincare',
    description: 'Explore the certified organic botanicals inside every VerdeBliss formula. Bakuchiol, rosehip, niacinamide, turmeric and more.',
  },
  sustainability: {
    title: 'Sustainability — Our Environmental Commitment',
    description: 'VerdeBliss\'s commitment to planet-first packaging, ethical sourcing, and carbon-conscious logistics.',
  },
  blog: {
    title: 'Skincare Education & Beauty Guides',
    description: 'Expert skincare guides from the VerdeBliss team. Learn about organic ingredients, routines for every skin type, and the science behind clean beauty.',
  },
  contact: {
    title: 'Contact Us',
    description: 'Get in touch with the VerdeBliss team. We\'re here for skincare advice, order support, and partnership enquiries.',
  },
}
