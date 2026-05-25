/* global process, console, fetch */
/**
 * Post-deploy smoke test — legal identity placeholder check.
 *
 * Fetches /, /contact, and at least one /products/[slug] from the target
 * deployment and FAILS if the rendered HTML contains any of the known
 * placeholder strings that indicate stale or demo compliance data.
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
 *   SMOKE_URL — base URL to test against (required; no trailing slash)
 *
 * Run this AFTER trigger-revalidate.mjs has completed successfully.
 * A CDN cache purge alone does NOT fix stale ISR HTML — run a revalidation
 * trigger first (see P0-1 audit finding).
 */

const KNOWN_FAKE_GSTIN = '27ABCDE1234F1Z5'
const KNOWN_FAKE_CIN = 'U20231PN2026PTC000001'

const BANNED_STRINGS = [
  { value: 'DEMO', label: 'DEMO placeholder token' },
  { value: 'Demo House', label: '"Demo House" manufacturer/packer placeholder' },
  { value: KNOWN_FAKE_GSTIN, label: `known-fake GSTIN (${KNOWN_FAKE_GSTIN})` },
  { value: KNOWN_FAKE_CIN, label: `known-fake CIN (${KNOWN_FAKE_CIN})` },
  { value: 'Kavya Menon (Demo)', label: '"Kavya Menon (Demo)" placeholder grievance officer' },
  { value: 'pending verification', label: '"pending verification" placeholder value' },
  { value: 'pending appointment', label: '"pending appointment" placeholder value' },
]

const baseUrl = process.env.SMOKE_URL?.replace(/\/$/, '')
if (!baseUrl) {
  console.error('Error: SMOKE_URL is required (e.g. https://verdebliss.com)')
  process.exit(1)
}

// Routes to check: homepage, contact (force-dynamic, usually clean), and
// at least one PDP (statically prerendered, the risky surface)
const ROUTES = ['/', '/contact', '/products/bakuchiol-renewal-serum']

let passed = 0
let failed = 0

for (const route of ROUTES) {
  const url = `${baseUrl}${route}`
  let html
  try {
    const res = await fetch(url, { redirect: 'follow' })
    if (!res.ok) {
      console.error(`FAIL  ${route} — HTTP ${res.status}`)
      failed++
      continue
    }
    html = await res.text()
  } catch (err) {
    console.error(`FAIL  ${route} — fetch error: ${err.message}`)
    failed++
    continue
  }

  const hits = BANNED_STRINGS.filter((b) => html.includes(b.value))
  if (hits.length === 0) {
    console.log(`PASS  ${route}`)
    passed++
  } else {
    for (const hit of hits) {
      console.error(`FAIL  ${route} — found ${hit.label}`)
    }
    failed++
  }
}

console.log(`\n${passed} passed, ${failed} failed`)

if (failed > 0) {
  console.error(
    '\nSmoke test failed. Likely cause: ISR cache not yet revalidated after deploy.\n' +
      'Run: DEPLOY_URL=<url> REVALIDATE_SECRET=<secret> node scripts/trigger-revalidate.mjs\n' +
      'Then re-run this smoke test. A CDN cache purge alone is NOT sufficient.'
  )
  process.exit(1)
}
