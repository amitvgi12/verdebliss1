/* global process, console, fetch, URL */
/**
 * Post-deploy smoke test — sitemap-wide legal identity and build consistency check.
 *
 * Fetches sitemap.xml, then requests every listed public page from the target
 * deployment. Fails if rendered HTML contains known placeholder/demo legal data
 * or if the x-build-sha response header drifts between public pages.
 *
 * Also runs a PDP pricing-consistency check (guards P0-1). For every priced
 * product card on /products it asserts:
 *   1. the PDP shows the same price (listing price === PDP price),
 *   2. the PDP never renders "price unavailable", and
 *   3. the Product JSON-LD (/api/schema/product/:slug) carries a valid offer
 *      price (> 0) equal to the listing price.
 *
 * This guards the *served cache*, not just the build.  The prebuild validator
 * guards the build env; this script confirms the live site is clean after
 * ISR revalidation has run.
 *
 * Usage:
 *   SMOKE_URL=https://verdebliss.com node scripts/smoke-test.mjs
 *   SMOKE_URL=https://preview.verdebliss.com node scripts/smoke-test.mjs
 *
 * Environment variables:
 *   SMOKE_URL           — base URL to test against (required; no trailing slash)
 *   EXPECTED_BUILD_SHA  — optional exact x-build-sha value required on every page
 *
 * Run this AFTER trigger-revalidate.mjs has completed successfully.
 * A CDN cache purge alone does NOT fix stale ISR HTML — run a revalidation
 * trigger first (see P0-1 audit finding).
 */

const KNOWN_FAKE_GSTIN = '27ABCDE1234F1Z5'
const KNOWN_FAKE_CIN = 'U20231PN2026PTC000001'

const BANNED_STRINGS = [
  // --- Legal identity placeholders ---
  { value: 'DEMO', label: 'DEMO placeholder token' },
  { value: 'Demo House', label: '"Demo House" manufacturer/packer placeholder' },
  { value: KNOWN_FAKE_GSTIN, label: `known-fake GSTIN (${KNOWN_FAKE_GSTIN})` },
  { value: KNOWN_FAKE_CIN, label: `known-fake CIN (${KNOWN_FAKE_CIN})` },
  { value: 'Kavya Menon (Demo)', label: '"Kavya Menon (Demo)" placeholder grievance officer' },
  { value: 'pending verification', label: '"pending verification" placeholder value' },
  { value: 'pending appointment', label: '"pending appointment" placeholder value' },
]

// Forbidden cosmetic claim patterns (regex). Mirrors lib/product-claims.ts
// FORBIDDEN_CLAIM_PATTERNS — keep in sync.
const BANNED_PATTERNS = [
  { pattern: /pregnancy[- ]safe/i, label: '"pregnancy-safe" therapeutic safety claim' },
  {
    pattern: /suitable\s+for\s+use\s+during\s+pregnancy/i,
    label: '"suitable for use during pregnancy" safety claim',
  },
  { pattern: /\banti[- ]inflammatory\b/i, label: '"anti-inflammatory" drug action claim' },
  {
    pattern: /without\s+absorbing\s+into\s+(?:the\s+)?bloodstream/i,
    label: '"without absorbing into bloodstream" bioavailability claim',
  },
  {
    pattern: /reflects?\s+UVA\s*(?:\+|and)\s*UVB/i,
    label: '"reflects UVA+UVB" unsubstantiated SPF mechanism claim',
  },
  { pattern: /\breef[- ]safe\b/i, label: '"reef-safe" unsubstantiated environmental claim' },
  {
    pattern: /\btreats?\s+(?:acne|pimples?|inflammation|skin\s+condition)/i,
    label: '"treats acne/inflammation" drug action claim',
  },
  {
    pattern: /\bcures?\s+(?:acne|pimples?|skin|eczema|psoriasis)/i,
    label: '"cures" drug claim',
  },
  {
    pattern: /\bheals?\s+(?:acne|scars?|skin\s+damage|wounds?)/i,
    label: '"heals acne/scars" drug action claim',
  },
]

const baseUrl = process.env.SMOKE_URL?.replace(/\/$/, '')
if (!baseUrl) {
  console.error('Error: SMOKE_URL is required (e.g. https://verdebliss.com)')
  process.exit(1)
}

const sitemapRoutes = await getSitemapRoutes(baseUrl)
if (sitemapRoutes.length <= 3) {
  console.error(
    `FAIL  sitemap-wide coverage expected more than 3 public routes; found ${sitemapRoutes.length}`
  )
  process.exit(1)
}

