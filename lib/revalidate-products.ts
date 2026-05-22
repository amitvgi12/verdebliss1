import { after } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'

/**
 * Purges the Next.js Data Cache for product pages.
 * Call this from any Route Handler after product stock changes or data updates.
 * Pass productIds to also bust individual PDP entries; omit to bust only the catalogue.
 */
export function revalidateProductsCache(productIds?: string[]) {
  revalidateTag('products', 'max')
  revalidatePath('/products', 'layout')

  if (productIds?.length) {
    for (const id of productIds) {
      revalidateTag(`product-${id}`, 'max')
      revalidatePath(`/products/${id}`, 'page')
    }
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
