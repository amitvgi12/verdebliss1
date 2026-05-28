'use client'
/**
 * QuizClient.jsx — Skin Quiz / Recommendation Engine
 *
 * 5 questions:
 *   1. Skin type
 *   2. Primary concern
 *   3. Age range
 *   4. Sensitivity level
 *   5. Budget
 *
 * Maps answers to VerdeBliss product set + offers 10% bundle discount.
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowRight, ArrowLeft, Check, ShoppingBag } from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import { useCartStore } from '@/store/cartStore'
import ProductCard from '@/components/ui/ProductCard'
import { C, FONT } from '@/constants/theme'
import type { Product } from '@/types'

const QUESTIONS = [
  {
    id: 'skin_type',
    label: 'What is your skin type?',
    help: 'Pick the option that best matches your skin most days.',
    options: [
      { value: 'Dry', label: 'Dry', desc: 'Tight, flaky, often dehydrated' },
      { value: 'Oily', label: 'Oily', desc: 'Shiny T-zone, enlarged pores' },
      { value: 'Combination', label: 'Combination', desc: 'Oily T-zone, normal/dry cheeks' },
      { value: 'Sensitive', label: 'Sensitive', desc: 'Reacts easily, redness-prone' },
      { value: 'Normal', label: 'Normal', desc: 'Balanced, no major concerns' },
    ],
  },
  {
    id: 'concern',
    label: 'What is your primary concern?',
    help: 'You can address other concerns once your routine is set.',
    options: [
      { value: 'Anti-Ageing', label: 'Fine lines & ageing', desc: 'Plumper, firmer skin' },
      { value: 'Brightening', label: 'Dullness', desc: 'Glow & even tone' },
      { value: 'Acne', label: 'Breakouts', desc: 'Clear pores, less oil' },
      { value: 'Hydration', label: 'Hydration', desc: 'Moisture & barrier support' },
      { value: 'Pigmentation', label: 'Pigmentation', desc: 'Dark spots & melasma' },
    ],
  },
  {
    id: 'age',
    label: 'What is your age range?',
    help: 'This helps us pick age-appropriate ingredients.',
    options: [
      { value: 'under_25', label: 'Under 25', desc: 'Prevention focus' },
      { value: '25_35', label: '25 – 35', desc: 'Early prevention' },
      { value: '35_45', label: '35 – 45', desc: 'Targeted ageing' },
      { value: 'over_45', label: 'Over 45', desc: 'Mature skin care' },
    ],
  },
  {
    id: 'sensitivity',
    label: 'How sensitive is your skin?',
    options: [
      { value: 'low', label: 'Low', desc: 'Tolerates most products' },
      { value: 'med', label: 'Medium', desc: 'Occasional reactions' },
      { value: 'high', label: 'High', desc: 'Easily irritated' },
    ],
  },
  {
    id: 'budget',
    label: 'What is your monthly skincare budget?',
    options: [
      { value: 'under_3k', label: 'Under ₹3,000', desc: 'Essentials only' },
      { value: '3k_6k', label: '₹3,000 – ₹6,000', desc: 'Core 3-step routine' },
      { value: '6k_plus', label: 'Over ₹6,000', desc: 'Full ritual' },
    ],
  },
]

const PRODUCT_TARGETS = {
  bakuchiol: { id: '1', name: 'Bakuchiol Renewal Serum' },
  roseHip: { id: '2', name: 'Rose Hip Glow Moisturiser' },
  toner: { id: '3', name: 'Green Tea Clarity Toner' },
  cleanser: { id: '4', name: 'Turmeric Brightening Cleanser' },
  spf: { id: '5', name: 'Botanical Mineral Sun Shield' },
  lip: { id: '6', name: 'Wild Berry Lip Elixir' },
  niacinamide: { id: '7', name: 'Niacinamide Pore Serum' },
  nightCream: { id: '8', name: 'Shea Butter Night Cream' },
} as const

type ProductTargetKey = keyof typeof PRODUCT_TARGETS

/**
 * Recommendation logic — maps answers to product IDs.
 * Always includes: cleanser + moisturiser + SPF (universal essentials).
 * Adds targeted treatments based on concern + age + skin type.
 */
function findCatalogProduct(catalog: Product[], targetKey: ProductTargetKey): Product | undefined {
  const target = PRODUCT_TARGETS[targetKey]
  return (
    catalog.find((p) => String(p.id) === target.id) ||
    catalog.find((p) => p.slug === target.name.toLowerCase().replaceAll(' ', '-')) ||
    catalog.find((p) => p.name === target.name)
  )
}

