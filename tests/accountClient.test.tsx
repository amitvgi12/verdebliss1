import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import AccountClient from '@/app/account/AccountClient'
import { useAuthStore } from '@/store/authStore'

// Override the global setup mock so we can inject order data per-test
const supabaseMocks = vi.hoisted(() => ({ from: vi.fn() }))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: supabaseMocks.from,
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
      updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  },
}))

describe('AccountClient', () => {
  const signIn = vi.fn()
  const signUp = vi.fn()
  const resetPassword = vi.fn()
  const updatePassword = vi.fn()
  const signInWithGoogle = vi.fn()
  const signOut = vi.fn()
  const refreshProfile = vi.fn()
  const fetchProfile = vi.fn()
  const init = vi.fn()
  const clearRecoveryMode = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Default: orders query resolves with no data (empty list)
    supabaseMocks.from.mockReturnValue(makeOrdersBuilder([]))
    signIn.mockResolvedValue({})
    signUp.mockResolvedValue({})
    resetPassword.mockResolvedValue({})
    updatePassword.mockResolvedValue({})
    signInWithGoogle.mockResolvedValue(undefined)
    signOut.mockResolvedValue(undefined)
    refreshProfile.mockResolvedValue(undefined)
    fetchProfile.mockResolvedValue(undefined)
    init.mockResolvedValue(undefined)

    useAuthStore.setState({
      user: null,
      profile: null,
      loading: false,
      initializationError: null,
      recoveryMode: false,
      init,
      fetchProfile,
      signIn,
      signUp,
      resetPassword,
      updatePassword,
      clearRecoveryMode,
      signInWithGoogle,
      signOut,
      refreshProfile,
    })
  })

  it('renders the signed-out account shell with visible labels', () => {
    render(<AccountClient />)

    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email address')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Forgot your password?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign up free' })).toBeInTheDocument()
  })

  it('renders the server-friendly signed-out shell while auth is loading', () => {
    useAuthStore.setState({ loading: true })

    render(<AccountClient />)

    expect(screen.getByText('Checking your account status...')).toBeInTheDocument()
    expect(screen.getByLabelText('Email address')).toBeDisabled()
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })

  it('renders the signed-in dashboard when a user is present', () => {
    useAuthStore.setState({
      user: { id: 'user-1', email: 'kavya@example.com' } as never,
      profile: {
        id: 'user-1',
        full_name: 'Kavya Menon',
        skin_type: 'Sensitive',
        tier: 'gold botanist',
      },
    })

    render(<AccountClient />)

    expect(screen.getByText(/Hello, Kavya/)).toBeInTheDocument()
    expect(screen.getByText('Order History')).toBeInTheDocument()
  })

  it('shows auth bootstrap failures in an assertive live region', () => {
    useAuthStore.setState({
      initializationError: 'We could not verify your account session. You can still sign in below.',
    })

    render(<AccountClient />)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveAttribute('aria-live', 'assertive')
    expect(alert).toHaveTextContent('We could not verify your account session.')
  })

  it('announces sign-in errors and sends password-reset emails from real buttons', async () => {
    signIn.mockRejectedValueOnce(new Error('Invalid login credentials'))

    render(<AccountClient />)

    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'kavya@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrong-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid login credentials')

    fireEvent.click(screen.getByRole('button', { name: 'Forgot your password?' }))

    await waitFor(() => {
      expect(resetPassword).toHaveBeenCalledWith('kavya@example.com')
    })
    expect(
      await screen.findByText(
        'Password reset email sent. Check your inbox for the secure reset link.'
      )
    ).toBeInTheDocument()
  })

  it('shows a Track Order link for shipped orders that have a tracking URL', async () => {
    supabaseMocks.from.mockReturnValue(
      makeOrdersBuilder([
        {
          id: 'aaaabbbb-0000-0000-0000-000000000001',
          status: 'Shipped',
          total: 799,
          points_earned: 8,
          created_at: '2026-05-21T10:00:00.000Z',
          tracking_url: 'https://www.delhivery.com/track/package/DL123',
        },
      ])
    )

    useAuthStore.setState({
      user: { id: 'user-1', email: 'kavya@example.com' } as never,
      profile: {
        id: 'user-1',
        full_name: 'Kavya Menon',
        skin_type: 'Sensitive',
        tier: 'green leaf',
      },
    })

    render(<AccountClient />)

    const trackLink = await screen.findByRole('link', { name: /Track Order/ })
    expect(trackLink).toHaveAttribute('href', 'https://www.delhivery.com/track/package/DL123')
    expect(trackLink).toHaveAttribute('target', '_blank')
  })

  it('does not show a Track Order link when no tracking URL is set', async () => {
    supabaseMocks.from.mockReturnValue(
      makeOrdersBuilder([
        {
          id: 'aaaabbbb-0000-0000-0000-000000000002',
          status: 'Processing',
          total: 499,
          points_earned: 5,
          created_at: '2026-05-22T10:00:00.000Z',
          tracking_url: null,
        },
      ])
    )

    useAuthStore.setState({
      user: { id: 'user-1', email: 'kavya@example.com' } as never,
      profile: { id: 'user-1', full_name: 'Kavya Menon', skin_type: 'Normal', tier: 'green leaf' },
    })

    render(<AccountClient />)

    await screen.findByText(/AAAABBBB/)
    expect(screen.queryByRole('link', { name: /Track Order/ })).not.toBeInTheDocument()
  })
})

function makeOrdersBuilder(orders: Record<string, unknown>[]) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    then: vi.fn((resolve: (v: { data: Record<string, unknown>[]; error: null }) => unknown) =>
      Promise.resolve(resolve({ data: orders, error: null }))
    ),
  }
}
