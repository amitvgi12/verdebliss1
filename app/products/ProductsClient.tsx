'use client'
/**
 * Client-side filter controls for the server-rendered product catalogue.
 *
 * The important SEO/performance rule: products are passed in as server-rendered
 * props from `app/products/page.tsx`; this component only mutates the URL and
 * renders client-side transitions. The first HTML response now contains the
 * actual product cards instead of the previous "0 products" shell.
 */
import { useEffect, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import ProductCard from '@/components/ui/ProductCard'
import { CATEGORIES, SKIN_TYPES, SORT_OPTIONS } from '@/constants/products'
import type { Product } from '@/types'

interface ProductsClientProps {
  products: Product[]
  totalProducts: number
  category: string
  skinType: string
  sortBy: string
  query: string
}

export default function ProductsClient({
  products,
  totalProducts,
  category,
  skinType,
  sortBy,
  query,
}: ProductsClientProps) {
  const params = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (!value || value === 'All') next.delete(key)
    else next.set(key, value)

    const query = next.toString()
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    })
  }

  const clearFilters = () => {
    startTransition(() => router.replace(pathname, { scroll: false }))
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [category, skinType, sortBy, query])

  return (
    <div className="min-h-[80vh] bg-bg">
      <div className="catalog-hero px-4">
        <div className="site-container catalog-hero__inner">
          <div>
            <p className="premium-kicker">THE VERDEBLISS BOUTIQUE</p>
            <h1>
              {query
                ? `Search results for "${query}"`
                : category !== 'All'
                  ? `${category}s`
                  : 'Shop All Products'}
            </h1>
            <p>
              {totalProducts} botanical formulas with transparent ingredients, clear skin-fit
              filters, and product-specific ritual guidance.
            </p>
          </div>
          <div className="catalog-hero__card">
            <span>FREE SHIPPING</span>
            <strong>On all orders above ₹499</strong>
          </div>
        </div>
      </div>

      <div className="site-container catalog-shell -mt-10">
        <div className="catalog-layout">
          <aside className="catalog-filter-panel mt-6 md:sticky md:top-[76px]">
            <FilterGroup
              label="CATEGORY"
              activeColor="text-forest"
              activeBg="bg-sagePale"
              activeBorder="border-l-forest"
              options={CATEGORIES}
              value={category}
              onChange={(v) => setFilter('cat', v)}
            />
            <FilterGroup
              label="SKIN TYPE"
              activeColor="text-text"
              activeBg="bg-terraPale"
              activeBorder="border-l-terra"
              options={SKIN_TYPES}
              value={skinType}
              onChange={(v) => setFilter('skin', v)}
            />
            {(category !== 'All' || skinType !== 'All' || query) && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 w-full cursor-pointer rounded-lg border border-border bg-transparent px-2 py-2 text-xs text-muted hover:bg-bg"
              >
                Clear Filters
              </button>
            )}
          </aside>

          <div className="catalog-results-panel mt-6 min-w-0">
            <div className="catalog-toolbar">
              <div className="catalog-count" aria-live="polite">
                {products.length} product{products.length === 1 ? '' : 's'}
                {isPending ? ' · updating…' : ''}
              </div>
              <div className="catalog-sort-group">
                {SORT_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFilter('sort', s)}
                    className={`catalog-sort-button ${
                      sortBy === s ? 'catalog-sort-button--active' : 'catalog-sort-button--idle'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className={`catalog-grid transition-opacity ${isPending ? 'opacity-60' : ''}`}>
              {products.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.035, 0.25) }}
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>

            {products.length === 0 && (
              <div className="py-20 text-center">
                <div className="mb-3 text-5xl" aria-hidden>
                  🌿
                </div>
                <div className="font-serif text-xl text-muted">No products match your filters</div>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 cursor-pointer rounded-[10px] border border-forest bg-transparent px-6 py-2.5 text-[13px] text-forest hover:bg-forest hover:text-white"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface FilterGroupProps {
  label: string
  options: readonly string[]
  value: string
  onChange: (value: string) => void
  activeColor: string
  activeBg: string
  activeBorder: string
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
  activeColor,
  activeBg,
  activeBorder,
}: FilterGroupProps) {
  return (
    <div className="catalog-filter-group last:mb-0">
      <div className="catalog-filter-label uppercase">{label}</div>
      {options.map((opt) => {
        const active = value === opt
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`catalog-filter-option block w-full cursor-pointer border-l-2 text-left transition ${
              active
                ? `${activeBorder} ${activeBg} ${activeColor} font-semibold`
                : 'border-l-transparent font-normal text-muted hover:bg-bg'
            }`}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}