let passed = 0
let failed = 0
let expectedBuildSha = process.env.EXPECTED_BUILD_SHA?.trim() || ''

for (const route of sitemapRoutes) {
  const url = `${baseUrl}${route}`
  let html
  let buildSha
  try {
    const res = await fetch(url, { redirect: 'follow' })
    if (!res.ok) {
      console.error(`FAIL  ${route} — HTTP ${res.status}`)
      failed++
      continue
    }
    buildSha = res.headers.get('x-build-sha')?.trim() ?? ''
    html = await res.text()
  } catch (err) {
    console.error(`FAIL  ${route} — fetch error: ${err.message}`)
    failed++
    continue
  }

  const stringHits = BANNED_STRINGS.filter((b) => html.includes(b.value))
  const patternHits = BANNED_PATTERNS.filter((b) => b.pattern.test(html))
  const allHits = [...stringHits, ...patternHits]

  if (!buildSha) {
    allHits.push({ label: 'missing x-build-sha header' })
  } else if (!expectedBuildSha) {
    expectedBuildSha = buildSha
  } else if (buildSha !== expectedBuildSha) {
    allHits.push({ label: `x-build-sha drift (${buildSha} !== ${expectedBuildSha})` })
  }

  if (allHits.length === 0) {
    console.log(`PASS  ${route}`)
    passed++
  } else {
    for (const hit of allHits) {
      console.error(`FAIL  ${route} — found ${hit.label}`)
    }
    failed++
  }
}

// PDP pricing consistency: every priced product card on /products must show the
// same price on its PDP, and no PDP may render "price unavailable" (guards P0-1).
const pdpPricingFailures = await checkProductPdpPricing(baseUrl)
if (pdpPricingFailures.length === 0) {
  console.log('PASS  PDP pricing consistency (listing price == PDP price, no "price unavailable")')
  passed++
} else {
  for (const failure of pdpPricingFailures) console.error(`FAIL  ${failure}`)
  failed++
}

// Structured-data delivery: schema must be an INLINE application/ld+json block,
// never an external-src data block (whose src is ignored, so crawlers never see
// it). Guards audit F1.
const structuredDataFailures = await checkInlineStructuredData(baseUrl)
if (structuredDataFailures.length === 0) {
  console.log('PASS  inline JSON-LD delivery (homepage Organization + PDP Product, no external src)')
  passed++
} else {
  for (const failure of structuredDataFailures) console.error(`FAIL  ${failure}`)
  failed++
}

console.log(`\n${passed} passed, ${failed} failed`)
if (expectedBuildSha) console.log(`Expected x-build-sha: ${expectedBuildSha}`)

if (failed > 0) {
  console.error(
    '\nSmoke test failed. Likely cause: ISR cache not yet revalidated after deploy.\n' +
      'Run: DEPLOY_URL=<url> REVALIDATE_SECRET=<secret> node scripts/trigger-revalidate.mjs\n' +
      'Then re-run this smoke test. A CDN cache purge alone is NOT sufficient.'
  )
  process.exit(1)
}

async function getSitemapRoutes(baseUrl) {
  const sitemapUrl = `${baseUrl}/sitemap.xml`
  let xml
  try {
    const response = await fetch(sitemapUrl, { redirect: 'follow' })
    if (!response.ok) {
      console.error(`Error: sitemap fetch returned HTTP ${response.status}`)
      process.exit(1)
    }
    xml = await response.text()
  } catch (err) {
    console.error(`Error: sitemap fetch failed — ${err.message}`)
    process.exit(1)
  }

  const routes = new Set()
  for (const match of xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)) {
    const rawLoc = decodeXml(match[1].trim())
    if (!rawLoc) continue
    try {
      const loc = new URL(rawLoc)
      routes.add(`${loc.pathname}${loc.search}`)
    } catch {
      // Ignore malformed loc entries; the final empty/low-coverage check will fail.
    }
  }

  return [...routes].sort((a, b) => {
    if (a === '/') return -1
    if (b === '/') return 1
    return a.localeCompare(b)
  })
}

