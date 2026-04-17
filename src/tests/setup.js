/**
 * setup.js — Vitest global test setup
 * Runs before every test file.
 */
import '@testing-library/jest-dom'
import { vi } from 'vitest'

/* ─────────────────────────────────────────────────────────────────────────
 * Supabase mock — full chainable query builder
 *
 * useProducts.js builds queries like:
 *   supabase.from('products').select('*').eq(...).contains(...).order(...).then(...)
 *   supabase.from('products').select('*').eq('id', id).single()
 *
 * Every method must return the same builder so the chain never breaks.
 * The builder is also thenable (.then) so query.then(...) works directly.
 * When Supabase returns { data: null, error } the hooks fall back to PRODUCTS.
 * ───────────────────────────────────────────────────────────────────────── */
function makeQueryBuilder() {
  const result = { data: null, error: { message: 'mocked — using static fallback' } }

  const builder = {
    // Filter methods — return builder so chaining continues
    select:   () => builder,
    eq:       () => builder,
    neq:      () => builder,
    contains: () => builder,
    order:    () => builder,
    limit:    () => builder,
    range:    () => builder,
    filter:   () => builder,
    match:    () => builder,
    ilike:    () => builder,
    is:       () => builder,

    // Terminal: returns a Promise (used with await or .then directly)
    single: () => Promise.resolve(result),

    // Thenability: makes the builder itself awaitable / .then()-able
    // useProducts does: query.then(({ data, error }) => { ... })
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  }

  return builder
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => makeQueryBuilder(),
    auth: {
      getSession:     () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: () => Promise.resolve({ data: null, error: null }),
      signUp:         () => Promise.resolve({ data: null, error: null }),
      signOut:        () => Promise.resolve({ error: null }),
    },
  },
}))

/* ─────────────────────────────────────────────────────────────────────────
 * React Router mock — provides stable hook implementations so components
 * that call useParams / useNavigate / useLocation don't need a real router.
 * productDetail.test.jsx wraps with MemoryRouter directly, so these only
 * fire for components rendered outside a router context.
 * ───────────────────────────────────────────────────────────────────────── */
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    // Keep real implementations — tests wrap with MemoryRouter, so this
    // only acts as a safety net for components used without a router.
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
  }
})
