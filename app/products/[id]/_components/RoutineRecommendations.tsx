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

  const featuredRoutine =
    current.category === 'SPF' || current.category === 'Cleanser' ? amRoutine : pmRoutine
  const featuredBundle = uniqueProducts(featuredRoutine.products).filter(
    (product) => product.stock !== 0
  )
  const featuredBundleTotal = featuredBundle.reduce((sum, product) => sum + product.price, 0)

  return (
    <section className="ritual-recommendations" aria-label="Recommended routines">
      <div className="ritual-bundle">
        <div>
          <p>Recommended ritual bundle</p>
          <h2>{featuredRoutine.label}</h2>
          <span>{featuredRoutine.description}</span>
        </div>
        <div className="ritual-bundle__items">
          {featuredBundle.map((product) => (
            <div key={product.id} className="ritual-bundle__item">
              <ProductImage product={product} sizes="42px" />
              <span>{product.name}</span>
            </div>
          ))}
        </div>
        <button
          type="button"
          disabled={!featuredBundle.length}
          onClick={() => {
            featuredBundle.forEach(onAddItem)
            onOpenCart()
          }}
        >
          Add {featuredRoutine.shortLabel} bundle · ₹{featuredBundleTotal.toLocaleString()}
        </button>
      </div>

      <div className="ritual-routine-grid">
        <RoutinePreview routine={amRoutine} />
        <RoutinePreview routine={pmRoutine} />
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
  if (current.category === category) return current
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

function RoutinePreview({ routine }: { routine: Routine }) {
  if (!routine.products.length) return null

  return (
    <article className="ritual-preview">
      <div>
        <p>{routine.label}</p>
        <span>{routine.description}</span>
      </div>
      <ul>
        {routine.products.map((product) => (
          <li key={product.id}>
            <ProductImage product={product} sizes="42px" />
            <span>{product.name}</span>
          </li>
        ))}
      </ul>
    </article>
  )
}
