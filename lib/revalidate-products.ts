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
