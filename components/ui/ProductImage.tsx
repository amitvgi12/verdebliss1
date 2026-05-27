import Image from 'next/image'
import type { Product } from '@/types'

const INGREDIENT_GRADIENTS: Record<string, string> = {
  Bakuchiol: 'linear-gradient(160deg,#d4e8cd 0%,#b8d9af 100%)',
  'Rose Hip': 'linear-gradient(160deg,#fce8ee 0%,#f7c5d3 100%)',
  'Green Tea': 'linear-gradient(160deg,#dcedc8 0%,#c5e1a5 100%)',
  Turmeric: 'linear-gradient(160deg,#fff9c4 0%,#fff176 100%)',
  'Zinc Oxide': 'linear-gradient(160deg,#e3f2fd 0%,#90caf9 100%)',
  'Acai Berry': 'linear-gradient(160deg,#ede7f6 0%,#b39ddb 100%)',
  Niacinamide: 'linear-gradient(160deg,#e0f7fa 0%,#80deea 100%)',
  'Shea Butter': 'linear-gradient(160deg,#fff3e0 0%,#ffcc80 100%)',
}

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

const DEFAULT_GRADIENT = 'linear-gradient(160deg,#eaf0e8 0%,#c8dbc6 100%)'

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
  const bg = (ingredient && INGREDIENT_GRADIENTS[ingredient]) ?? DEFAULT_GRADIENT

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: bg }}>
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
