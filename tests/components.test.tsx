import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Stars from '@/components/ui/Stars'
import Badge from '@/components/ui/Badge'
import ProductImage from '@/components/ui/ProductImage'
import ProductPurchaseActions from '@/app/products/[id]/_components/ProductPurchaseActions'

describe('Stars component', () => {
  it('renders exactly 5 star SVGs', () => {
    const { container } = render(<Stars rating={4.8} />)
    const stars = container.querySelectorAll('svg')
    expect(stars).toHaveLength(5)
  })

  it('renders with a custom size prop', () => {
    const { container } = render(<Stars rating={3} size={20} />)
    const first = container.querySelector('svg')
    expect(first?.getAttribute('width')).toBe('20')
    expect(first?.getAttribute('height')).toBe('20')
  })

  it('renders without crashing for rating 0', () => {
    expect(() => render(<Stars rating={0} />)).not.toThrow()
  })

  it('renders without crashing for rating 5', () => {
    expect(() => render(<Stars rating={5} />)).not.toThrow()
  })
})

describe('Badge component', () => {
  it('renders the label text in uppercase', () => {
    render(<Badge label="Vegan" />)
    expect(screen.getByText('VEGAN-FRIENDLY · EVIDENCE REVIEW')).toBeInTheDocument()
  })

  it('renders cruelty-free as positioning copy', () => {
    render(<Badge label="Cruelty-Free" />)
    expect(screen.getByText('NO ANIMAL TESTING · AUDIT UNDERWAY')).toBeInTheDocument()
  })

  it('renders organic certification claims as botanical positioning', () => {
    render(<Badge label="Organic Certified" />)
    expect(screen.getByText('ORGANIC BOTANICALS · EVIDENCE REVIEW')).toBeInTheDocument()
  })

  it('renders an unknown label without crashing', () => {
    expect(() => render(<Badge label="New Badge" />)).not.toThrow()
  })
})

describe('ProductImage component', () => {
  const baseProduct = {
    id: '7',
    name: 'Niacinamide Pore Serum',
    price: 895,
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
    expect(
      screen.getByAltText('Niacinamide Pore Serum — Niacinamide botanical formula')
    ).toBeInTheDocument()
  })

  it('falls back to serum.webp for unknown ingredient', () => {
    const p = { ...baseProduct, ingredient: 'Unknown', name: 'Unknown Product' }
    const { container } = render(<ProductImage product={p} />)
    const img = container.querySelector('img')
    expect(img?.getAttribute('src') ?? '').toMatch(/serum\.webp/)
  })

  it('uses image_url from Supabase when provided', () => {
    const p = { ...baseProduct, image_url: '/images/products/custom.webp' }
    const { container } = render(<ProductImage product={p} />)
    const img = container.querySelector('img')
    expect(img?.getAttribute('src') ?? '').toMatch(/custom\.webp/)
  })

  it('renders ingredient-matched image for Turmeric', () => {
    const p = { ...baseProduct, ingredient: 'Turmeric', name: 'Cleanser' }
    const { container } = render(<ProductImage product={p} />)
    const img = container.querySelector('img')
    expect(img?.getAttribute('src') ?? '').toMatch(/cleanser\.webp/)
  })

  it('uses the same neutral background for every ingredient (no candy colors)', () => {
    const ingredients = [
      'Bakuchiol',
      'Rose Hip',
      'Green Tea',
      'Turmeric',
      'Zinc Oxide',
      'Shea Butter',
      'Niacinamide',
    ]
    const backgrounds = ingredients.map((ingredient) => {
      const { container } = render(
        <ProductImage product={{ name: 'Test', ingredient }} />
      )
      return (container.firstChild as HTMLElement).style.background
    })
    expect(new Set(backgrounds).size, 'all ingredients must share one background').toBe(1)
  })

  it('does not use the old pink gradient for Rose Hip', () => {
    const { container } = render(
      <ProductImage product={{ name: 'Rose Hip Oil', ingredient: 'Rose Hip' }} />
    )
    const bg = (container.firstChild as HTMLElement).style.background
    expect(bg).not.toMatch(/#f7c5d3|#fce8ee|pink/i)
  })

  it('does not use the old blue gradient for Zinc Oxide', () => {
    const { container } = render(
      <ProductImage
        product={{ name: 'Mineral SPF', ingredient: 'Zinc Oxide' }}
      />
    )
    const bg = (container.firstChild as HTMLElement).style.background
    expect(bg).not.toMatch(/#90caf9|#e3f2fd/i)
  })
})

describe('ProductPurchaseActions', () => {
  const base = {
    productName: 'Bakuchiol Serum',
    cartQty: null as number | null,
    maxQty: 5,
    stockOut: false,
    added: false,
    isWishlisted: false,
    onAdd: vi.fn(),
    onGoToCart: vi.fn(),
    onDecreaseCartQty: vi.fn(),
    onIncreaseCartQty: vi.fn(),
    onWishlist: vi.fn(),
  }

  it('shows "Add to ritual" when the item is not in the cart', () => {
    render(<ProductPurchaseActions {...base} />)
    expect(screen.getByText('Add to ritual')).toBeInTheDocument()
  })

  it('shows "View ritual" when the item is already in the cart', () => {
    render(<ProductPurchaseActions {...base} cartQty={2} />)
    expect(screen.getByText('View ritual')).toBeInTheDocument()
  })

  it('shows "Sold out" when stock is empty', () => {
    render(<ProductPurchaseActions {...base} stockOut />)
    expect(screen.getByText('Sold out')).toBeInTheDocument()
  })

  it('does not show "Add to ritual" when item is in the cart', () => {
    render(<ProductPurchaseActions {...base} cartQty={1} />)
    expect(screen.queryByText('Add to ritual')).not.toBeInTheDocument()
  })

  it('shows quantity stepper when item is in the cart', () => {
    render(<ProductPurchaseActions {...base} cartQty={2} />)
    expect(
      screen.getByLabelText('Bakuchiol Serum quantity in cart')
    ).toBeInTheDocument()
  })

  it('does not show quantity stepper when item is not in the cart', () => {
    render(<ProductPurchaseActions {...base} />)
    expect(
      screen.queryByLabelText('Bakuchiol Serum quantity in cart')
    ).not.toBeInTheDocument()
  })

  it('calls onAdd when "Add to ritual" is clicked', async () => {
    const onAdd = vi.fn()
    render(<ProductPurchaseActions {...base} onAdd={onAdd} />)
    screen.getByText('Add to ritual').closest('button')?.click()
    expect(onAdd).toHaveBeenCalledTimes(1)
  })

  it('calls onGoToCart when "View ritual" is clicked', async () => {
    const onGoToCart = vi.fn()
    render(<ProductPurchaseActions {...base} cartQty={1} onGoToCart={onGoToCart} />)
    screen.getByText('View ritual').closest('button')?.click()
    expect(onGoToCart).toHaveBeenCalledTimes(1)
  })
})
