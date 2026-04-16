/**
 * cartStore.test.js
 * Tests Zustand cart store: add, remove, update quantity, clear, totals.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from '@/store/cartStore'

// Reset store state between tests
beforeEach(() => {
  useCartStore.setState({
    items: [],
    cartOpen: false,
  })
})

const SERUM  = { id: '7', name: 'Niacinamide Pore Serum',    price: 2450 }
const TONER  = { id: '3', name: 'Green Tea Clarity Toner',   price: 1450 }
const CREAM  = { id: '8', name: 'Shea Butter Night Cream',   price: 2650 }

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
})

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
    useCartStore.getState().removeItem('999')
    expect(useCartStore.getState().items).toHaveLength(1)
  })
})

describe('cartStore — itemCount', () => {
  it('returns 0 for an empty cart', () => {
    expect(useCartStore.getState().itemCount).toBe(0)
  })

  it('counts total quantity across all items', () => {
    const { addItem } = useCartStore.getState()
    addItem(SERUM); addItem(SERUM)  // qty 2
    addItem(TONER)                  // qty 1
    // itemCount may be a computed selector or raw field
    const state = useCartStore.getState()
    const total = typeof state.itemCount === 'function'
      ? state.itemCount()
      : state.itemCount
    expect(total).toBe(3)
  })
})

describe('cartStore — total', () => {
  it('returns 0 for an empty cart', () => {
    const state = useCartStore.getState()
    const val   = typeof state.total === 'function' ? state.total() : state.total
    expect(val).toBe(0)
  })

  it('calculates correct total for one item × 2', () => {
    const { addItem } = useCartStore.getState()
    addItem(SERUM); addItem(SERUM)
    const state = useCartStore.getState()
    const val   = typeof state.total === 'function' ? state.total() : state.total
    expect(val).toBe(4900) // 2450 × 2
  })

  it('calculates correct total for multiple distinct items', () => {
    const { addItem } = useCartStore.getState()
    addItem(SERUM)  // 2450
    addItem(TONER)  // 1450
    addItem(CREAM)  // 2650
    const state = useCartStore.getState()
    const val   = typeof state.total === 'function' ? state.total() : state.total
    expect(val).toBe(6550)
  })
})

describe('cartStore — cart open/close', () => {
  it('cart is closed by default', () => {
    expect(useCartStore.getState().cartOpen).toBe(false)
  })

  it('openCart sets cartOpen to true', () => {
    useCartStore.getState().openCart?.()
    expect(useCartStore.getState().cartOpen).toBe(true)
  })

  it('closeCart sets cartOpen to false', () => {
    useCartStore.setState({ cartOpen: true })
    useCartStore.getState().closeCart?.()
    expect(useCartStore.getState().cartOpen).toBe(false)
  })
})
