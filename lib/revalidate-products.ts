import { after } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { getProductsServer } from '@/lib/products-server'

/**
 * Purges the Next.js Data Cache for product pages.
 *
 * - Called with no args (e.g. webhook fallback): revalidates the catalogue
 *   listing and shared product data tags.
 * - Called with product IDs or slugs: revalidates the catalogue + matching PDPs
 *   (used after a single product edit / stock change).
 */
export async function revalidateProductsCache(productIds?: string[]) {
  revalidateTag('products', 'max')
  revalidatePath('/', 'page')
  revalidatePath('/products', 'layout')
  revalidatePath('/products/[id]', 'page')

  const identifiers = uniqueIdentifiers(productIds)
  const slugByIdentifier = await resolveProductSlugs(identifiers)

  for (const identifier of identifiers) {
    revalidateTag(`product-${identifier}`, 'max')
    revalidatePath(`/products/${identifier}`, 'page')

    const slug = slugByIdentifier.get(identifier)
    if (slug && slug !== identifier) {
      revalidateTag(`product-${slug}`, 'max')
      revalidatePath(`/products/${slug}`, 'page')
    }
  }
}

function uniqueIdentifiers(productIds?: string[]) {
  return [...new Set((productIds ?? []).map((id) => id.trim()).filter(Boolean))]
}

async function resolveProductSlugs(productIds: string[]) {
  const slugByIdentifier = new Map<string, string>()
  if (productIds.length === 0) return slugByIdentifier

  try {
    const products = await getProductsServer()
    const requested = new Set(productIds)

    for (const product of products) {
      const slug = product.slug ?? product.id
      if (requested.has(product.id)) slugByIdentifier.set(product.id, slug)
      if (product.slug && requested.has(product.slug)) slugByIdentifier.set(product.slug, slug)
    }
  } catch (error) {
    console.error('[revalidate-products] failed to resolve product slugs', error)
  }

  return slugByIdentifier
}

function isMissingAfterScope(error: unknown) {
  return error instanceof Error && error.message.includes('outside a request scope')
}

export function scheduleProductsRevalidation(productIds?: string[]) {
  try {
    after(async () => {
      try {
        await revalidateProductsCache(productIds)
      } catch (error) {
        console.error('[revalidate-products] failed', error)
      }
    })
  } catch (error) {
    if (isMissingAfterScope(error) && process.env.NODE_ENV === 'test') return
    console.error('[revalidate-products] scheduling failed', error)
  }
}
