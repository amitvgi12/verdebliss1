/**
 * Vitest global setup — runs before every test file.
 * Imports @testing-library/jest-dom to add matchers like:
 *   toBeInTheDocument, toHaveTextContent, toBeDisabled, etc.
 */
import '@testing-library/jest-dom'
import { vi } from 'vitest'

/* ── Stub out Supabase so tests never hit the network ── */
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'mocked' } }) }) }),
      order: () => Promise.resolve({ data: null, error: { message: 'mocked' } }),
    }),
  },
}))

/* ── Stub router hooks used in components ── */
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams:   () => ({ id: '1' }),
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/' }),
  }
})
