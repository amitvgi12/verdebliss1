import { describe, expect, it } from 'vitest'
import {
  canCustomerCancel,
  decideCustomerCancellation,
  decideStaffStatusChange,
} from '@/lib/order-state'

describe('customer cancellation rules', () => {
  it.each([
    ['Processing', 'cod_pending', 'Cancelled', true],
    ['COD Verification Required', 'cod_review', 'Cancelled', true],
    ['Shipped', 'cod_pending', 'Cancellation Requested', false],
    ['Out for Delivery', 'cod_pending', 'Cancellation Requested', false],
    ['Processing', 'paid', 'Cancellation Requested', false],
    ['Shipped', 'paid', 'Cancellation Requested', false],
  ])('%s / %s → %s (restock=%s)', (status, payment_status, nextStatus, restock) => {
    const decision = decideCustomerCancellation({ status, payment_status })
    expect(decision).toMatchObject({ allowed: true, nextStatus, restock })
  })

  it.each(['Delivered', 'Cancelled', 'Cancellation Requested', 'Refunded', 'Mystery'])(
    'refuses %s',
    (status) => {
      expect(canCustomerCancel({ status, payment_status: 'paid' })).toBe(false)
    }
  )
})

describe('staff status transitions', () => {
  it.each([
    ['Processing', 'paid', 'Shipped'],
    ['COD Pending', 'cod_pending', 'Shipped'],
    ['Shipped', 'paid', 'Out for Delivery'],
    ['Shipped', 'cod_pending', 'Delivered'],
    ['Out for Delivery', 'paid', 'Delivered'],
    ['Cancellation Requested', 'paid', 'Shipped'],
    ['Shipped', 'paid', 'Shipped'], // same status: tracking-field update only
  ])('allows %s (%s) → %s', (status, payment_status, target) => {
    expect(decideStaffStatusChange({ status, payment_status }, target).allowed).toBe(true)
  })

  it.each([
    ['Cancelled', 'cancelled', 'Delivered'],
    ['Refunded', 'paid', 'Shipped'],
    ['Delivered', 'paid', 'Processing'],
    ['Shipped', 'paid', 'Processing'],
    ['COD Verification Required', 'cod_review', 'Shipped'],
    ['Processing', 'authorized', 'Shipped'],
    ['Processing', 'pending', 'Shipped'],
  ])('refuses %s (%s) → %s', (status, payment_status, target) => {
    expect(decideStaffStatusChange({ status, payment_status }, target).allowed).toBe(false)
  })

  it('clears cod_review to cod_pending when staff verify a flagged COD order', () => {
    expect(
      decideStaffStatusChange(
        { status: 'COD Verification Required', payment_status: 'cod_review' },
        'COD Pending'
      )
    ).toEqual({ allowed: true, paymentStatus: 'cod_pending' })
  })
})
