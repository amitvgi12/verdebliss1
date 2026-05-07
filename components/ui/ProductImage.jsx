'use client'
/**
 * ProductImage.jsx — CRITICAL FIX 2.2
 * Replaced plain <img> with next/image <Image fill>
 * Benefits: automatic WebP/AVIF, responsive sizing, lazy loading,
 * CLS prevention, CDN delivery via Vercel Image Optimization.
 */
import Image from 'next/image'

const INGREDIENT_GRADIENTS = {
  Bakuchiol: 'linear-gradient(160deg,#d4e8cd 0%,#b8d9af 100%)',
  'Rose Hip': 'linear-gradient(160deg,#fce8ee 0%,#f7c5d3 100%)',
  'Green Tea': 'linear-gradient(160deg,#dcedc8 0%,#c5e1a5 100%)',
  Turmeric: 'linear-gradient(160deg,#fff9c4 0%,#fff176 100%)',
  'Zinc Oxide': 'linear-gradient(160deg,#e3f2fd 0%,#90caf9 100%)',
  'Acai Berry': 'linear-gradient(160deg,#ede7f6 0%,#b39ddb 100%)',
  Niacinamide: 'linear-gradient(160deg,#e0f7fa 0%,#80deea 100%)',
  'Shea Butter': 'linear-gradient(160deg,#fff3e0 0%,#ffcc80 100%)',
}

const PRODUCT_IMAGES = {
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

export default function ProductImage({ product, priority = false }) {
  const src =
    product?.image_url ?? PRODUCT_IMAGES[product?.ingredient] ?? '/images/products/serum.webp'
  const bg = INGREDIENT_GRADIENTS[product?.ingredient] ?? DEFAULT_GRADIENT

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: bg,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Image
        src={src}
        alt={product?.name ?? 'VerdeBliss product'}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        style={{ objectFit: 'contain', padding: '10%' }}
        priority={priority}
      />
    </div>
  )
}
