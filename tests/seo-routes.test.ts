import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import sitemap from '@/app/sitemap'

vi.mock('@/lib/products-server', () => ({
  getProductsServer: () =>
    Promise.resolve([
      {
        id: '1',
        slug: 'bakuchiol-renewal-serum',
        created_at: '2026-04-01T00:00:00.000Z',
      },
    ]),
}))

describe('SEO route outputs', () => {
  it('keeps private and API surfaces out of robots and sitemap', async () => {
    const robots = readFileSync(join(process.cwd(), 'public/robots.txt'), 'utf8')

    expect(robots).toContain('Disallow: /account')
    expect(robots).toContain('Disallow: /checkout')
    expect(robots).toContain('Disallow: /api/')
    expect(robots).toContain('Sitemap: https://www.verdebliss.com/sitemap.xml')

    const urls = (await sitemap()).map((entry) => entry.url)
    expect(urls).not.toContain('https://www.verdebliss.com/account')
    expect(urls).not.toContain('https://www.verdebliss.com/checkout')
    expect(urls.every((url) => !url.includes('/api/'))).toBe(true)
  })
})
