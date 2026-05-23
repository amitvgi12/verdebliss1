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
    const htmlByPath = new Map<string, string>()

    for (const path of paths) {
      const response = await request.get(path)
      expect(response.status()).toBe(200)
      htmlByPath.set(path, await response.text())
    }

    const rootSha = extractMetaContent(htmlByPath.get('/') ?? '', 'x-build-sha')
    const expectedSha = process.env.EXPECTED_BUILD_SHA

    expect(rootSha).toBeTruthy()
    if (expectedSha) expect(rootSha).toBe(expectedSha)

    for (const slug of PRODUCT_SLUGS) {
      const pdpSha = extractMetaContent(htmlByPath.get(`/products/${slug}`) ?? '', 'x-build-sha')
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
    const response = await request.get('/products/bakuchiol-renewal-serum')
    expect(response.status()).toBe(200)
    const product = findJsonLd(await response.text(), (schema) => schema['@type'] === 'Product')

    expect(product).toBeTruthy()
    expect(product?.name).toBe('Bakuchiol Renewal Serum')
    expect(product?.offers).toMatchObject({ '@type': 'Offer', priceCurrency: 'INR' })
  })

  test('PDP reflects current build freshness sentinels', async ({ request }) => {
    const response = await request.get('/products/green-tea-clarity-toner')
    expect(response.status()).toBe(200)
    const html = await response.text()

    expect(html).toContain('/images/products/toner.webp')
    expect(html).toContain('sizes="(max-width: 1024px) 90vw, 560px"')
    expect(html).toContain('/og/products/green-tea-clarity-toner.jpg')
    expect(html).toContain('Cruelty-free*')
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

function extractMetaContent(html: string, name: string): string | null {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const meta = html.match(
    new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i')
  )
  return meta?.[1] ?? null
}

function flattenJsonLd(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.flatMap(flattenJsonLd)
  if (!value || typeof value !== 'object') return []

  const record = value as Record<string, unknown>
  const graph = Array.isArray(record['@graph']) ? flattenJsonLd(record['@graph']) : []
  return [record, ...graph]
}
