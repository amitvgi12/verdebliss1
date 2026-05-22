import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MAX_CART_ITEM_QTY } from '@/constants/cart'
import { useCartStore } from '@/store/cartStore'
import { useToastStore } from '@/store/toastStore'
import type { CartItem } from '@/types'

const sumTotal = (items: CartItem[]) => items.reduce((s, i) => s + i.price * i.qty, 0)
const sumCount = (items: CartItem[]) => items.reduce((s, i) => s + i.qty, 0)

beforeEach(() => {
  vi.useFakeTimers()
  useCartStore.setState({ items: [], isOpen: false })
  useToastStore.setState({ toasts: [] })
})

afterEach(() => {
  vi.useRealTimers()
})

const SERUM = { id: '7', name: 'Niacinamide Pore Serum', price: 2450 }
const TONER = { id: '3', name: 'Green Tea Clarity Toner', price: 1450 }
const CREAM = { id: '8', name: 'Shea Butter Night Cream', price: 2650 }

describe('cartStore — addItem', () => {
  it('adds a new item with qty 1', () => {
    useCartStore.getState().addItem(SERUM)
    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0]?.id).toBe('7')
    expect(items[0]?.qty).toBe(1)
  })

  it('increments qty when the same item is added again', () => {
    const { addItem } = useCartStore.getState()
    addItem(SERUM)
    addItem(SERUM)
    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0]?.qty).toBe(2)
  })

  it('adds multiple distinct items', () => {
    const { addItem } = useCartStore.getState()
    addItem(SERUM)
    addItem(TONER)
    expect(useCartStore.getState().items).toHaveLength(2)
  })

  it('new item price is preserved correctly', () => {
    useCartStore.getState().addItem(SERUM)
    expect(useCartStore.getState().items[0]?.price).toBe(2450)
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
    expect(items[0]?.id).toBe('3')
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

describe('cartStore — itemCount', () => {
  it('cart has 0 items after reset', () => {
    expect(sumCount(useCartStore.getState().items)).toBe(0)
  })

  it('counts total quantity across all items', () => {
    const { addItem } = useCartStore.getState()
    addItem(SERUM)
    addItem(SERUM)
    addItem(TONER)
    expect(sumCount(useCartStore.getState().items)).toBe(3)
  })

  it('count reflects qty after adding same item 3 times', () => {
    const { addItem } = useCartStore.getState()
    addItem(SERUM)
    addItem(SERUM)
    addItem(SERUM)
    expect(sumCount(useCartStore.getState().items)).toBe(3)
  })
})

describe('cartStore — total', () => {
  it('total is 0 for an empty cart', () => {
    expect(sumTotal(useCartStore.getState().items)).toBe(0)
  })

  it('calculates correct total for one item × 2', () => {
    const { addItem } = useCartStore.getState()
    addItem(SERUM)
    addItem(SERUM)
    expect(sumTotal(useCartStore.getState().items)).toBe(4900)
  })

  it('calculates correct total for multiple distinct items', () => {
    const { addItem } = useCartStore.getState()
    addItem(SERUM)
    addItem(TONER)
    addItem(CREAM)
    expect(sumTotal(useCartStore.getState().items)).toBe(6550)
  })

  it('total updates correctly after remove', () => {
    const { addItem, removeItem } = useCartStore.getState()
    addItem(SERUM)
    addItem(TONER)
    removeItem('3')
    expect(sumTotal(useCartStore.getState().items)).toBe(2450)
  })
})

describe('cartStore — cart open/close', () => {
  it('cart is closed (isOpen=false) after reset', () => {
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

describe('cartStore — clearCart', () => {
  it('removes all items', () => {
    const { addItem, clearCart } = useCartStore.getState()
    addItem(SERUM)
    addItem(TONER)
    addItem(CREAM)
    clearCart()
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('total is 0 after clearCart', () => {
    const { addItem, clearCart } = useCartStore.getState()
    addItem(SERUM)
    addItem(TONER)
    clearCart()
    expect(sumTotal(useCartStore.getState().items)).toBe(0)
  })
})

describe('cartStore — qty ceiling', () => {
  it(`addItem caps qty at MAX_CART_ITEM_QTY (${MAX_CART_ITEM_QTY}) and warns`, () => {
    const { addItem } = useCartStore.getState()
    for (let i = 0; i < MAX_CART_ITEM_QTY + 1; i++) addItem(SERUM)
    expect(useCartStore.getState().items[0]?.qty).toBe(MAX_CART_ITEM_QTY)
    expect(useToastStore.getState().toasts.at(-1)).toMatchObject({
      msg: `Maximum ${MAX_CART_ITEM_QTY} per order for ${SERUM.name}.`,
      type: 'warning',
    })
  })

  it('addItem respects stock ceiling when stock < MAX_CART_ITEM_QTY', () => {
    const { addItem } = useCartStore.getState()
    const lowStock = { ...SERUM, stock: 3 }
    for (let i = 0; i < 5; i++) addItem(lowStock)
    expect(useCartStore.getState().items[0]?.qty).toBe(3)
  })

  it('updateQty does not increment past MAX_CART_ITEM_QTY and warns', () => {
    const { addItem, updateQty } = useCartStore.getState()
    for (let i = 0; i < MAX_CART_ITEM_QTY; i++) addItem(SERUM)
    updateQty(SERUM.id, 1)
    expect(useCartStore.getState().items[0]?.qty).toBe(MAX_CART_ITEM_QTY)
    expect(useToastStore.getState().toasts.at(-1)).toMatchObject({
      msg: `Maximum ${MAX_CART_ITEM_QTY} per order for ${SERUM.name}.`,
      type: 'warning',
    })
  })

  it('updateQty still decrements normally below the ceiling', () => {
    const { addItem, updateQty } = useCartStore.getState()
    addItem(SERUM)
    addItem(SERUM)
    updateQty(SERUM.id, -1)
    expect(useCartStore.getState().items[0]?.qty).toBe(1)
  })

  it('updateQty removes the item when decrementing from 1', () => {
    const { addItem, updateQty } = useCartStore.getState()
    addItem(SERUM)
    updateQty(SERUM.id, -1)
    expect(useCartStore.getState().items).toHaveLength(0)
    expect(sumCount(useCartStore.getState().items)).toBe(0)
  })
})
