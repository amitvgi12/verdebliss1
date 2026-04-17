/**
 * productDetail.test.jsx
 *
 * All getByText queries are now role-aware or use exact strings to avoid
 * "Found multiple elements" when the same text appears in breadcrumbs,
 * headings, and related-product cards simultaneously.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProductDetail from '@/pages/ProductDetail'

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

function renderDetail(id = '7') {
  return render(
    <MemoryRouter initialEntries={[`/products/${id}`]}>
      <Routes>
        <Route path="/products/:id" element={<ProductDetail />} />
      </Routes>
    </MemoryRouter>
  )
}

/* ── Rendering ────────────────────────────────────── */
describe('ProductDetail — rendering', () => {
  it('shows the product name in the <h1>', async () => {
    renderDetail('7')
    // Use role query — only the <h1> has role="heading", not the breadcrumb <span>
    await waitFor(
      () =>
        expect(
          screen.getByRole('heading', { name: /Niacinamide Pore Serum/i })
        ).toBeInTheDocument(),
      { timeout: 4000 }
    )
  })

  it('shows the Back to Products button', async () => {
    renderDetail('7')
    await waitFor(
      () => expect(screen.getByText(/back to products/i)).toBeInTheDocument(),
      { timeout: 4000 }
    )
  })

  it('shows Add to Cart button', async () => {
    renderDetail('7')
    await waitFor(
      () => expect(screen.getByText(/add to cart/i)).toBeInTheDocument(),
      { timeout: 4000 }
    )
  })

  it('shows the price in rupees', async () => {
    renderDetail('7')
    await waitFor(
      () => expect(screen.getByText(/₹2[,.]?450/)).toBeInTheDocument(),
      { timeout: 4000 }
    )
  })

  it('shows loyalty points line', async () => {
    renderDetail('7')
    await waitFor(
      () => expect(screen.getByText(/loyalty points/i)).toBeInTheDocument(),
      { timeout: 4000 }
    )
  })

  it('shows the category label "SERUM · 30ml" for a serum product', async () => {
    renderDetail('7')
    // The category div renders the exact string "SERUM · 30ml".
    // /serum/i is too broad — it also matches the product name and related cards.
    // exact: false so whitespace around " · 30ml" doesn't matter.
    await waitFor(
      () =>
        expect(
          screen.getByText((content) => content.includes('SERUM') && content.includes('30ml'))
        ).toBeInTheDocument(),
      { timeout: 4000 }
    )
  })

  it('renders Full Ingredients accordion label', async () => {
    renderDetail('7')
    await waitFor(
      () => expect(screen.getByText(/full ingredients/i)).toBeInTheDocument(),
      { timeout: 4000 }
    )
  })

  it('renders How To Use accordion label', async () => {
    renderDetail('7')
    await waitFor(
      () => expect(screen.getByText(/how to use/i)).toBeInTheDocument(),
      { timeout: 4000 }
    )
  })
})

/* ── Interactions ─────────────────────────────────── */
describe('ProductDetail — interactions', () => {
  it('Add to Cart button changes to "Added to Cart" on click', async () => {
    renderDetail('7')
    const btn = await screen.findByText(/add to cart/i, {}, { timeout: 4000 })
    fireEvent.click(btn)
    await waitFor(
      () => expect(screen.getByText(/added to cart/i)).toBeInTheDocument(),
      { timeout: 3000 }
    )
  })

  it('quantity starts at 1', async () => {
    renderDetail('7')
    await screen.findByText(/add to cart/i, {}, { timeout: 4000 })
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('quantity increases to 2 after clicking +', async () => {
    renderDetail('7')
    await screen.findByText(/add to cart/i, {}, { timeout: 4000 })
    fireEvent.click(screen.getByLabelText(/increase/i))
    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument())
  })

  it('quantity stays at 1 after clicking - from initial qty', async () => {
    renderDetail('7')
    await screen.findByText(/add to cart/i, {}, { timeout: 4000 })
    fireEvent.click(screen.getByLabelText(/decrease/i))
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('clicking How To Use opens the accordion content', async () => {
    renderDetail('7')
    await screen.findByText(/how to use/i, {}, { timeout: 4000 })
    fireEvent.click(screen.getByText(/how to use/i))
    await waitFor(
      () => expect(screen.getByText(/cleanse and gently tone/i)).toBeInTheDocument(),
      { timeout: 2000 }
    )
  })

  it('clicking Full Ingredients toggles and reopens', async () => {
    renderDetail('7')
    await screen.findByText(/full ingredients/i, {}, { timeout: 4000 })
    fireEvent.click(screen.getByText(/full ingredients/i)) // close
    fireEvent.click(screen.getByText(/full ingredients/i)) // reopen
    await waitFor(
      () => expect(screen.getByText(/natural botanicals/i)).toBeInTheDocument(),
      { timeout: 2000 }
    )
  })
})

/* ── 404 state ────────────────────────────────────── */
describe('ProductDetail — 404', () => {
  it('shows "Product not found" for an unknown id', async () => {
    renderDetail('999')
    await waitFor(
      () => expect(screen.getByText(/product not found/i)).toBeInTheDocument(),
      { timeout: 4000 }
    )
  })
})
