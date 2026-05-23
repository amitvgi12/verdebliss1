import Image from 'next/image'

const IMAGE_MAP: Record<string, string> = {
  Bakuchiol: '/images/ingredients/bakuchiol.webp',
  'Rose Hip': '/images/ingredients/rose_hip.webp',
  'Green Tea': '/images/ingredients/greentealeaves.webp',
  Turmeric: '/images/ingredients/turmeric.webp',
  'Zinc Oxide': '/images/ingredients/zinc.webp',
  'Acai Berry': '/images/ingredients/blueberries.webp',
  Niacinamide: '/images/ingredients/niacinamide.webp',
  'Shea Butter': '/images/ingredients/shea.webp',
}

const BG_MAP: Record<string, string> = {
  Bakuchiol: '#EAF4EB',
  'Rose Hip': '#FDE8EF',
  'Green Tea': '#E8F5E9',
  Turmeric: '#FFFDE7',
  'Zinc Oxide': '#E3F2FD',
  'Acai Berry': '#F3E5F5',
  Niacinamide: '#E0F7FA',
  'Shea Butter': '#FFF8E1',
}

export default function IngredientCard({
  ingredient,
  description = '',
  imageHeight = 160,
}: {
  ingredient: string
  description?: string
  imageHeight?: number
}) {
  const src = IMAGE_MAP[ingredient]
  const bg = BG_MAP[ingredient] ?? '#EAF0E8' /* sagePale */

  return (
    <div className="ingredient-card group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(0,0,0,0.09)]">
      <div
        className="relative flex flex-shrink-0 items-center justify-center overflow-hidden"
        style={{ height: imageHeight, background: bg }}
      >
        {src ? (
          <Image
            src={src}
            alt={ingredient}
            fill
            sizes="(max-width: 640px) 45vw, 220px"
            className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.06]"
          />
        ) : (
          <div className="text-center opacity-50">
            <div className="mb-1.5 text-5xl">🌿</div>
            <div className="text-[11px] text-muted">Image coming soon</div>
          </div>
        )}
      </div>

      {(ingredient || description) && (
        <div className="ingredient-card__body px-5 py-5 text-center">
          {ingredient && (
            <h3
              className={`font-serif text-[16px] font-bold leading-snug text-text ${description ? 'mb-2.5' : ''}`}
            >
              {ingredient}
            </h3>
          )}
          {description && <p className="text-[12.5px] leading-[1.7] text-muted">{description}</p>}
        </div>
      )}
    </div>
  )
}
