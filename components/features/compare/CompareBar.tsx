'use client'
import { X, ArrowLeftRight } from 'lucide-react'
import { useCompareStore, MAX_COMPARE_PRODUCTS } from '@/store/compareStore'
import ProductImage from '@/components/ui/ProductImage'

export default function CompareBar() {
  const { products, isOpen, open, close, remove, clear } = useCompareStore()

  if (products.length === 0) return null

  return (
    <div className="compare-bar" role="region" aria-label="Product comparison">
      <div className="compare-bar__inner">
        <div className="compare-bar__products">
          {products.map((p) => (
            <div key={p.id} className="compare-bar__item">
              <div className="compare-bar__thumb">
                <ProductImage product={p} sizes="44px" />
              </div>
              <span className="compare-bar__name">{p.name}</span>
              <button
                type="button"
                onClick={() => remove(p.id)}
                aria-label={`Remove ${p.name} from comparison`}
                className="compare-bar__remove"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {Array.from({ length: MAX_COMPARE_PRODUCTS - products.length }).map((_, i) => (
            <div key={`empty-${i}`} className="compare-bar__item compare-bar__item--empty">
              <div className="compare-bar__thumb compare-bar__thumb--empty" />
              <span className="compare-bar__name compare-bar__name--empty">Add product</span>
            </div>
          ))}
        </div>

        <div className="compare-bar__actions">
          <span className="compare-bar__count">
            {products.length}/{MAX_COMPARE_PRODUCTS} selected
          </span>
          <button
            type="button"
            onClick={isOpen ? close : open}
            disabled={products.length < 2}
            className="compare-bar__cta"
            aria-label="Compare selected products"
          >
            <ArrowLeftRight size={14} />
            Compare
          </button>
          <button
            type="button"
            onClick={clear}
            aria-label="Clear all products from comparison"
            className="compare-bar__clear"
          >
            Clear all
          </button>
        </div>
      </div>
    </div>
  )
}
