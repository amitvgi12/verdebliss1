/**
 * ProductImage.jsx
 *
 * Renders the canonical product-bottle image (serum.png) with:
 *  - an ingredient-themed gradient background
 *  - the VerdeBliss logo overlaid bottom-left
 *
 * When you have individual product photos, set product.image_url in Supabase
 * and this component will use that instead of the fallback serum shot.
 *
 * Logo placement answer:
 *   Place logo.png at  /public/images/logo.png
 *   It is referenced here as  /images/logo.png  (Vite serves /public at root)
 */

// Ingredient → warm gradient mapping so every product feels distinct
const INGREDIENT_GRADIENTS = {
  'Bakuchiol':    'linear-gradient(145deg, #c8e6c0 0%, #a5d6a7 60%, #81c784 100%)',
  'Rose Hip':     'linear-gradient(145deg, #fce4ec 0%, #f8bbd0 60%, #f48fb1 100%)',
  'Green Tea':    'linear-gradient(145deg, #dcedc8 0%, #c5e1a5 60%, #aed581 100%)',
  'Turmeric':     'linear-gradient(145deg, #fff9c4 0%, #fff176 60%, #ffee58 100%)',
  'Zinc Oxide':   'linear-gradient(145deg, #e3f2fd 0%, #bbdefb 60%, #90caf9 100%)',
  'Acai Berry':   'linear-gradient(145deg, #ede7f6 0%, #d1c4e9 60%, #b39ddb 100%)',
  'Niacinamide':  'linear-gradient(145deg, #e0f7fa 0%, #b2ebf2 60%, #80deea 100%)',
  'Shea Butter':  'linear-gradient(145deg, #fff3e0 0%, #ffe0b2 60%, #ffcc80 100%)',
}

const DEFAULT_GRADIENT = 'linear-gradient(145deg, #EAF0E8 0%, #c8dbc6 100%)'

export default function ProductImage({ product, height = 220 }) {
  /* Use per-product image_url from Supabase when available, else shared serum.png */
  const imgSrc = product.image_url ?? '/images/products/serum.png'
  const bg     = INGREDIENT_GRADIENTS[product.ingredient] ?? DEFAULT_GRADIENT

  return (
    <div
      style={{
        position: 'relative',
        height,
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Product photo */}
      <img
        src={imgSrc}
        alt={product.name}
        loading="lazy"
        style={{
          height: '90%',
          width: 'auto',
          objectFit: 'contain',
          filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.18))',
          transition: 'transform 0.35s ease',
        }}
        /* Slight zoom on card hover — parent sets the transform via CSS class */
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.06)' }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
      />

      {/* VerdeBliss logo watermark — bottom-left */}
      <img
        src="/images/logo.png"
        alt="VerdeBliss"
        aria-hidden="true"          /* decorative — screen readers skip */
        style={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          height: 32,
          width: 'auto',
          opacity: 0.7,
          filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.2))',
          pointerEvents: 'none',    /* never intercepts clicks */
        }}
      />
    </div>
  )
}
