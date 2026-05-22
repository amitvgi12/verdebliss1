import { expect, test } from '@playwright/test'

const PRODUCT_SLUGS = [
  'bakuchiol-renewal-serum',
  'niacinamide-pore-serum',
  'botanical-spf-50-shield',
]

test.describe('live smoke checks', () => {
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

  test('homepage and PDP are served from the same current build', async ({ request }) => {
    const paths = ['/', '/products/green-tea-clarity-toner']
    const htmlByPath = new Map<string, string>()

    for (const path of paths) {
      const response = await request.get(path)
      expect(response.status()).toBe(200)
      htmlByPath.set(path, await response.text())
    }

    const rootSha = extractMetaContent(htmlByPath.get('/') ?? '', 'x-build-sha')
    const pdpSha = extractMetaContent(
      htmlByPath.get('/products/green-tea-clarity-toner') ?? '',
      'x-build-sha'
    )
    const expectedSha = process.env.EXPECTED_BUILD_SHA

    expect(rootSha).toBeTruthy()
    expect(pdpSha).toBe(rootSha)
    if (expectedSha) expect(rootSha).toBe(expectedSha)
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
    expect(html).toContain('Cruelty-Free')
    expect(html).toContain('Certifications')
    expect(html).toContain('aria-controls="accordion-ingredients"')
    expect(html).toContain('aria-expanded="true"')
    expect(html).not.toContain('beauty-without-bunnies')
    expect(html).not.toContain('Returns &amp; Refund')
    expect(html).not.toContain('Returns & Refund')
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

    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain('report-uri /api/csp-report')
    expect(headers['reporting-endpoints'] ?? headers['report-to']).toBeTruthy()
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
