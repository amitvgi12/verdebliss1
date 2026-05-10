'use client'
/**
 * Products.tsx — Filterable product catalogue.
 * Reads ?cat=, ?skin=, ?sort= from URL via useSearchParams so footer links
 * like /products?cat=Serum work without client routing.
 */
import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import ProductCard from '@/components/ui/ProductCard'
import SkeletonCard from '@/components/ui/SkeletonCard'
import { useProducts } from '@/hooks/useProducts'
import { CATEGORIES, SKIN_TYPES, SORT_OPTIONS } from '@/constants/products'

export default function ProductsClient() {
  const params = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const category = params.get('cat') ?? 'All'
  const skinType = params.get('skin') ?? 'All'
  const sortBy = params.get('sort') ?? 'Bestselling'

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (!value || value === 'All') next.delete(key)
    else next.set(key, value)

    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  const clearFilters = () => {
    router.replace(pathname, { scroll: false })
  }

  const { products, loading } = useProducts({ category, skinType, sortBy })

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [category])

  return (
    <div className="min-h-[80vh] bg-bg">
      <div className="bg-forest px-4 pb-[60px] pt-12">
        <div className="container-content">
          <p className="mb-2 text-[10px] font-semibold tracking-[0.14em] text-sage">THE BOUTIQUE</p>
          <h1 className="m-0 font-serif text-[clamp(32px,5vw,48px)] font-normal text-white">
            {category !== 'All' ? `${category}s` : 'Shop All Products'}
          </h1>
        </div>
      </div>

      <div className="mx-auto -mt-6 max-w-[1200px] px-4 pb-20">
        <div className="grid grid-cols-1 items-start gap-7 md:grid-cols-[clamp(140px,18%,220px)_1fr]">
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
                onClick={clearFilters}
                className="mt-4 w-full cursor-pointer rounded-lg border border-border bg-transparent px-2 py-2 text-xs text-muted hover:bg-bg"
              >
                Clear Filters
              </button>
            )}
          </aside>

          <div className="mt-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2.5">
              <div className="text-[13px] text-muted">{products.length} products</div>
              <div className="flex flex-wrap gap-1.5">
                {SORT_OPTIONS.map((s) => (
                  <button
                    key={s}
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

            <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                : products.map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.04, 0.4) }}
                    >
                      <ProductCard product={p} />
                    </motion.div>
                  ))}
            </div>

            {!loading && products.length === 0 && (
              <div className="py-20 text-center">
                <div className="mb-3 text-5xl" aria-hidden>
                  🌿
                </div>
                <div className="font-serif text-xl text-muted">No products match your filters</div>
                <button
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
