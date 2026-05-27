/* global process, console, fetch, URL */
/**
 * Post-deploy revalidation trigger.
 *
 * Calls POST /api/revalidate to purge the ISR cache for every public sitemap
 * route and every product page. Exits non-zero on any failure so the deploy
 * pipeline is blocked until the purge succeeds.
 *
 * Usage:
 *   REVALIDATE_SECRET=<secret> DEPLOY_URL=https://verdebliss.com node scripts/trigger-revalidate.mjs
 *
 * Environment variables:
 *   DEPLOY_URL                  — base URL of the deployment to revalidate (required)
 *   REVALIDATE_SECRET           — must match the server-side REVALIDATE_SECRET (required)
 *   MIN_REVALIDATED_PRODUCTS    — optional minimum PDP count expected from the API
 *
 * IMPORTANT: A CDN cache purge alone does NOT fix stale ISR HTML.  A full
 * rebuild/redeploy followed by this revalidation trigger is required.  See
 * the audit finding P0-1 for the root-cause explanation.
 */

const baseUrl = process.env.DEPLOY_URL?.replace(/\/$/, '')
const secret = process.env.REVALIDATE_SECRET

if (!baseUrl) {
  console.error('Error: DEPLOY_URL is required (e.g. https://verdebliss.com)')
  process.exit(1)
}
if (!secret) {
  console.error('Error: REVALIDATE_SECRET is required')
  process.exit(1)
}

const url = `${baseUrl}/api/revalidate`
console.log(`Triggering revalidation: POST ${url}`)

let response
try {
  response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-revalidate-secret': secret,
    },
    body: JSON.stringify({}),
  })
} catch (err) {
  console.error(`Error: network request failed — ${err.message}`)
  process.exit(1)
}

let body
try {
  body = await response.json()
} catch {
  body = {}
}

if (!response.ok) {
  console.error(`Error: revalidation returned HTTP ${response.status}`)
  if (body.error) console.error(`Server message: ${body.error}`)
  if (body.failedPaths?.length) console.error(`Failed paths: ${body.failedPaths.join(', ')}`)
  process.exit(1)
}

console.log(
  `Revalidation complete: ${body.productCount ?? '?'} products + ${
    (body.paths?.length ?? 0) - (body.productCount ?? 0)
  } static routes purged.`
)
console.log('Revalidated paths:', (body.paths ?? []).join(', '))

const minProducts = Number(process.env.MIN_REVALIDATED_PRODUCTS ?? '0')
if (Number.isFinite(minProducts) && (body.productCount ?? 0) < minProducts) {
  console.error(
    `Error: expected at least ${minProducts} revalidated PDP(s), got ${body.productCount ?? 0}`
  )
  process.exit(1)
}

const sitemapRoutes = await getSitemapRoutes(baseUrl)
const revalidated = new Set(body.paths ?? [])
const blogLayoutRevalidated = revalidated.has('/blog (layout — includes all /blog/[slug])')
const missingSitemapRoutes = sitemapRoutes.filter((route) => {
  if (revalidated.has(route)) return false
  return !(blogLayoutRevalidated && route.startsWith('/blog/'))
})

if (missingSitemapRoutes.length > 0) {
  console.error(
    `Error: revalidation response did not cover sitemap route(s): ${missingSitemapRoutes.join(', ')}`
  )
  process.exit(1)
}

console.log(`Sitemap coverage verified: ${sitemapRoutes.length} public routes covered.`)

async function getSitemapRoutes(baseUrl) {
  const sitemapUrl = `${baseUrl}/sitemap.xml`
  let response
  try {
    response = await fetch(sitemapUrl, { redirect: 'follow' })
  } catch (err) {
    console.error(`Error: sitemap fetch failed — ${err.message}`)
    process.exit(1)
  }

  if (!response.ok) {
    console.error(`Error: sitemap fetch returned HTTP ${response.status}`)
    process.exit(1)
  }

  const xml = await response.text()
  const routes = new Set()
  for (const match of xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)) {
    try {
      routes.add(new URL(decodeXml(match[1].trim())).pathname)
    } catch {
      // Ignore malformed loc entries; the final low-coverage check will fail.
    }
  }

  if (routes.size <= 3) {
    console.error(
      `Error: sitemap-wide revalidation expected more than 3 routes, got ${routes.size}`
    )
    process.exit(1)
  }

  return [...routes].sort()
}

function decodeXml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}
