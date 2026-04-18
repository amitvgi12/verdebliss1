/**
 * BlogPost.jsx — /blog/:slug
 * Renders individual SEO articles with JSON-LD Article schema.
 * Each article is a long-form educational piece targeting organic skincare keywords.
 */
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Clock, Calendar } from 'lucide-react'
import { useSEO } from '@/hooks/useSEO'
import { C, FONT } from '@/constants/theme'

/* ── Article content ──────────────────────────────── */
const ARTICLES = {
  'bakuchiol-vs-retinol': {
    title: 'Bakuchiol vs Retinol: Which Is Right for Your Skin?',
    description: 'Bakuchiol vs retinol — a complete comparison of the plant-based alternative to retinol. Which works better for sensitive skin? We break down the science.',
    category: 'Ingredient Science',
    date: '12 March 2026',
    readTime: 6,
    image: '/images/ingredients/bakuchiol.png',
    sections: [
      {
        heading: 'What Is Retinol — and Why Is It Famous?',
        body: 'Retinol is a derivative of Vitamin A and one of the most clinically validated skincare ingredients ever studied. It accelerates cell turnover, stimulates collagen production, and visibly reduces fine lines, wrinkles, and hyperpigmentation. Decades of peer-reviewed research back it up.\n\nThe problem? Retinol is also one of the most irritating ingredients on the shelf. Redness, peeling, sun sensitivity, and the dreaded "retinol uglies" (the purging phase that can last weeks) keep millions of people from ever benefiting from it. Pregnant women must avoid it entirely. For Indian skin — already managing high UV exposure, humidity, and pollution — retinol\'s sensitivity to sunlight creates an additional layer of risk.',
      },
      {
        heading: 'Enter Bakuchiol: The Plant-Based Game-Changer',
        body: 'Bakuchiol is extracted from the seeds and leaves of Psoralea corylifolia — a plant used in Ayurvedic medicine for over 3,000 years. Modern science has caught up with tradition: a 2019 double-blind study in the British Journal of Dermatology found that bakuchiol performed comparably to retinol in reducing wrinkles and hyperpigmentation after 12 weeks, with significantly less irritation.\n\nUnlike retinol, bakuchiol is photostable — it does not degrade in sunlight, meaning you can safely use it in your morning routine. It is also safe for use during pregnancy and suitable for the most sensitive skin types.',
      },
      {
        heading: 'Side-by-Side Comparison',
        body: 'Cell renewal: Both ingredients stimulate cell turnover at similar rates.\n\nCollagen: Both have been shown to upregulate Type I collagen synthesis.\n\nIrritation: Retinol causes irritation in the majority of new users. Bakuchiol causes minimal to none.\n\nSun sensitivity: Retinol is photosensitive — always PM use only. Bakuchiol is photostable — safe AM or PM.\n\nPregnancy: Retinol is contraindicated. Bakuchiol is considered safe.\n\nResults timeline: Retinol typically 4–6 weeks. Bakuchiol typically 8–12 weeks.',
      },
      {
        heading: 'Which Should You Choose?',
        body: 'If you have resilient, oily skin, a strong skin barrier, and are committed to a strict sun protection regime, pharmaceutical-grade retinol delivers the most clinically proven results.\n\nIf you have sensitive, dry, or reactive skin — or if you live in a sunny climate like most of India — bakuchiol is the smarter, gentler, and safer long-term investment. You can use it morning and night without worry.\n\nOur Bakuchiol Renewal Serum is formulated with 1% bakuchiol — the concentration shown effective in clinical studies — alongside jojoba oil and hyaluronic acid to amplify hydration alongside renewal.',
      },
    ],
  },

  'skincare-routine-dry-skin': {
    title: 'The Complete Skincare Routine for Dry Skin (Organic Edition)',
    description: 'A complete 6-step organic skincare routine for dry skin. Dermatologist-approved layering order, best ingredients, and product recommendations.',
    category: 'Skin Routines',
    date: '4 April 2026',
    readTime: 8,
    image: '/images/ingredients/shea.png',
    sections: [
      {
        heading: 'Understanding Dry Skin: It\'s Not Just Dehydration',
        body: 'Dry skin (also called xerosis) is a skin type characterised by a compromised lipid barrier — meaning your skin lacks the natural oils that prevent water from evaporating. This is different from dehydration, which is a temporary condition any skin type can experience.\n\nThe root cause matters because the fix is different. Dry skin needs lipids (oils, butters, ceramides) to rebuild the barrier. Dehydrated skin needs humectants (hyaluronic acid, glycerin) to draw water in. Most dry-skin sufferers need both.',
      },
      {
        heading: 'The 6-Step Morning Routine',
        body: 'Step 1 — Gentle Cleanser: Use a low-foam, cream-based cleanser. Avoid sulphates (SLS, SLES) which strip lipids. Our Turmeric Brightening Cleanser uses coco-glucoside — a gentle plant-derived surfactant.\n\nStep 2 — Toner (Optional): If you use one, choose an alcohol-free, hydrating toner with glycerin or rose water. Apply while skin is still damp.\n\nStep 3 — Serum: Apply a hyaluronic acid or bakuchiol serum to damp skin. The moisture-binding ingredients work best when they have something to draw into the skin.\n\nStep 4 — Eye Cream: Tap gently around the orbital bone. Never drag.\n\nStep 5 — Moisturiser: Apply a rich cream or balm while skin is still slightly damp from serum. Our Rose Hip Glow Moisturiser with ceramides seals moisture in.\n\nStep 6 — SPF 50+: Non-negotiable. Our Botanical SPF 50 Shield uses zinc oxide — the gentlest, most reef-safe mineral filter available.',
      },
      {
        heading: 'The Evening Routine',
        body: 'Evening is your skin\'s repair window — cell turnover peaks between 11pm and 4am, making this the ideal time for active ingredients.\n\nDouble cleanse if you wore SPF or makeup: oil cleanser first, then gentle cleanser.\n\nApply bakuchiol serum — safe for PM use unlike retinol.\n\nFollow with a nourishing night cream. Our Shea Butter Night Cream uses unrefined shea butter and vitamin E to deeply repair the lipid barrier while you sleep.\n\nSkip the eye cream if it causes milia (small white bumps). In that case, a thin layer of your regular moisturiser is sufficient.',
      },
      {
        heading: 'The Ingredients Dry Skin Must Have',
        body: 'Ceramides: These lipid molecules make up 50% of the skin barrier. Look for ceramide NP, AP, and EOP on ingredient labels.\n\nShea Butter: Rich in oleic and stearic acids — the exact lipid profile your dry skin is missing.\n\nSqualane: A lightweight lipid that absorbs instantly without greasiness. Derived from olive or sugarcane (never shark liver — ensure your product specifies plant-derived).\n\nNiacinamide: A multitasker that strengthens the barrier AND reduces redness and uneven tone.\n\nRosehip Oil: Contains trans-retinoic acid (a natural form of vitamin A) alongside linoleic acid — both critical for dry skin recovery.',
      },
    ],
  },

  'organic-skincare-india': {
    title: 'Why Organic Skincare Is the Smartest Choice for Indian Skin',
    description: 'Indian skin faces unique challenges — UV, humidity, pollution. Learn why certified organic skincare outperforms conventional products and how to read labels.',
    category: 'Education',
    date: '18 April 2026',
    readTime: 7,
    image: '/images/ingredients/turmeric.png',
    sections: [
      {
        heading: 'What Makes Indian Skin Unique',
        body: 'India spans multiple climate zones — from the arid Rajasthan desert to the humid Kerala coast to the high-altitude UV intensity of the Himalayas. Most Indian cities rank in the world\'s top 20 for air pollution. The combination of high UV indices year-round, high particulate matter in the air, and frequent humidity swings creates a unique set of skin challenges:\n\nHyperpigmentation: UV exposure triggers melanin overproduction in Fitzpatrick types IV–VI, which represent most Indian skin. Post-inflammatory hyperpigmentation (PIH) after acne is also far more prevalent.\n\nOily T-zone with dry cheeks: The classic combination skin pattern is extremely common in Indian climates.\n\nBarrier sensitivity: Frequent use of harsh conventional products combined with hard water damages the lipid barrier over time.',
      },
      {
        heading: 'The Problem with Conventional Skincare',
        body: 'Conventional skincare — including many mass-market brands sold in India — commonly contains ingredients that exacerbate these concerns:\n\nParabens and sulphates disrupt the skin microbiome, leaving the barrier more vulnerable to pollution.\n\nSynthetic fragrances are the number-one cause of contact dermatitis — and are present in the majority of conventional products.\n\nHydroquinone, a common skin-lightening agent, is banned in the EU and under review in India due to links with ochronosis (a form of darkening) with long-term use.\n\nPetroleum-derived ingredients (mineral oil, petrolatum) feel moisturising but create an occlusive film that can trap bacteria and pollution particles against the skin.',
      },
      {
        heading: 'How to Read an Ingredient Label',
        body: 'INCI (International Nomenclature of Cosmetic Ingredients) lists all ingredients in descending order of concentration. The first five ingredients make up the majority of the product.\n\nGreen flags: Aqua (water), plant-derived oils (Rosa Canina — rosehip; Butyrospermum Parkii — shea), hyaluronic acid, ceramides, niacinamide.\n\nRed flags: Parfum/Fragrance (hidden synthetic chemicals), PEG compounds, DMDM Hydantoin (formaldehyde releaser), Ethylhexyl Methoxycinnamate (synthetic UV filter with endocrine disruption concerns).\n\nCertification seals to look for: USDA Organic, Ecocert COSMOS Organic, BDIH. These require at least 95% natural ingredients and prohibit most synthetics.',
      },
      {
        heading: 'The Indian Ingredients with Science Behind Them',
        body: 'India\'s botanical pharmacopoeia is arguably the richest in the world. Here are the ingredients where traditional Ayurvedic knowledge now has peer-reviewed clinical evidence:\n\nTurmeric (Curcuma longa): Curcumin has been shown in multiple studies to inhibit melanogenesis (pigment production) and reduce oxidative stress. It is more effective as a topical agent at low concentrations (0.1–0.5%) than at high ones, which explains why raw turmeric masks often cause staining without delivering clinical benefit.\n\nNeem: Azadirachtin from neem leaves shows significant activity against Cutibacterium acnes — the bacteria associated with acne.\n\nSandalwood (Santalum album): Santalol binds to olfactory receptors in skin cells, stimulating keratinocyte proliferation and wound healing. Clinical studies show a measurable reduction in fine lines.\n\nAmla (Indian gooseberry): One of the highest natural sources of Vitamin C. More stable than synthetic ascorbic acid due to accompanying tannins.',
      },
    ],
  },
}

