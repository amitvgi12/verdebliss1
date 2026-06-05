import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AuthInitializerLoader from '@/components/ui/AuthInitializerLoader'

const routeState = vi.hoisted(() => ({ pathname: '/' }))

vi.mock('next/navigation', () => ({
  usePathname: () => routeState.pathname,
}))

vi.mock('next/dynamic', () => ({
  default: () =>
    function MockAuthInitializer() {
      return <div data-testid="auth-initializer" />
    },
}))

describe('AuthInitializerLoader', () => {
  afterEach(() => {
    routeState.pathname = '/'
    vi.useRealTimers()
  })

  it('loads auth immediately on account routes', () => {
    routeState.pathname = '/account'

    render(<AuthInitializerLoader />)

    expect(screen.getByTestId('auth-initializer')).toBeInTheDocument()
  })

  it('defers auth bootstrap on marketing routes', () => {
    vi.useFakeTimers()
    routeState.pathname = '/'

    render(<AuthInitializerLoader />)

    expect(screen.queryByTestId('auth-initializer')).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1800)
    })

    expect(screen.getByTestId('auth-initializer')).toBeInTheDocument()
  })
})
