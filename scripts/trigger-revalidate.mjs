/* global process, console, fetch */
/**
 * Post-deploy revalidation trigger.
 *
 * Calls POST /api/revalidate to purge the ISR cache for every product page,
 * the homepage, /products catalogue, /blog, /faq, /certifications, and
 * /cookie-policy.  Exits non-zero on any failure so the deploy pipeline is
 * blocked until the purge succeeds.
 *
 * Usage:
 *   REVALIDATE_SECRET=<secret> DEPLOY_URL=https://verdebliss.com node scripts/trigger-revalidate.mjs
 *
 * Environment variables:
 *   DEPLOY_URL        — base URL of the deployment to revalidate (required)
 *   REVALIDATE_SECRET — must match the server-side REVALIDATE_SECRET (required)
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
