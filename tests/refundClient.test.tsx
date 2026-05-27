import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import RefundClient from '@/app/refund/RefundClient'
import { useAuthStore } from '@/store/authStore'

const supabaseMocks = vi.hoisted(() => ({
  from: vi.fn(),
  getSession: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: supabaseMocks.from,
    auth: {
      getSession: supabaseMocks.getSession,
    },
  },
}))

describe('RefundClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      user: { id: 'user-1', email: 'kavya@example.com' } as never,
      profile: null,
      loading: false,
    })
    supabaseMocks.from.mockReturnValue(makeRefundHistoryBuilder())
    supabaseMocks.getSession.mockResolvedValue({
      data: { session: { access_token: 'token' } },
    })
  })

  it('submits the selected order ID with the refund reason', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      if (String(input) === '/api/refunds/request') {
        return Promise.resolve(jsonResponse({ ok: true }))
      }

      return Promise.resolve(
        jsonResponse({
          orders: [
            {
              id: 'order-1',
              status: 'Delivered',
              payment_status: 'paid',
              created_at: '2026-05-16T10:00:00.000Z',
              total: 895,
              items: [{ name: 'Niacinamide Pore Serum', qty: 1, price: 895 }],
            },
          ],
        })
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<RefundClient />)

    expect(await screen.findByText('Order #ORDER-1')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Refund reason'), {
      target: { value: 'The pump arrived broken and unusable.' },
    })
    fireEvent.click(screen.getByText('Submit Refund Request'))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/refunds/request',
        expect.objectContaining({
          body: JSON.stringify({
            orderId: 'order-1',
            reason: 'The pump arrived broken and unusable.',
          }),
        })
      )
    })
  })

  it('gives signed-out customers clear refund guidance', () => {
    useAuthStore.setState({
      user: null,
      profile: null,
      loading: false,
    })

    render(<RefundClient />)

    expect(screen.getByText('Sign in to request a refund')).toBeInTheDocument()
    expect(screen.getByText(/Refund requests are linked to verified orders/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/account')
    expect(screen.getByRole('link', { name: 'Return and Refund Policy' })).toHaveAttribute(
      'href',
      '/returns-refunds'
    )
  })

  it('explains what is happening while account state is loading', () => {
    useAuthStore.setState({
      user: null,
      profile: null,
      loading: true,
    })

    render(<RefundClient />)

    expect(screen.getByText('Checking your account')).toBeInTheDocument()
    expect(
      screen.getByText(/load refund history and eligible orders automatically/)
    ).toBeInTheDocument()
  })
})

function makeRefundHistoryBuilder() {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
  }
}

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}
