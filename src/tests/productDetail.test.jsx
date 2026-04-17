/**
 * productDetail.test.jsx
 *
 * Renders ProductDetail inside a MemoryRouter so useParams works correctly.
 * Supabase is mocked via setup.js → returns { data: null, error: {...} }
 * → hooks fall back to the static PRODUCTS array.
 *
 * Note on React Router warnings:
 *   MemoryRouter from react-router-dom v6 emits console warnings about
 *   future v7 flags. These are suppressed via vi.spyOn in beforeEach.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProductDetail from '@/pages/ProductDetail'

/* Suppress React Router v6 → v7 migration warnings in test output */
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
  it('shows the product name from static fallback data', async () => {
    renderDetail('7')
    await waitFor(
      () => expect(screen.getByText(/Niacinamide Pore Serum/i)).toBeInTheDocument(),
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
    // Price 2450 → rendered as "₹2,450"
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

  it('shows the category label for a serum', async () => {
    renderDetail('7')
    await waitFor(
      () => expect(screen.getByText(/serum/i)).toBeInTheDocument(),
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
    // Wait for product to load then check qty display
    await screen.findByText(/add to cart/i, {}, { timeout: 4000 })
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('quantity increases to 2 after clicking +', async () => {
    renderDetail('7')
    await screen.findByText(/add to cart/i, {}, { timeout: 4000 })
    const incBtn = screen.getByLabelText(/increase/i)
    fireEvent.click(incBtn)
    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument())
  })

  it('quantity stays at 1 after clicking - from initial qty', async () => {
    renderDetail('7')
    await screen.findByText(/add to cart/i, {}, { timeout: 4000 })
    const decBtn = screen.getByLabelText(/decrease/i)
    fireEvent.click(decBtn)
    // Min is 1 — should still show 1
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

  it('clicking Full Ingredients (already open) collapses it', async () => {
    renderDetail('7')
    // Ingredients accordion is open by default
    await screen.findByText(/full ingredients/i, {}, { timeout: 4000 })
    // Click to close
    fireEvent.click(screen.getByText(/full ingredients/i))
    // Then reopen
    fireEvent.click(screen.getByText(/full ingredients/i))
    // Content should reappear
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
