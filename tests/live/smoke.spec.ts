import { expect, test } from '@playwright/test'

const PRODUCT_SLUGS = [
  'bakuchiol-renewal-serum',
  'rose-hip-glow-moisturiser',
  'green-tea-clarity-toner',
  'turmeric-brightening-cleanser',
  'botanical-spf-50-shield',
  'wild-berry-lip-elixir',
  'niacinamide-pore-serum',
  'shea-butter-night-cream',
]

const CORE_ROUTES: Array<[string, string]> = [
  ['/', 'homepage'],
  ['/products', 'product catalogue'],
  ['/products/bakuchiol-renewal-serum', 'PDP'],
  ['/faq', 'FAQ'],
  ['/certifications', 'Trust Centre (certifications)'],
  ['/refund', 'refund'],
  ['/cookie-policy', 'cookie policy'],
  ['/blog', 'blog'],
  ['/sitemap.xml', 'sitemap'],
  ['/robots.txt', 'robots'],
]

test.describe('live smoke checks', () => {
  test.describe('core routes return 200', () => {
    for (const [path, label] of CORE_ROUTES) {
      test(label, async ({ request }) => {
        const response = await request.get(path)
        expect(response.status(), `${path} should return 200`).toBe(200)
      })
    }
  })

  test('main content appears before footer in live HTML', async ({ request }) => {
    const response = await request.get('/')
    expect(response.status()).toBe(200)
    const html = await response.text()
    const mainIndex = html.search(/<main[^>]+id=["']main-content["']/i)
    const footerIndex = html.search(/<footer\b/i)

    expect(mainIndex).toBeGreaterThanOrEqual(0)
    expect(footerIndex).toBeGreaterThanOrEqual(0)
    expect(mainIndex).toBeLessThan(footerIndex)
  })

  test('cookie-policy: policy content appears before footer', async ({ request }) => {
    const response = await request.get('/cookie-policy')
    expect(response.status()).toBe(200)
    const html = await response.text()

    // The LegalPage hero header renders inside <main id="main-content">.
    // If the footer or nav appears first, the deploy served stale/mixed output.
    const mainIndex = html.search(/<main[^>]+id=["']main-content["']/i)
    const footerIndex = html.search(/<footer\b/i)
    const legalHeroIndex = html.search(/legal-hero/i)

    expect(mainIndex, 'main-content landmark missing').toBeGreaterThanOrEqual(0)
    expect(footerIndex, 'footer missing').toBeGreaterThanOrEqual(0)
    expect(legalHeroIndex, 'legal-hero class (policy content) missing').toBeGreaterThanOrEqual(0)
    expect(mainIndex, 'main comes before footer').toBeLessThan(footerIndex)
    expect(legalHeroIndex, 'policy content comes before footer').toBeLessThan(footerIndex)
  })

  test('all product PDPs are served from the same current build as the homepage', async ({
    request,
  }) => {
    const paths = ['/', ...PRODUCT_SLUGS.map((s) => `/products/${s}`)]
    const shaByPath = new Map<string, string | null>()

    for (const path of paths) {
      const response = await request.get(path)
      expect(response.status()).toBe(200)
      shaByPath.set(path, response.headers()['x-build-sha'] ?? null)
    }

    const rootSha = shaByPath.get('/')
    const expectedSha = process.env.EXPECTED_BUILD_SHA

    expect(rootSha).toBeTruthy()
    if (expectedSha) expect(rootSha).toBe(expectedSha)

    for (const slug of PRODUCT_SLUGS) {
      const pdpSha = shaByPath.get(`/products/${slug}`)
      expect(pdpSha, `Build SHA mismatch on /products/${slug}`).toBe(rootSha)
    }
  })

  for (const slug of PRODUCT_SLUGS) {
    test(`product page returns 200: ${slug}`, async ({ request }) => {
      const response = await request.get(`/products/${slug}`)
      expect(response.status()).toBe(200)
      expect(response.headers()['content-type']).toContain('text/html')
    })
  }

  test('product schema validates on a PDP', async ({ request }) => {
    const slug = 'bakuchiol-renewal-serum'
    const pdpRes = await request.get(`/products/${slug}`)
    expect(pdpRes.status()).toBe(200)
    const html = await pdpRes.text()

    // Product schema is delivered INLINE in the PDP HTML (crawler-parseable).
    // The same schema is also exposed at /api/schema/product/[id] as a
    // machine-readable endpoint; prefer it here when present, else read inline.
    const apiRes = await request.get(`/api/schema/product/${slug}`)
    const product =
      apiRes.status() === 200 && apiRes.headers()['content-type']?.includes('ld+json')
        ? (flattenJsonLd(JSON.parse(await apiRes.text())).find((s) => s['@type'] === 'Product') ??
          null)
        : findJsonLd(html, (s) => s['@type'] === 'Product')

    expect(product, 'Product JSON-LD not found in PDP or schema API').toBeTruthy()
    expect(product?.name).toBe('Bakuchiol Renewal Serum')
    expect(product?.offers).toMatchObject({ '@type': 'Offer', priceCurrency: 'INR' })
  })

  // Q2: price parity — JSON-LD offer.price must match the visible price in HTML
  test('JSON-LD offer.price matches visible price in HTML across all PDPs', async ({ request }) => {
    const pricePattern = /₹([\d,]+)/g

    for (const slug of PRODUCT_SLUGS) {
      const [pdpRes, apiRes] = await Promise.all([
        request.get(`/products/${slug}`),
        request.get(`/api/schema/product/${slug}`),
      ])
      expect(pdpRes.status()).toBe(200)

      const html = await pdpRes.text()

      // Extract visible prices from rendered HTML (skip script tags)
      const htmlWithoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, '')
      expect(htmlWithoutScripts, `[/products/${slug}] PDP must never render ₹0`).not.toMatch(
        /₹\s*0\b/
      )
      const visiblePrices = new Set<number>()
      for (const m of htmlWithoutScripts.matchAll(pricePattern)) {
        visiblePrices.add(parseInt(m[1].replace(/,/g, ''), 10))
      }

      // Get schema price
      let schemaPrice: number | null = null
      if (apiRes.status() === 200 && apiRes.headers()['content-type']?.includes('ld+json')) {
        const schemas = flattenJsonLd(JSON.parse(await apiRes.text()))
        const product = schemas.find((s) => s['@type'] === 'Product')
        const offer = (schemas.find((s) => s['@type'] === 'Offer') ??
          (product?.offers as Record<string, unknown> | undefined)) as
          | Record<string, unknown>
          | undefined
        if (typeof offer?.price === 'number') {
          expect(
            offer.price,
            `[/api/schema/product/${slug}] Offer price must be positive`
          ).toBeGreaterThan(0)
          schemaPrice = offer.price
        }
      } else {
        const product = findJsonLd(html, (s) => s['@type'] === 'Product')
        const offer = product?.offers as Record<string, unknown> | undefined
        if (typeof offer?.price === 'number') {
          expect(offer.price, `[/products/${slug}] Offer price must be positive`).toBeGreaterThan(0)
          schemaPrice = offer.price
        }
      }

      if (schemaPrice !== null) {
        expect(
          visiblePrices.has(schemaPrice),
          `[/products/${slug}] JSON-LD price ₹${schemaPrice} not found in visible HTML prices: ${[...visiblePrices].join(', ')}`
        ).toBe(true)
      }
    }
  })

  // Q2: x-build-sha must be consistent across /, /products, and all PDPs
  test('x-build-sha is identical across home, catalogue, and all PDPs', async ({ request }) => {
    const routes = ['/', '/products', ...PRODUCT_SLUGS.map((s) => `/products/${s}`)]
    const shaByPath = new Map<string, string | null>()

    await Promise.all(
      routes.map(async (path) => {
        const res = await request.get(path)
        shaByPath.set(path, res.headers()['x-build-sha'] ?? null)
      })
    )

    const rootSha = shaByPath.get('/')
    const expectedSha = process.env.EXPECTED_BUILD_SHA
    expect(rootSha, 'x-build-sha missing on /').toBeTruthy()
    if (expectedSha) expect(rootSha).toBe(expectedSha)

    for (const path of routes.slice(1)) {
      expect(
        shaByPath.get(path),
        `x-build-sha mismatch on ${path} — possible stale ISR from a previous deploy`
      ).toBe(rootSha)
    }
  })

  test('PDP reflects current build freshness sentinels', async ({ request }) => {
    const response = await request.get('/products/green-tea-clarity-toner')
    expect(response.status()).toBe(200)
    const html = await response.text()

    expect(html).toContain('/images/products/toner.webp')
    expect(html).toContain('sizes="(max-width: 1024px) 90vw, 560px"')
    expect(html).toContain('/og/products/green-tea-clarity-toner.jpg')
    // Raw badge vocabulary must never reach the client: the nav search index is
    // trimmed (PRODUCT_SEARCH_INDEX) and product surfaces render only the
    // normalized labels from lib/product-claims.ts.
    expect(html).not.toContain('Cruelty-free*')
    expect(html).not.toContain('Vegan-Friendly')
    expect(html).toContain('Certifications')
    expect(html).toContain('aria-controls="accordion-ingredients"')
    expect(html).toContain('aria-expanded="true"')
    expect(html).not.toContain('beauty-without-bunnies')
    expect(html).not.toContain('Returns &amp; Refund')
    expect(html).not.toContain('Returns & Refund')
  })

  test('no seed review copy appears on any live PDP', async ({ request }) => {
    const seedPhrases = [
      'without making my skin feel tight',
      'My dry skin handled this serum well',
      'Lightweight but nourishing',
      'Comfortable mineral SPF',
    ]

    for (const slug of PRODUCT_SLUGS) {
      const response = await request.get(`/products/${slug}`)
      expect(response.status()).toBe(200)
      const html = await response.text()
      for (const phrase of seedPhrases) {
        expect(html, `Seed review phrase found on /products/${slug}: "${phrase}"`).not.toContain(
          phrase
        )
      }
    }
  })

  test('FAQ schema validates', async ({ request }) => {
    const response = await request.get('/faq')
    expect(response.status()).toBe(200)
    const faq = findJsonLd(await response.text(), (schema) => schema['@type'] === 'FAQPage')
    const mainEntity = faq?.mainEntity

    expect(faq).toBeTruthy()
    expect(Array.isArray(mainEntity)).toBe(true)
    expect(Array.isArray(mainEntity) ? mainEntity.length : 0).toBeGreaterThan(5)
    expect(Array.isArray(mainEntity) ? mainEntity[0] : null).toMatchObject({
      '@type': 'Question',
      acceptedAnswer: { '@type': 'Answer' },
    })
  })

  test('robots and sitemap are reachable', async ({ request }) => {
    const [robots, sitemap] = await Promise.all([
      request.get('/robots.txt'),
      request.get('/sitemap.xml'),
    ])

    expect(robots.status()).toBe(200)
    expect(await robots.text()).toContain('Sitemap:')
    expect(sitemap.status()).toBe(200)
    expect(await sitemap.text()).toContain('<urlset')
  })

  test('security headers are present', async ({ request }) => {
    const response = await request.get('/')
    const headers = response.headers()
    const csp = headers['content-security-policy'] ?? ''

    // CSP
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("base-uri 'self'")
    expect(csp).toContain('upgrade-insecure-requests')
    expect(csp).toContain('report-uri /api/csp-report')

    // Reporting infrastructure
    expect(headers['reporting-endpoints'] ?? headers['report-to']).toBeTruthy()
    expect(headers['nel']).toContain('csp-endpoint')

    // Standard defensive headers
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['strict-transport-security']).toContain('includeSubDomains')
    expect(headers['strict-transport-security']).toContain('preload')
    expect(headers['cross-origin-opener-policy']).toBe('same-origin')
    expect(headers['cross-origin-resource-policy']).toBe('same-site')
    expect(headers['x-permitted-cross-domain-policies']).toBe('none')
    expect(headers['x-dns-prefetch-control']).toBe('off')
    expect(headers['permissions-policy']).toContain('geolocation=()')
    expect(headers['permissions-policy']).toContain('microphone=()')
    expect(headers['permissions-policy']).toContain('camera=()')
  })
})

function findJsonLd(
  html: string,
  predicate: (schema: Record<string, unknown>) => boolean
): Record<string, unknown> | null {
  const scripts = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )

  for (const match of scripts) {
    try {
      const parsed = JSON.parse(match[1].trim())
      const found = flattenJsonLd(parsed).find(predicate)
      if (found) return found
    } catch {
      // Ignore malformed unrelated scripts; the assertions will fail if the
      // target schema is absent.
    }
  }

  return null
}

function flattenJsonLd(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.flatMap(flattenJsonLd)
  if (!value || typeof value !== 'object') return []

  const record = value as Record<string, unknown>
  const graph = Array.isArray(record['@graph']) ? flattenJsonLd(record['@graph']) : []
  return [record, ...graph]
}
