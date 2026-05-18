import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import AccountClient from '@/app/account/AccountClient'
import { useAuthStore } from '@/store/authStore'

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
})
