/**
 * productDetail.test.jsx
 * Integration test for the ProductDetail page.
 * Supabase is mocked in setup.js → falls back to static PRODUCTS data.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProductDetail from '@/pages/ProductDetail'

// Wrap with router so useParams / useNavigate work
function renderProductDetail(id = '7') {
  return render(
    <MemoryRouter initialEntries={[`/products/${id}`]}>
      <Routes>
        <Route path="/products/:id" element={<ProductDetail />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProductDetail — rendering', () => {
  it('shows the product name from static data', async () => {
    renderProductDetail('7')
    // Supabase mock returns null → falls back to PRODUCTS[6] (id:'7')
    await waitFor(() => {
      expect(screen.getByText(/Niacinamide Pore Serum/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('shows the Back to Products button', async () => {
    renderProductDetail('7')
    await waitFor(() =>
      expect(screen.getByText(/Back to Products/i)).toBeInTheDocument()
    )
  })

  it('shows Add to Cart button', async () => {
    renderProductDetail('7')
    await waitFor(() =>
      expect(screen.getByText(/Add to Cart/i)).toBeInTheDocument()
    )
  })

  it('shows the price in rupees', async () => {
    renderProductDetail('7')
    await waitFor(() =>
      expect(screen.getByText(/₹2,450/)).toBeInTheDocument()
    )
  })

  it('shows loyalty points line', async () => {
    renderProductDetail('7')
    await waitFor(() =>
      expect(screen.getByText(/loyalty points/i)).toBeInTheDocument()
    )
  })

  it('shows category label', async () => {
    renderProductDetail('7')
    await waitFor(() =>
      expect(screen.getByText(/SERUM/i)).toBeInTheDocument()
    )
  })
})

describe('ProductDetail — interactions', () => {
  it('Add to Cart button changes to "Added to Cart" on click', async () => {
    renderProductDetail('7')
    await waitFor(() => screen.getByText(/Add to Cart/i))
    fireEvent.click(screen.getByText(/Add to Cart/i))
    await waitFor(() =>
      expect(screen.getByText(/Added to Cart/i)).toBeInTheDocument()
    )
  })

  it('quantity decreases to minimum 1 only', async () => {
    renderProductDetail('7')
    await waitFor(() => screen.getByLabelText(/decrease/i))
    const dec = screen.getByLabelText(/decrease/i)
    // Click decrease twice from default qty=1 → should stay at 1
    fireEvent.click(dec)
    fireEvent.click(dec)
    const qty = screen.getByText('1')
    expect(qty).toBeInTheDocument()
  })

  it('quantity increases on + click', async () => {
    renderProductDetail('7')
    await waitFor(() => screen.getByLabelText(/increase/i))
    fireEvent.click(screen.getByLabelText(/increase/i))
    await waitFor(() =>
      expect(screen.getByText('2')).toBeInTheDocument()
    )
  })

  it('accordion opens "How To Use" section on click', async () => {
    renderProductDetail('7')
    await waitFor(() => screen.getByText(/How To Use/i))
    fireEvent.click(screen.getByText(/How To Use/i))
    await waitFor(() =>
      expect(screen.getByText(/Cleanse and gently tone/i)).toBeInTheDocument()
    )
  })

  it('shows 404 state for non-existent product', async () => {
    renderProductDetail('999')
    await waitFor(() =>
      expect(screen.getByText(/Product not found/i)).toBeInTheDocument()
    , { timeout: 3000 })
  })
})
