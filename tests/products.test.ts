/**
 * products.test.ts
 * Tests the static product catalogue, image mapping, and
 * category/skin-type constants. All assertions are strict-mode safe.
 */
import { describe, it, expect } from 'vitest'
import { PRODUCTS, CATEGORIES, SKIN_TYPES, SORT_OPTIONS, TIERS } from '@/constants/products'
import { applyApprovedReviewMetrics } from '@/lib/products-server'
import { breadcrumbJsonLd } from '@/lib/seo'

describe('PRODUCTS catalogue', () => {
  it('has 8 products', () => {
    expect(PRODUCTS).toHaveLength(8)
  })

  it('every product has required fields', () => {
    PRODUCTS.forEach((p) => {
      expect(p.id, `${p.name} missing id`).toBeTruthy()
      expect(p.name, `${p.name} missing name`).toBeTruthy()
      expect(Number.isFinite(p.price), `${p.name} missing price shell`).toBe(true)
      expect(p.category, `${p.name} missing category`).toBeTruthy()
      expect(p.ingredient, `${p.name} missing ingredient`).toBeTruthy()
      expect(p.skin_types, `${p.name} missing skin_types`).toBeInstanceOf(Array)
      expect(p.badges, `${p.name} missing badges`).toBeInstanceOf(Array)
      expect(p.description, `${p.name} missing description`).toBeTruthy()
    })
  })

  it('rating is between 0 and 5 for all products', () => {
    PRODUCTS.forEach((p) => {
      expect(p.rating ?? 0).toBeGreaterThanOrEqual(0)
      expect(p.rating ?? 0).toBeLessThanOrEqual(5)
    })
  })

  it('review_count is a non-negative integer', () => {
    PRODUCTS.forEach((p) => {
      expect(p.review_count ?? 0).toBeGreaterThanOrEqual(0)
      expect(Number.isInteger(p.review_count ?? 0)).toBe(true)
    })
  })

  it('all product IDs are unique strings', () => {
    const ids = PRODUCTS.map((p) => p.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('Niacinamide Pore Serum is in the Serum category', () => {
    const product = PRODUCTS.find((p) => p.name.includes('Niacinamide'))
    expect(product).toBeDefined()
    expect(product?.category).toBe('Serum')
  })

  it('all products have review_count of 0 in the static route shell', () => {
    PRODUCTS.forEach((p) => {
      expect(p.review_count ?? 0).toBe(0)
    })
  })

  it('does not carry storefront prices in the static route shell', () => {
    PRODUCTS.forEach((p) => {
      expect(p.price, `${p.name} price should come from DB`).toBe(0)
    })
  })

  it('uses Trust Centre-safe positioning badges in the fallback constants', () => {
    const hardClaims = ['Vegan', 'Organic Certified', 'Certified Organic', 'Cruelty-Free']
    PRODUCTS.forEach((p) => {
      expect(p.badges ?? []).not.toEqual(expect.arrayContaining(hardClaims))
    })
  })
})

describe('CATEGORIES', () => {
  it('includes "All" as the first item', () => {
    expect(CATEGORIES[0]).toBe('All')
  })

  it('includes all expected categories', () => {
    const expected = ['Serum', 'Moisturiser', 'Toner', 'Cleanser', 'SPF', 'Lip Care']
    expected.forEach((c) => expect(CATEGORIES).toContain(c))
  })
})

describe('SKIN_TYPES', () => {
  it('includes "All" as the first item', () => {
    expect(SKIN_TYPES[0]).toBe('All')
  })

  it('contains the four standard skin types', () => {
    expect(SKIN_TYPES).toContain('Dry')
    expect(SKIN_TYPES).toContain('Oily')
    expect(SKIN_TYPES).toContain('Combination')
    expect(SKIN_TYPES).toContain('Sensitive')
  })
})

describe('SORT_OPTIONS', () => {
  it('has at least 3 sort options', () => {
    expect(SORT_OPTIONS.length).toBeGreaterThanOrEqual(3)
  })

  it('includes Bestselling option', () => {
    expect(SORT_OPTIONS).toContain('Bestselling')
  })
})

describe('TIERS', () => {
  it('has 3 loyalty tiers', () => {
    expect(TIERS).toHaveLength(3)
  })

  it('tiers are ordered by ascending min points', () => {
    for (let i = 1; i < TIERS.length; i++) {
      const prev = TIERS[i - 1]
      const curr = TIERS[i]
      if (!prev || !curr) throw new Error('Tier missing')
      expect(curr.min).toBeGreaterThan(prev.min)
    }
  })

  it('the top tier has max: Infinity', () => {
    const top = TIERS[TIERS.length - 1]
    expect(top?.max).toBe(Infinity)
  })

  it('each tier has name, color, and emoji', () => {
    TIERS.forEach((t) => {
      expect(t.name).toBeTruthy()
      expect(t.color).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(t.emoji).toBeTruthy()
    })
  })
})

describe('server product filtering', () => {
  it('filters catalogue by category for server-rendered /products page', async () => {
    const { filterAndSortProducts } = await import('@/app/products/page')
    const serums = filterAndSortProducts(PRODUCTS, {
      category: 'Serum',
      skinType: 'All',
      sortBy: 'Bestselling',
    })
    expect(serums.length).toBeGreaterThan(0)
    expect(serums.every((p) => p.category === 'Serum')).toBe(true)
  })

  it('sorts server-rendered products from low to high price', async () => {
    const { filterAndSortProducts } = await import('@/app/products/page')
    const sorted = filterAndSortProducts(PRODUCTS, {
      category: 'All',
      skinType: 'All',
      sortBy: 'Price Low→High',
    })
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i]?.price ?? 0).toBeGreaterThanOrEqual(sorted[i - 1]?.price ?? 0)
    }
  })

  it('sorts server-rendered products from high to low price', async () => {
    const { filterAndSortProducts } = await import('@/app/products/page')
    const sorted = filterAndSortProducts(PRODUCTS, {
      category: 'All',
      skinType: 'All',
      sortBy: 'Price High→Low',
    })
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i]?.price ?? 0).toBeLessThanOrEqual(sorted[i - 1]?.price ?? 0)
    }
  })

  it('sorts server-rendered products by top rating', async () => {
    const { filterAndSortProducts } = await import('@/app/products/page')
    const sorted = filterAndSortProducts(PRODUCTS, {
      category: 'All',
      skinType: 'All',
      sortBy: 'Top Rated',
    })
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i]?.rating ?? 0).toBeLessThanOrEqual(sorted[i - 1]?.rating ?? 0)
    }
  })

  it('filters server-rendered products by search query', async () => {
    const { filterAndSortProducts } = await import('@/app/products/page')
    const results = filterAndSortProducts(PRODUCTS, {
      category: 'All',
      skinType: 'All',
      sortBy: 'Bestselling',
      query: 'niacinamide',
    })

    expect(results).toHaveLength(1)
    expect(results[0]?.name).toBe('Niacinamide Pore Serum')
  })
})

describe('approved review metrics', () => {
  it('replaces stale product-card counters with approved review aggregates', () => {
    const products = [
      { ...PRODUCTS[0], rating: 4.8, review_count: 215 },
      { ...PRODUCTS[1], rating: 4.7, review_count: 142 },
    ]

    const metrics = applyApprovedReviewMetrics(products, [
      { product_id: '1', rating: 5 },
      { product_id: '1', rating: 4 },
    ])

    expect(metrics[0]).toMatchObject({ rating: 4.5, review_count: 2 })
    expect(metrics[1]).toMatchObject({ rating: null, review_count: 0 })
  })
})

describe('product breadcrumb schema', () => {
  it('builds canonical PDP breadcrumbs for search engines', () => {
    expect(
      breadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Shop', path: '/products' },
        { name: 'Bakuchiol Renewal Serum', path: '/products/bakuchiol-renewal-serum' },
      ])
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://www.verdebliss.com/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Shop',
          item: 'https://www.verdebliss.com/products',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Bakuchiol Renewal Serum',
          item: 'https://www.verdebliss.com/products/bakuchiol-renewal-serum',
        },
      ],
    })
  })
})
