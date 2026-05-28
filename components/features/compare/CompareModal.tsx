'use client'
import { X } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useCompareStore } from '@/store/compareStore'
import ProductImage from '@/components/ui/ProductImage'
import { PRICE_UNAVAILABLE_COPY, hasProductPrice } from '@/lib/pricing'
import { productPath } from '@/lib/seo'
import Link from 'next/link'
import type { Product } from '@/types'

const ROWS: Array<{ label: string; render: (p: Product) => React.ReactNode }> = [
  {
    label: 'Price',
    render: (p) =>
      hasProductPrice(p) ? (
        <span className="compare-modal__price">₹{p.price.toLocaleString()}</span>
      ) : (
        <span className="compare-modal__stock compare-modal__stock--out">
          {PRICE_UNAVAILABLE_COPY}
        </span>
      ),
  },
  { label: 'Category', render: (p) => p.category ?? '—' },
  { label: 'Key ingredient', render: (p) => p.ingredient ?? '—' },
  {
    label: 'Skin types',
    render: (p) => (p.skin_types?.length ? p.skin_types.slice(0, 3).join(', ') : 'All types'),
  },
  {
    label: 'Stock',
    render: (p) =>
      p.stock === 0 ? (
        <span className="compare-modal__stock compare-modal__stock--out">Out of stock</span>
      ) : (p.stock ?? 1) <= 5 ? (
        <span className="compare-modal__stock compare-modal__stock--low">Low — {p.stock} left</span>
      ) : (
        <span className="compare-modal__stock compare-modal__stock--in">In stock</span>
      ),
  },
  {
    label: 'Description',
    render: (p) => (
      <span className="compare-modal__desc">{p.description?.slice(0, 90) ?? '—'}</span>
    ),
  },
]

export default function CompareModal() {
  const { products, isOpen, close, remove } = useCompareStore()
  const addItem = useCartStore((s) => s.addItem)

  if (!isOpen || products.length === 0) return null

  return (
    <div className="compare-modal-backdrop" role="dialog" aria-modal aria-label="Compare products">
      <div className="compare-modal">
        <div className="compare-modal__header">
          <h2 className="compare-modal__title">Compare products</h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close comparison"
            className="compare-modal__close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="compare-modal__scroll">
          <table className="compare-modal__table">
            <thead>
              <tr>
                <th className="compare-modal__th compare-modal__th--label" scope="col" />
                {products.map((p) => (
                  <th key={p.id} className="compare-modal__th" scope="col">
                    <div className="compare-modal__product-head">
                      <button
                        type="button"
                        onClick={() => remove(p.id)}
                        aria-label={`Remove ${p.name} from comparison`}
                        className="compare-modal__remove"
                      >
                        <X size={13} />
                      </button>
                      <div className="compare-modal__img-wrap">
                        <ProductImage product={p} sizes="80px" />
                      </div>
                      <Link
                        href={productPath(p)}
                        className="compare-modal__product-name"
                        onClick={close}
                      >
                        {p.name}
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label} className="compare-modal__row">
                  <td className="compare-modal__label">{row.label}</td>
                  {products.map((p) => (
                    <td key={p.id} className="compare-modal__cell">
                      {row.render(p)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="compare-modal__row compare-modal__row--action">
                <td className="compare-modal__label" />
                {products.map((p) => (
                  <td key={p.id} className="compare-modal__cell">
                    <button
                      type="button"
                      disabled={!isPurchasable(p)}
                      onClick={() => {
                        if (isPurchasable(p)) addItem(p)
                      }}
                      className="compare-modal__add"
                      aria-label={compareAddAriaLabel(p)}
                    >
                      {compareAddLabel(p)}
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function isPurchasable(product: Product): boolean {
  return product.stock !== 0 && hasProductPrice(product)
}

function compareAddLabel(product: Product): string {
  if (product.stock === 0) return 'Sold out'
  return hasProductPrice(product) ? 'Add to cart' : 'Unavailable'
}

function compareAddAriaLabel(product: Product): string {
  if (product.stock === 0) return `${product.name} sold out`
  return hasProductPrice(product)
    ? `Add ${product.name} to cart`
    : `${product.name} price temporarily unavailable`
}
