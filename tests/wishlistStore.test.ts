import { beforeEach, describe, expect, it, vi } from 'vitest'

const supabaseMocks = vi.hoisted(() => ({
  from: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: supabaseMocks.from,
  },
}))

import { useWishlistStore } from '@/store/wishlistStore'

describe('wishlistStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useWishlistStore.setState({ ids: [] })
  })

  it('loads wishlist rows from the singular wishlist table', async () => {
    const builder = makeLoadBuilder([{ product_id: 'serum-1' }, { product_id: 2 }])
    supabaseMocks.from.mockReturnValue(builder)

    await useWishlistStore.getState().load('user-1')

    expect(supabaseMocks.from).toHaveBeenCalledWith('wishlist')
    expect(builder.select).toHaveBeenCalledWith('product_id')
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(useWishlistStore.getState().ids).toEqual(['serum-1', '2'])
  })

  it('inserts into the singular wishlist table when toggling a new item on', async () => {
    const builder = makeInsertBuilder()
    supabaseMocks.from.mockReturnValue(builder)

    await useWishlistStore.getState().toggle('serum-1', 'user-1')

    expect(useWishlistStore.getState().ids).toEqual(['serum-1'])
    expect(supabaseMocks.from).toHaveBeenCalledWith('wishlist')
    expect(builder.insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      product_id: 'serum-1',
    })
  })

  it('deletes from the singular wishlist table when toggling an existing item off', async () => {
    useWishlistStore.setState({ ids: ['serum-1'] })
    const builder = makeDeleteBuilder()
    supabaseMocks.from.mockReturnValue(builder)

    await useWishlistStore.getState().toggle('serum-1', 'user-1')

    expect(useWishlistStore.getState().ids).toEqual([])
    expect(supabaseMocks.from).toHaveBeenCalledWith('wishlist')
    expect(builder.delete).toHaveBeenCalled()
    expect(builder.eq).toHaveBeenNthCalledWith(1, 'user_id', 'user-1')
    expect(builder.eq).toHaveBeenNthCalledWith(2, 'product_id', 'serum-1')
  })
})

function makeLoadBuilder(data: Array<{ product_id: string | number }>) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ data }),
  }
}

function makeInsertBuilder() {
  return {
    insert: vi.fn().mockResolvedValue({ error: null }),
  }
}

function makeDeleteBuilder() {
  return {
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
  }
}
