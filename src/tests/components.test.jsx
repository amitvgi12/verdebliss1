/**
 * components.test.jsx
 * Renders Stars, Badge, and ProductImage in jsdom
 * and asserts key DOM properties.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Stars        from '@/components/ui/Stars'
import Badge        from '@/components/ui/Badge'
import ProductImage from '@/components/ui/ProductImage'

/* ── Stars ──────────────────────────────────────── */
describe('Stars component', () => {
  it('renders exactly 5 star SVGs', () => {
    const { container } = render(<Stars rating={4.8} />)
    const stars = container.querySelectorAll('svg')
    expect(stars).toHaveLength(5)
  })

  it('renders with a custom size prop', () => {
    const { container } = render(<Stars rating={3} size={20} />)
    const first = container.querySelector('svg')
    expect(first.getAttribute('width')).toBe('20')
    expect(first.getAttribute('height')).toBe('20')
  })

  it('renders without crashing for rating 0', () => {
    expect(() => render(<Stars rating={0} />)).not.toThrow()
  })

  it('renders without crashing for rating 5', () => {
    expect(() => render(<Stars rating={5} />)).not.toThrow()
  })
})

/* ── Badge ───────────────────────────────────────── */
describe('Badge component', () => {
  it('renders the label text in uppercase', () => {
    render(<Badge label="Vegan" />)
    expect(screen.getByText('VEGAN')).toBeInTheDocument()
  })

  it('renders Cruelty-Free badge', () => {
    render(<Badge label="Cruelty-Free" />)
    expect(screen.getByText('CRUELTY-FREE')).toBeInTheDocument()
  })

  it('renders Organic Certified badge', () => {
    render(<Badge label="Organic Certified" />)
    expect(screen.getByText('ORGANIC CERTIFIED')).toBeInTheDocument()
  })

  it('renders an unknown label without crashing', () => {
    expect(() => render(<Badge label="New Badge" />)).not.toThrow()
  })
})

/* ── ProductImage ────────────────────────────────── */
describe('ProductImage component', () => {
  const baseProduct = {
    id: '7',
    name: 'Niacinamide Pore Serum',
    ingredient: 'Niacinamide',
    image_url: null,
  }

  it('renders an img element', () => {
    const { container } = render(<ProductImage product={baseProduct} />)
    const img = container.querySelector('img')
    expect(img).toBeInTheDocument()
  })

  it('img has correct alt text', () => {
    render(<ProductImage product={baseProduct} />)
    expect(screen.getByAltText('Niacinamide Pore Serum')).toBeInTheDocument()
  })

  it('falls back to serum.png for unknown ingredient', () => {
    const p = { ...baseProduct, ingredient: 'Unknown', name: 'Unknown Product' }
    const { container } = render(<ProductImage product={p} />)
    const img = container.querySelector('img')
    expect(img.src).toContain('serum.png')
  })

  it('uses image_url from Supabase when provided', () => {
    const p = { ...baseProduct, image_url: '/images/products/custom.png' }
    const { container } = render(<ProductImage product={p} />)
    const img = container.querySelector('img')
    expect(img.src).toContain('custom.png')
  })

  it('renders ingredient-matched image for Turmeric', () => {
    const p = { ...baseProduct, ingredient: 'Turmeric', name: 'Cleanser' }
    const { container } = render(<ProductImage product={p} />)
    const img = container.querySelector('img')
    expect(img.src).toContain('cleanser.png')
  })

  it('renders without crashing for a product with no ingredient', () => {
    const p = { id: '99', name: 'Mystery', ingredient: null }
    expect(() => render(<ProductImage product={p} />)).not.toThrow()
  })
})