async function checkProductPdpPricing(baseUrl) {
  const failures = []
  let listingHtml
  try {
    const res = await fetch(`${baseUrl}/products`, { redirect: 'follow' })
    if (!res.ok) return [`/products — listing returned HTTP ${res.status}`]
    // React splits the ₹ symbol from the number with a comment node; strip it.
    listingHtml = (await res.text()).replaceAll('<!-- -->', '')
  } catch (err) {
    return [`/products — listing fetch error: ${err.message}`]
  }

  // ProductCard media link: <a aria-label="View <name>, ₹<price>" href="/products/<slug>">
  const cards = [
    ...listingHtml.matchAll(/aria-label="View [^"]*?, (₹[\d,]+)"\s+href="\/products\/([a-z0-9-]+)"/g),
  ].map((m) => ({ price: m[1], slug: m[2] }))

  if (cards.length === 0) return ['/products — no priced product cards found in listing HTML']

  for (const { slug, price } of cards) {
    const listingNum = Number(price.replace(/[^\d]/g, ''))

    // (1) listing price === PDP price, and (2) PDP never renders "price unavailable".
    try {
      const res = await fetch(`${baseUrl}/products/${slug}`, { redirect: 'follow' })
      if (!res.ok) {
        failures.push(`/products/${slug} — PDP returned HTTP ${res.status}`)
      } else {
        const html = (await res.text()).replaceAll('<!-- -->', '')
        if (/price (temporarily )?unavailable/i.test(html)) {
          failures.push(`/products/${slug} — PDP renders "price unavailable"`)
        } else if (!html.includes(price)) {
          failures.push(`/products/${slug} — PDP does not show the listing price ${price}`)
        }
      }
    } catch (err) {
      failures.push(`/products/${slug} — PDP fetch error: ${err.message}`)
    }

    // (3) Product JSON-LD must carry a valid offer price equal to the listing price.
    try {
      const res = await fetch(`${baseUrl}/api/schema/product/${slug}`, { redirect: 'follow' })
      if (!res.ok) {
        failures.push(`/api/schema/product/${slug} — no Product offer schema (HTTP ${res.status})`)
      } else {
        const json = await res.text()
        const match = json.match(/"price":\s*"?(\d+(?:\.\d+)?)"?/)
        const schemaNum = match ? Number(match[1]) : NaN
        if (!Number.isFinite(schemaNum) || schemaNum <= 0) {
          failures.push(`/api/schema/product/${slug} — offer schema missing a valid price`)
        } else if (schemaNum !== listingNum) {
          failures.push(
            `/api/schema/product/${slug} — offer price ${schemaNum} != listing price ${listingNum}`
          )
        }
      }
    } catch (err) {
      failures.push(`/api/schema/product/${slug} — schema fetch error: ${err.message}`)
    }
  }
  return failures
}

/**
 * Asserts the served HTML carries INLINE JSON-LD, not an external-src data block.
 * The presence of a `"@type":"Organization"` / `"@type":"Product"` substring in
 * the raw HTML proves the schema is inline — an external-src block would leave
 * the HTML without it. Also flags any regression to a `<script …ld+json… src=>`.
 */
async function checkInlineStructuredData(baseUrl) {
  const failures = []
  const externalSrc = /<script[^>]*application\/ld\+json[^>]*\bsrc=/i

  // Resolve a real product slug from the listing for the PDP check.
  let firstSlug = null
  try {
    const res = await fetch(`${baseUrl}/products`, { redirect: 'follow' })
    if (res.ok) {
      const html = (await res.text()).replaceAll('<!-- -->', '')
      firstSlug = html.match(/href="\/products\/([a-z0-9-]+)"/)?.[1] ?? null
    }
  } catch {
    // handled by the missing-slug failure below
  }

  const targets = [{ path: '/', needle: '"@type":"Organization"', label: 'homepage Organization' }]
  if (firstSlug) {
    targets.push({ path: `/products/${firstSlug}`, needle: '"@type":"Product"', label: 'PDP Product' })
  } else {
    failures.push('/products — could not resolve a product slug for the inline JSON-LD check')
  }

  for (const { path, needle, label } of targets) {
    try {
      const res = await fetch(`${baseUrl}${path}`, { redirect: 'follow' })
      if (!res.ok) {
        failures.push(`${path} — HTTP ${res.status}`)
        continue
      }
      const html = (await res.text()).replaceAll('<!-- -->', '')
      if (externalSrc.test(html)) {
        failures.push(`${path} — JSON-LD served via external src (data-block src is ignored by crawlers)`)
      }
      if (!html.includes(needle)) {
        failures.push(`${path} — no inline ${label} JSON-LD (${needle} absent from served HTML)`)
      }
    } catch (err) {
      failures.push(`${path} — fetch error: ${err.message}`)
    }
  }
  return failures
}

function decodeXml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}
