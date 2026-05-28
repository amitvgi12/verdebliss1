import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  getProductsServer: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath,
  revalidateTag: mocks.revalidateTag,
}))

vi.mock('@/lib/products-server', () => ({
  getProductsServer: mocks.getProductsServer,
}))

import { revalidateProductsCache } from '@/lib/revalidate-products'

describe('product cache revalidation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getProductsServer.mockResolvedValue([
      {
        id: '11111111-1111-4111-8111-111111111111',
        slug: 'bakuchiol-renewal-serum',
      },
      {
        id: '22222222-2222-4222-8222-222222222222',
        slug: 'niacinamide-pore-serum',
      },
    ])
  })

  it('revalidates both product IDs and their slug PDP paths', async () => {
    await revalidateProductsCache(['11111111-1111-4111-8111-111111111111'])

    expect(mocks.revalidateTag).toHaveBeenCalledWith('products', 'max')
    expect(mocks.revalidateTag).toHaveBeenCalledWith(
      'product-11111111-1111-4111-8111-111111111111',
      'max'
    )
    expect(mocks.revalidateTag).toHaveBeenCalledWith('product-bakuchiol-renewal-serum', 'max')
    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      '/products/11111111-1111-4111-8111-111111111111',
      'page'
    )
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/products/bakuchiol-renewal-serum', 'page')
  })

  it('keeps slug inputs idempotent', async () => {
    await revalidateProductsCache(['bakuchiol-renewal-serum'])

    const slugPathCalls = mocks.revalidatePath.mock.calls.filter(
      ([path]) => path === '/products/bakuchiol-renewal-serum'
    )
    const slugTagCalls = mocks.revalidateTag.mock.calls.filter(
      ([tag]) => tag === 'product-bakuchiol-renewal-serum'
    )

    expect(slugPathCalls).toHaveLength(1)
    expect(slugTagCalls).toHaveLength(1)
  })
})
