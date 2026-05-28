'use client'
import { X } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useCompareStore } from '@/store/compareStore'
import ProductImage from '@/components/ui/ProductImage'
import { productPath } from '@/lib/seo'
import Link from 'next/link'
import type { Product } from '@/types'

const ROWS: Array<{ label: string; render: (p: Product) => React.ReactNode }> = [
  {
    label: 'Price',
    render: (p) => <span className="compare-modal__price">₹{p.price.toLocaleString()}</span>,
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
                      disabled={p.stock === 0}
                      onClick={() => {
                        if (p.stock !== 0) addItem(p)
                      }}
                      className="compare-modal__add"
                      aria-label={p.stock === 0 ? `${p.name} sold out` : `Add ${p.name} to cart`}
                    >
                      {p.stock === 0 ? 'Sold out' : 'Add to cart'}
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