export default function BlogPost() {
  const { slug } = useParams()
  const navigate  = useNavigate()
  const article   = ARTICLES[slug]

  useSEO(
    article
      ? {
          title: article.title,
          description: article.description,
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: article.title,
            description: article.description,
            datePublished: article.date,
            author: { '@type': 'Organization', name: 'VerdeBliss' },
            publisher: {
              '@type': 'Organization',
              name: 'VerdeBliss',
              logo: { '@type': 'ImageObject', url: 'https://verdebliss.vercel.app/images/logo.png' },
            },
            image: `https://verdebliss.vercel.app${article.image}`,
            url: `https://verdebliss.vercel.app/blog/${slug}`,
          },
        }
      : { title: 'Article Not Found' }
  )

  if (!article) return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '0 24px' }}>
      <div style={{ fontSize: 48 }}>🌿</div>
      <div style={{ fontFamily: FONT.serif, fontSize: 22, color: C.muted }}>Article not found</div>
      <button onClick={() => navigate('/blog')} style={{ background: C.forest, color: 'white', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
        Back to Journal
      </button>
    </div>
  )

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{ background: C.forest, padding: '56px 16px 48px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <button onClick={() => navigate('/blog')}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit', marginBottom: 24, padding: 0 }}>
            <ArrowLeft size={13} /> Back to Journal
          </button>
          <div style={{ fontSize: 10, color: C.sage, letterSpacing: '0.14em', fontWeight: 600, marginBottom: 14 }}>
            {article.category.toUpperCase()}
          </div>
          <h1 style={{ fontFamily: FONT.serif, fontSize: 'clamp(26px,4vw,44px)', color: 'white', fontWeight: 400, lineHeight: 1.2, margin: '0 0 20px' }}>
            {article.title}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={12} /> {article.date}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={12} /> {article.readTime} min read</span>
          </div>
        </div>
      </div>

      {/* Cover image */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 16px' }}>
        <div style={{ height: 300, borderRadius: '0 0 20px 20px', overflow: 'hidden', background: C.ivory }}>
          <img src={article.image} alt={article.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        </div>
      </div>

      {/* Article body */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 16px 80px' }}>
        {article.sections.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            style={{ marginBottom: 40 }}
          >
            <h2 style={{ fontFamily: FONT.serif, fontSize: 'clamp(18px,2.5vw,24px)', color: C.text, fontWeight: 400, marginBottom: 14, lineHeight: 1.3 }}>
              {s.heading}
            </h2>
            {s.body.split('\n\n').map((para, j) => (
              <p key={j} style={{ fontSize: 15, color: C.muted, lineHeight: 1.85, marginBottom: 14 }}>
                {para}
              </p>
            ))}
          </motion.div>
        ))}

        {/* CTA */}
        <div style={{ marginTop: 56, padding: 32, background: C.sagePale, borderRadius: 20, textAlign: 'center' }}>
          <div style={{ fontFamily: FONT.serif, fontSize: 22, color: C.forest, marginBottom: 10 }}>
            Ready to start your organic ritual?
          </div>
          <p style={{ fontSize: 14, color: C.muted, marginBottom: 24 }}>
            Every VerdeBliss product is formulated with the ingredients discussed in this article.
          </p>
          <button onClick={() => navigate('/products')}
            style={{ background: C.forest, color: 'white', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Shop the Collection <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