function getRecommendationReason(product: Product, answers: Record<string, string>): string {
  const name = product.name
  const concern = answers.concern?.toLowerCase() ?? ''
  const skinType = answers.skin_type?.toLowerCase() ?? ''
  const age = answers.age ?? ''

  if (/bakuchiol/i.test(name)) {
    if (concern === 'anti-ageing' || age === 'over_45' || age === '35_45')
      return 'Bakuchiol retinol-alternative — matched to your anti-ageing concern.'
    return 'Bakuchiol renewal — chosen for brightening and glow concern.'
  }
  if (/niacinamide/i.test(name)) {
    if (concern === 'acne') return 'Pore-refining niacinamide — directly targets your acne concern.'
    return 'Niacinamide serum — supports oil balance for your skin type.'
  }
  if (/rose hip/i.test(name)) {
    if (skinType === 'dry') return 'Rose hip moisturiser — hydrating choice for dry skin.'
    return 'Rose hip moisturiser — nourishing barrier support for sensitive skin.'
  }
  if (/toner/i.test(name))
    return 'Green tea toner — balancing step suited to oily and combination skin.'
  if (/cleanser/i.test(name)) return 'Daily cleanser — every routine starts here.'
  if (/spf/i.test(name)) return 'Mineral SPF — the most important morning step for any concern.'
  if (/lip/i.test(name)) return 'Botanical lip care — daily essential in every routine.'
  if (/night cream/i.test(name))
    return 'Overnight recovery cream — added for your age range and budget.'
  return 'Recommended for your skin profile.'
}

function recommend(answers: Record<string, string>, catalog: Product[]): Product[] {
  const set = new Set<ProductTargetKey>()

  // Universal essentials
  set.add('cleanser')

  // SPF — always
  set.add('spf')

  // Moisturiser by skin type
  if (['Dry', 'Sensitive'].includes(answers.skin_type)) set.add('roseHip')
  if (['Oily', 'Combination'].includes(answers.skin_type)) set.add('toner')

  // Concern-driven serum
  if (answers.concern === 'Anti-Ageing' || answers.age === 'over_45' || answers.age === '35_45') {
    set.add('bakuchiol')
    if (answers.budget !== 'under_3k') set.add('nightCream')
  }
  if (answers.concern === 'Acne' || answers.skin_type === 'Oily') set.add('niacinamide')
  if (answers.concern === 'Brightening' || answers.concern === 'Pigmentation') set.add('bakuchiol')
  if (answers.concern === 'Hydration') set.add('roseHip')

  // Lip — always nice
  set.add('lip')

  // Budget cap
  let products = Array.from(set)
    .map((id) => findCatalogProduct(catalog, id))
    .filter((product): product is Product => Boolean(product))

  if (answers.budget === 'under_3k') {
    products = products.slice(0, 3)
  } else if (answers.budget === '3k_6k') {
    products = products.slice(0, 5)
  }

  return products
}

