import { describe, expect, it } from 'vitest'
import { formatApprovedReviewCount } from '@/lib/review-copy'

describe('review copy', () => {
  it('formats approved review counts as words instead of parenthesized counters', () => {
    expect(formatApprovedReviewCount(1)).toBe('1 approved review')
    expect(formatApprovedReviewCount(2)).toBe('2 approved reviews')
    expect(formatApprovedReviewCount(null)).toBe('0 approved reviews')
  })
})
