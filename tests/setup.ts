import '@testing-library/jest-dom'
import { vi } from 'vitest'

vi.mock('@/lib/supabase', () => {
  function makeBuilder() {
    const b = {
      select: () => b,
      eq: () => b,
      neq: () => b,
      contains: () => b,
      order: () => b,
      limit: () => b,
      single: () => Promise.resolve({ data: null, error: { message: 'mocked' } }),
      then: (
        res: (value: { data: null; error: { message: string } }) => unknown,
        rej?: (reason?: unknown) => unknown
      ) => Promise.resolve({ data: null, error: { message: 'mocked' } }).then(res, rej),
    }
    return b
  }
  return {
    supabase: {
      from: () => makeBuilder(),
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
        resetPasswordForEmail: () => Promise.resolve({ data: {}, error: null }),
        updateUser: () => Promise.resolve({ data: {}, error: null }),
      },
    },
  }
})

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: '7', slug: 'bakuchiol-vs-retinol' }),
}))
