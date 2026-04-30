import '@testing-library/jest-dom'
import { vi } from 'vitest'

vi.mock('@/lib/supabase', () => {
  function makeBuilder() {
    const b = {
      select: () => b, eq: () => b, neq: () => b, contains: () => b,
      order: () => b, limit: () => b, single: () => Promise.resolve({ data: null, error: { message: 'mocked' } }),
      then: (res, rej) => Promise.resolve({ data: null, error: { message: 'mocked' } }).then(res, rej),
    }
    return b
  }
  return {
    supabase: {
      from: () => makeBuilder(),
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
    },
  }
})

vi.mock('next/navigation', () => ({
  useRouter:      () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname:    () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams:      () => ({ id: '7', slug: 'bakuchiol-vs-retinol' }),
}))

vi.mock('next/image', () => ({
  default: (props) => {
    const { src, alt, ...rest } = props
    return React.createElement('img', { src, alt, ...rest })
  },
}))

