/* global process, console, fetch, URL */
/**
 * Post-deploy smoke test — sitemap-wide legal identity and build consistency check.
 *
 * Fetches sitemap.xml, then requests every listed public page from the target
 * deployment. Fails if rendered HTML contains known placeholder/demo legal data
 * or if the x-build-sha response header drifts between public pages.
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

function decodeXml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}
