import Image from 'next/image'
import type { Product } from '@/types'

const PRODUCT_IMAGES: Record<string, string> = {
  Bakuchiol: '/images/products/serum.webp',
  'Rose Hip': '/images/products/moisturiser.webp',
  'Green Tea': '/images/products/toner.webp',
  Turmeric: '/images/products/cleanser.webp',
  'Zinc Oxide': '/images/products/spf.webp',
  'Acai Berry': '/images/products/lip-elixir.webp',
  Niacinamide: '/images/products/niacinamide-serum.webp',
  'Shea Butter': '/images/products/night-cream.webp',
}

const NEUTRAL_BG = 'linear-gradient(180deg,#faf7f2 0%,#f2ece4 100%)'

interface ProductImageProps {
  product?: Pick<Product, 'image_url' | 'name' | 'ingredient'> | null
  priority?: boolean
  sizes?: string
}

export default function ProductImage({
  product,
  priority = false,
  sizes = '(max-width: 768px) 100vw, 50vw',
}: ProductImageProps) {
  const ingredient = product?.ingredient
  const src =
    product?.image_url ??
    (ingredient && PRODUCT_IMAGES[ingredient]) ??
    '/images/products/serum.webp'

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: NEUTRAL_BG }}>
      <Image
        src={src}
        alt={
          product
            ? `${product.name}${product.ingredient ? ` — ${product.ingredient} botanical formula` : ''}`
            : 'VerdeBliss botanical skincare product'
        }
        fill
        sizes={sizes}
        className="object-contain p-[10%]"
        priority={priority}
      />
    </div>
  )
}
