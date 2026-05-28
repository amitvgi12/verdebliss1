'use client'

import ProductImage from '@/components/ui/ProductImage'
import type { Product } from '@/types'

type RoutineKind = 'AM' | 'PM'

interface Routine {
  label: string
  shortLabel: RoutineKind
  description: string
  products: Product[]
}

interface RoutineRecommendationsProps {
  products: Product[]
  current: Product
  onAddItem: (product: Product) => void
  onOpenCart: () => void
}

const ROUTINE_CATEGORIES: Record<RoutineKind, string[]> = {
  AM: ['Cleanser', 'Toner', 'Serum', 'SPF'],
  PM: ['Cleanser', 'Serum', 'Moisturiser'],
}

export default function RoutineRecommendations({
  products,
  current,
  onAddItem,
  onOpenCart,
}: RoutineRecommendationsProps) {
  const amRoutine = buildRoutine(products, current, 'AM')
  const pmRoutine = buildRoutine(products, current, 'PM')

  if (!amRoutine.products.length && !pmRoutine.products.length) return null

  return (
    <section className="ritual-recommendations" aria-label="Recommended routines">
      <div className="ritual-recommendations__head">
        <p>Recommended ritual</p>
        <h2>Build a complete routine around this product</h2>
        <span>Choose the morning or evening sequence that fits how you use this formula.</span>
      </div>
      <div className="ritual-routine-grid">
        <RoutinePreview routine={amRoutine} onAddItem={onAddItem} onOpenCart={onOpenCart} />
        <RoutinePreview routine={pmRoutine} onAddItem={onAddItem} onOpenCart={onOpenCart} />
      </div>
    </section>
  )
}

function uniqueProducts(products: Product[]) {
  return products.filter(
    (product, index, source) =>
      source.findIndex((candidate) => candidate.id === product.id) === index
  )
}

function overlapsSkinTypes(a?: string[], b?: string[]) {
  if (!a?.length || !b?.length) return false
  if (a.includes('All Types') || b.includes('All Types')) return true
  return a.some((skinType) => b.includes(skinType))
}

function pickRoutineProduct(products: Product[], current: Product, category: string) {
  // Never suggest the current product as its own companion — it reads as a bug
  // when the same product appears in both AM and PM cross-sell slots.
  // Skin-type affinity first, then any in-stock match.
  return (
    products.find(
      (product) =>
        product.id !== current.id &&
        product.category === category &&
        product.stock !== 0 &&
        overlapsSkinTypes(product.skin_types, current.skin_types)
    ) ??
    products.find(
      (product) => product.id !== current.id && product.category === category && product.stock !== 0
    )
  )
}

function buildRoutine(products: Product[], current: Product, kind: RoutineKind): Routine {
  const routineProducts = ROUTINE_CATEGORIES[kind]
    .map((category) => pickRoutineProduct(products, current, category))
    .filter((product): product is Product => Boolean(product))

  return {
    label: kind === 'AM' ? 'Complete your AM routine' : 'Complete your PM routine',
    shortLabel: kind,
    description:
      kind === 'AM'
        ? 'Cleanse, treat, and protect before the day starts.'
        : 'Cleanse, replenish, and seal in overnight recovery.',
    products: uniqueProducts(routineProducts),
  }
}

function RoutinePreview({
  routine,
  onAddItem,
  onOpenCart,
}: {
  routine: Routine
  onAddItem: (product: Product) => void
  onOpenCart: () => void
}) {
  const availableProducts = routine.products.filter((product) => product.stock !== 0)
  if (!availableProducts.length) return null
  const total = availableProducts.reduce((sum, product) => sum + Number(product.price), 0)

  return (
    <article className="ritual-preview">
      <div>
        <p>{routine.label}</p>
        <span>{routine.description}</span>
      </div>
      <ul>
        {availableProducts.map((product) => (
          <li key={product.id}>
            <ProductImage product={product} sizes="42px" />
            <span>{product.name}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="ritual-preview__button"
        onClick={() => {
          availableProducts.forEach(onAddItem)
          onOpenCart()
        }}
      >
        Add {routine.shortLabel} routine · ₹{total.toLocaleString()}
      </button>
    </article>
  )
}
