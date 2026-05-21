import ProductCard from '@/components/ui/ProductCard'
import { C, FONT } from '@/constants/theme'
import type { Product } from '@/types'

interface RelatedProductsProps {
  products: Product[]
  isMobile: boolean
}

export default function RelatedProducts({ products, isMobile }: RelatedProductsProps) {
  if (!products.length) return null

  return (
    <div
      style={{
        marginTop: isMobile ? 48 : 80,
        borderTop: `1px solid ${C.border}`,
        paddingTop: isMobile ? 32 : 48,
      }}
    >
      <h3
        style={{
          fontFamily: FONT.serif,
          fontSize: isMobile ? 24 : 30,
          fontWeight: 400,
          color: C.text,
          marginBottom: 24,
        }}
      >
        You might also like
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: isMobile ? 12 : 16,
        }}
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
