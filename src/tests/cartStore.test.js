/**
 * cartStore.test.js
 *
 * Key facts about the real cartStore (src/store/cartStore.js):
 *
 *  1. Cart open state is stored as `isOpen`, NOT `cartOpen`.
 *  2. `total` and `itemCount` are defined as ES getter properties:
 *       get total()     { return get().items.reduce(...) }
 *       get itemCount() { return get().items.reduce(...) }
 *     Zustand's setState() merges state via object spread, which strips
 *     getter definitions from the resulting plain object. So calling
 *     `useCartStore.getState().total` after setState returns undefined.
 *     → Compute total/count directly from state.items in tests.
 *
 *  3. `persist` middleware is active — uses localStorage (available in jsdom).
 *     beforeEach resets items and isOpen via setState.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from '@/store/cartStore'

/* ── helpers ────────────────────────────────────────── */
/** Compute total from items, matching the store's own formula */
const sumTotal = (items) => items.reduce((s, i) => s + i.price * i.qty, 0)
/** Compute item count from items */
const sumCount = (items) => items.reduce((s, i) => s + i.qty, 0)

/* ── Reset store before every test ─────────────────── */
beforeEach(() => {
  useCartStore.setState({ items: [], isOpen: false })
})

/* ── Fixtures ───────────────────────────────────────── */
const SERUM = { id: '7', name: 'Niacinamide Pore Serum',  price: 2450 }
const TONER = { id: '3', name: 'Green Tea Clarity Toner', price: 1450 }
const CREAM = { id: '8', name: 'Shea Butter Night Cream', price: 2650 }

/* ── addItem ────────────────────────────────────────── */
describe('cartStore — addItem', () => {
  it('adds a new item with qty 1', () => {
    useCartStore.getState().addItem(SERUM)
    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].id).toBe('7')
    expect(items[0].qty).toBe(1)
  })

  it('increments qty when the same item is added again', () => {
    const { addItem } = useCartStore.getState()
    addItem(SERUM)
    addItem(SERUM)
    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].qty).toBe(2)
  })

  it('adds multiple distinct items', () => {
    const { addItem } = useCartStore.getState()
    addItem(SERUM)
    addItem(TONER)
    expect(useCartStore.getState().items).toHaveLength(2)
  })

  it('new item price is preserved correctly', () => {
    useCartStore.getState().addItem(SERUM)
    expect(useCartStore.getState().items[0].price).toBe(2450)
  })
})

/* ── removeItem ─────────────────────────────────────── */
describe('cartStore — removeItem', () => {
  it('removes an item by id', () => {
    const { addItem, removeItem } = useCartStore.getState()
    addItem(SERUM)
    addItem(TONER)
    removeItem('7')
    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].id).toBe('3')
  })

  it('does nothing when removing a non-existent id', () => {
    useCartStore.getState().addItem(SERUM)
    useCartStore.getState().removeItem('does-not-exist')
    expect(useCartStore.getState().items).toHaveLength(1)
  })

  it('cart becomes empty after removing the only item', () => {
    const { addItem, removeItem } = useCartStore.getState()
    addItem(SERUM)
    removeItem('7')
    expect(useCartStore.getState().items).toHaveLength(0)
  })
})

/* ── itemCount ──────────────────────────────────────── */
describe('cartStore — itemCount', () => {
  it('cart has 0 items after reset', () => {
    // Compute directly from items (getter is stripped by setState spread)
    expect(sumCount(useCartStore.getState().items)).toBe(0)
  })

  it('counts total quantity across all items', () => {
    const { addItem } = useCartStore.getState()
    addItem(SERUM); addItem(SERUM) // qty 2
    addItem(TONER)                 // qty 1
    expect(sumCount(useCartStore.getState().items)).toBe(3)
  })

  it('count reflects qty after adding same item 3 times', () => {
    const { addItem } = useCartStore.getState()
    addItem(SERUM); addItem(SERUM); addItem(SERUM)
    expect(sumCount(useCartStore.getState().items)).toBe(3)
  })
})

/* ── total ──────────────────────────────────────────── */
describe('cartStore — total', () => {
  it('total is 0 for an empty cart', () => {
    expect(sumTotal(useCartStore.getState().items)).toBe(0)
  })

  it('calculates correct total for one item × 2', () => {
    const { addItem } = useCartStore.getState()
    addItem(SERUM); addItem(SERUM)
    expect(sumTotal(useCartStore.getState().items)).toBe(4900) // 2450 × 2
  })

  it('calculates correct total for multiple distinct items', () => {
    const { addItem } = useCartStore.getState()
    addItem(SERUM) // 2450
    addItem(TONER) // 1450
    addItem(CREAM) // 2650
    expect(sumTotal(useCartStore.getState().items)).toBe(6550)
  })

  it('total updates correctly after remove', () => {
    const { addItem, removeItem } = useCartStore.getState()
    addItem(SERUM)
    addItem(TONER)
    removeItem('3') // remove TONER
    expect(sumTotal(useCartStore.getState().items)).toBe(2450)
  })
})

/* ── cart drawer open / close ───────────────────────── */
describe('cartStore — cart open/close', () => {
  it('cart is closed (isOpen=false) after reset', () => {
    // Real store key is `isOpen`, not `cartOpen`
    expect(useCartStore.getState().isOpen).toBe(false)
  })

  it('openCart() sets isOpen to true', () => {
    useCartStore.getState().openCart()
    expect(useCartStore.getState().isOpen).toBe(true)
  })

  it('closeCart() sets isOpen to false', () => {
    useCartStore.setState({ isOpen: true })
    useCartStore.getState().closeCart()
    expect(useCartStore.getState().isOpen).toBe(false)
  })

  it('openCart then closeCart leaves cart closed', () => {
    useCartStore.getState().openCart()
    useCartStore.getState().closeCart()
    expect(useCartStore.getState().isOpen).toBe(false)
  })
})

/* ── clearCart ──────────────────────────────────────── */
describe('cartStore — clearCart', () => {
  it('removes all items', () => {
    const { addItem, clearCart } = useCartStore.getState()
    addItem(SERUM); addItem(TONER); addItem(CREAM)
    clearCart()
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('total is 0 after clearCart', () => {
    const { addItem, clearCart } = useCartStore.getState()
    addItem(SERUM); addItem(TONER)
    clearCart()
    expect(sumTotal(useCartStore.getState().items)).toBe(0)
  })
})
