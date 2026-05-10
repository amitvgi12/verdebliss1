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
}

export default function ProductsClient({
  products,
  totalProducts,
  category,
  skinType,
  sortBy,
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
  }, [category, skinType, sortBy])

  return (
    <div className="min-h-[80vh] bg-bg">
      <div className="bg-forest px-4 pb-[60px] pt-12">
        <div className="site-container">
          <p className="mb-2 text-[10px] font-semibold tracking-[0.14em] text-sage">THE BOUTIQUE</p>
          <h1 className="m-0 font-serif text-[clamp(32px,5vw,48px)] font-normal text-white">
            {category !== 'All' ? `${category}s` : 'Shop All Products'}
          </h1>
          <p className="mt-3 max-w-[560px] text-sm text-white/65">
            {totalProducts} botanically led formulas, server-rendered for fast browsing and honest
            product discovery.
          </p>
        </div>
      </div>

      <div className="site-container -mt-6 pb-20">
        <div className="grid grid-cols-1 items-start gap-7 md:grid-cols-[clamp(160px,20%,230px)_1fr]">
          <aside className="mt-6 rounded-2xl border border-border bg-card p-5 md:sticky md:top-[76px]">
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
              activeColor="text-terra"
              activeBg="bg-terraPale"
              activeBorder="border-l-terra"
              options={SKIN_TYPES}
              value={skinType}
              onChange={(v) => setFilter('skin', v)}
            />
            {(category !== 'All' || skinType !== 'All') && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 w-full cursor-pointer rounded-lg border border-border bg-transparent px-2 py-2 text-xs text-muted hover:bg-bg"
              >
                Clear Filters
              </button>
            )}
          </aside>

          <div className="mt-6 min-w-0">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2.5">
              <div className="text-[13px] text-muted" aria-live="polite">
                {products.length} product{products.length === 1 ? '' : 's'}
                {isPending ? ' · updating…' : ''}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SORT_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFilter('sort', s)}
                    className={`cursor-pointer whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition ${
                      sortBy === s
                        ? 'border-forest bg-forest text-white'
                        : 'border-border bg-ivory text-muted hover:border-forest/50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className={`product-grid transition-opacity ${isPending ? 'opacity-60' : ''}`}>
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
    <div className="mb-6 last:mb-0">
      <div className="mb-3 border-b border-gold/80 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-gold opacity-80">
        {label}
      </div>
      {options.map((opt) => {
        const active = value === opt
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`block w-full cursor-pointer rounded-r-md border-l-2 px-2.5 py-1.5 text-left text-[13px] transition ${
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
