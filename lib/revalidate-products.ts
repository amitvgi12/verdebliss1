import { after } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'

/**
 * Purges the Next.js Data Cache for product pages.
 *
 * - Called with no args (e.g. webhook fallback): revalidates the catalogue
 *   listing and shared product data tags.
 * - Called with productIds: revalidates the catalogue + only those PDPs
 *   (used after a single product edit / stock change).
 */
export function revalidateProductsCache(productIds?: string[]) {
  revalidateTag('products', 'max')
  revalidatePath('/products', 'layout')

  for (const id of productIds ?? []) {
    revalidateTag(`product-${id}`, 'max')
    revalidatePath(`/products/${id}`, 'page')
  }
}

function isMissingAfterScope(error: unknown) {
  return error instanceof Error && error.message.includes('outside a request scope')
}

export function scheduleProductsRevalidation(productIds?: string[]) {
  try {
    after(() => {
      try {
        revalidateProductsCache(productIds)
      } catch (error) {
        console.error('[revalidate-products] failed', error)
      }
    })
  } catch (error) {
    if (isMissingAfterScope(error) && process.env.NODE_ENV === 'test') return
    console.error('[revalidate-products] scheduling failed', error)
  }
}
