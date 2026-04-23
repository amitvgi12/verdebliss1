/**
 * BlogIndex.jsx — /blog
 * Education-led content hub. Three cornerstone SEO articles targeting
 * high-intent keywords for the Indian organic skincare market.
 */
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Clock } from 'lucide-react'
import { useSEO, PAGE_SEO } from '@/hooks/useSEO'
import { C, FONT } from '@/constants/theme'

const ARTICLES = [
  {
    slug: 'bakuchiol-vs-retinol',
    title: 'Bakuchiol vs Retinol: Which Is Right for Your Skin?',
    excerpt: 'Retinol has ruled anti-ageing for decades. But bakuchiol — the plant-based alternative — is changing everything. We break down the science, the differences, and which one wins for sensitive skin.',
    category: 'Ingredient Science',
    readTime: 6,
    image: '/images/ingredients/bakuchiol.webp',
    keywords: ['bakuchiol', 'retinol alternative', 'organic anti-ageing'],
  },
  {
    slug: 'skincare-routine-dry-skin',
    title: 'The Complete Skincare Routine for Dry Skin (Organic Edition)',
    excerpt: 'Dry skin needs more than just a heavy cream. The right layering order, the right ingredients, and the right timing make all the difference. Here\'s the dermatologist-approved organic routine.',
    category: 'Skin Routines',
    readTime: 8,
    image: '/images/ingredients/shea.webp',
    keywords: ['dry skin routine', 'organic skincare routine', 'moisturiser for dry skin'],
  },
  {
    slug: 'organic-skincare-india',
    title: 'Why Organic Skincare Is the Smartest Choice for Indian Skin',
    excerpt: 'Indian skin faces unique challenges — humidity, pollution, UV intensity. Discover why certified organic formulations outperform conventional alternatives and how to read ingredient labels like an expert.',
    category: 'Education',
    readTime: 7,
    image: '/images/ingredients/turmeric.webp',
    keywords: ['organic skincare India', 'Indian skin type', 'natural skincare benefits'],
  },
]

export default function BlogIndex() {
  useSEO(PAGE_SEO.blog)
  const navigate = useNavigate()

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: C.forest, padding: '64px 16px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: C.sage, letterSpacing: '0.16em', fontWeight: 600, marginBottom: 14 }}>
            THE VERDE JOURNAL
          </div>
          <h1 style={{ fontFamily: FONT.serif, fontSize: 'clamp(32px,5vw,56px)', color: 'white', fontWeight: 400, margin: '0 0 16px', lineHeight: 1.1 }}>
            Skincare Education
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, maxWidth: 520, margin: '0 auto', lineHeight: 1.75 }}>
            Ingredient science, skin rituals, and expert guides — because educated skin is healthy skin.
          </p>
        </div>
      </div>

      {/* Articles grid */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 16px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 28 }}>
          {ARTICLES.map((a, i) => (
            <motion.article
              key={a.slug}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => navigate(`/blog/${a.slug}`)}
              style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
            >
              {/* Image */}
              <div style={{ height: 200, background: C.ivory, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <img src={a.image} alt={a.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              </div>

              {/* Content */}
              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.terra, letterSpacing: '0.1em' }}>
                    {a.category.toUpperCase()}
                  </span>
                  <span style={{ color: C.border }}>·</span>
                  <span style={{ fontSize: 11, color: C.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={11} /> {a.readTime} min read
                  </span>
                </div>

                <h2 style={{ fontFamily: FONT.serif, fontSize: 20, color: C.text, fontWeight: 400, lineHeight: 1.3, margin: '0 0 12px' }}>
                  {a.title}
                </h2>

                <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, flex: 1, margin: '0 0 20px' }}>
                  {a.excerpt}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.gold, fontSize: 13, fontWeight: 600 }}>
                  Read article <ArrowRight size={14} />
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  )
}