export default function QuizClient() {
  const { products: catalog } = useProducts({ sortBy: 'Bestselling' })
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)

  const [step, setStep] = useState(0) // 0..QUESTIONS.length-1
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [done, setDone] = useState(false)

  const q = QUESTIONS[step]
  const isLast = step === QUESTIONS.length - 1

  function pick(qid: string, value: string) {
    setAnswers((a) => ({ ...a, [qid]: value }))
    if (step < QUESTIONS.length - 1) {
      setTimeout(() => setStep(step + 1), 220)
    }
  }

  function finish() {
    setDone(true)
  }

  function addBundleToCart() {
    const products = recommend(answers, catalog)
    if (!products.length) return
    products.forEach((p) => addItem(p))
    openCart()
  }

  /* ── Result screen ────────────────────────────────────────── */
  if (done) {
    const products = recommend(answers, catalog)
    const hasCurrentCatalogue = products.length > 0
    const subtotal = products.reduce((s, p) => s + p.price, 0)
    const bundle = Math.round(subtotal * 0.9)

    return (
      <div style={{ background: C.bg, minHeight: '100vh' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 16px 64px' }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', marginBottom: 40 }}
          >
            <Sparkles size={36} color={C.goldText} style={{ margin: '0 auto 12px' }} />
            <div
              style={{
                fontSize: 11,
                color: C.goldText,
                letterSpacing: '0.16em',
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              YOUR PERSONAL ROUTINE
            </div>
            <h1
              style={{
                fontFamily: FONT.serif,
                fontSize: 'clamp(28px, 5vw, 42px)',
                color: C.text,
                fontWeight: 400,
                lineHeight: 1.1,
                marginBottom: 12,
              }}
            >
              Curated for {answers.skin_type?.toLowerCase()} skin
            </h1>
            <p
              style={{
                fontSize: 14,
                color: C.muted,
                maxWidth: 540,
                margin: '0 auto',
                lineHeight: 1.7,
              }}
            >
              Based on your {answers.concern?.toLowerCase()} concern and {answers.sensitivity}{' '}
              sensitivity. Save 10% when you bundle the full routine.
            </p>
          </motion.div>

          {/* Products grid */}
          {hasCurrentCatalogue ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 16,
                marginBottom: 32,
              }}
            >
              {products.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="quiz-result-card"
                >
                  <ProductCard product={p} />
                  <p className="quiz-reason-pill">
                    <span aria-hidden>✦ </span>
                    {getRecommendationReason(p, answers)}
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div
              role="status"
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                color: C.muted,
                fontSize: 14,
                lineHeight: 1.6,
                marginBottom: 32,
                padding: 24,
                textAlign: 'center',
              }}
            >
              Current catalogue prices are temporarily unavailable.
            </div>
          )}

          {/* Bundle CTA */}
          <div
            style={{
              background: `linear-gradient(135deg, ${C.forest}, #3D6344)`,
              borderRadius: 20,
              padding: '32px 28px',
              textAlign: 'center',
              color: 'white',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 6,
              }}
            >
              <Sparkles size={16} color={C.goldPale} />
              <span
                style={{
                  fontSize: 11,
                  color: C.goldPale,
                  letterSpacing: '0.14em',
                  fontWeight: 700,
                }}
              >
                BUNDLE & SAVE
              </span>
            </div>
            <h2 style={{ fontFamily: FONT.serif, fontSize: 26, fontWeight: 400, marginBottom: 12 }}>
              Get your full ritual
            </h2>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'center',
                gap: 12,
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: 32, fontWeight: 700, fontFamily: FONT.serif }}>
                ₹{bundle.toLocaleString()}
              </span>
              <span style={{ fontSize: 16, opacity: 0.6, textDecoration: 'line-through' }}>
                ₹{subtotal.toLocaleString()}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  background: C.goldText,
                  color: 'white',
                  padding: '3px 10px',
                  borderRadius: 99,
                }}
              >
                SAVE 10%
              </span>
            </div>
            <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 20 }}>
              Free shipping included · Earn {Math.floor(bundle / 10)} loyalty points
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={addBundleToCart}
                disabled={!hasCurrentCatalogue}
                style={{
                  background: C.goldText,
                  color: 'white',
                  border: 'none',
                  borderRadius: 12,
                  padding: '13px 24px',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: hasCurrentCatalogue ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  opacity: hasCurrentCatalogue ? 1 : 0.6,
                }}
              >
                <ShoppingBag size={15} /> Add Routine to Cart
              </button>
              <button
                onClick={() => {
                  setDone(false)
                  setStep(0)
                  setAnswers({})
                }}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 12,
                  padding: '13px 24px',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Retake Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── Quiz screen ──────────────────────────────────────────── */
  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px 64px' }}>
        {/* Progress */}
        <div
          style={{ marginBottom: 32 }}
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={QUESTIONS.length}
          aria-label={`Question ${step + 1} of ${QUESTIONS.length}`}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 11, color: C.muted, letterSpacing: '0.1em', fontWeight: 600 }}>
              QUESTION {step + 1} OF {QUESTIONS.length}
            </span>
            <span style={{ fontSize: 11, color: C.goldText, fontWeight: 700 }}>
              {Math.round(((step + 1) / QUESTIONS.length) * 100)}%
            </span>
          </div>
          <div style={{ height: 4, background: C.ivory, borderRadius: 2, overflow: 'hidden' }}>
            <motion.div
              animate={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }}
              style={{ height: '100%', background: C.gold, borderRadius: 2 }}
            />
          </div>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2
              id={`quiz-q-${step}`}
              style={{
                fontFamily: FONT.serif,
                fontSize: 'clamp(24px, 4vw, 32px)',
                color: C.text,
                fontWeight: 400,
                lineHeight: 1.2,
                marginBottom: 8,
              }}
            >
              {q.label}
            </h2>
            {q.help && (
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 28 }}>
                {q.help}
              </p>
            )}

            <div
              role="radiogroup"
              aria-labelledby={`quiz-q-${step}`}
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              {q.options.map((opt) => {
                const selected = answers[q.id] === opt.value
                return (
                  <button
                    key={opt.value}
                    role="radio"
                    aria-checked={selected}
                    onClick={() => pick(q.id, opt.value)}
                    style={{
                      background: selected ? C.sagePale : C.card,
                      border: `2px solid ${selected ? C.forest : C.border}`,
                      borderRadius: 14,
                      padding: '14px 18px',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      transition: 'all 0.2s',
                    }}
                  >
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        border: `2px solid ${selected ? C.forest : C.border}`,
                        background: selected ? C.forest : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {selected && <Check size={12} color="white" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 2 }}
                      >
                        {opt.label}
                      </div>
                      {opt.desc && <div style={{ fontSize: 12, color: C.muted }}>{opt.desc}</div>}
                    </div>
                  </button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            style={{
              background: 'none',
              border: 'none',
              cursor: step === 0 ? 'default' : 'pointer',
              fontSize: 13,
              color: step === 0 ? C.light : C.muted,
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 0',
            }}
          >
            <ArrowLeft size={14} /> Back
          </button>

          {isLast && answers[q.id] && (
            <button
              onClick={finish}
              style={{
                background: C.forest,
                color: 'white',
                border: 'none',
                borderRadius: 12,
                padding: '12px 24px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              See My Routine <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
