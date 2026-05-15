import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { StructuredData } from '@/lib/structured-data'

export const revalidate = 3600

interface ArticleSection {
  heading: string
  body: string
}

interface Article {
  title: string
  description: string
  category: string
  date: string
  readTime: number
  sections: ArticleSection[]
}

const ARTICLES: Record<string, Article> = {
  'bakuchiol-vs-retinol': {
    title: 'Bakuchiol vs Retinol: Which Is Right for Your Skin?',
    description:
      'A complete science-backed comparison of bakuchiol vs retinol. Which works better for sensitive skin in Indian climate?',
    category: 'Ingredient Science',
    date: 'April 2026',
    readTime: 6,
    sections: [
      {
        heading: 'The short answer',
        body: 'Bakuchiol and retinol target the same cellular pathways but reach them differently. Retinol is the established gold standard for collagen stimulation. Bakuchiol delivers comparable visible results without the irritation, photosensitivity, or pregnancy contraindications.',
      },
      {
        heading: 'What the studies say',
        body: 'A 2019 randomised study published in the British Journal of Dermatology compared 0.5% bakuchiol with 0.5% retinol over 12 weeks. Both groups showed significant reductions in wrinkle depth and hyperpigmentation. The retinol group reported significantly more scaling and stinging. Bakuchiol matched retinol on outcomes while losing the irritation tax.',
      },
      {
        heading: 'Which one for which skin',
        body: 'Sensitive, reactive, or rosacea-prone skin: bakuchiol. Pregnancy or breastfeeding: bakuchiol (retinol is contraindicated). Tolerant skin already adapted to actives: either works; retinol may be more efficient at higher concentrations. Hot, humid Indian summers: bakuchiol — its lack of photosensitivity matters when SPF compliance is imperfect.',
      },
      {
        heading: 'Practical layering tips',
        body: 'Use bakuchiol at night after toner, before moisturiser. Start 3 nights per week, work up to nightly. Pair with niacinamide morning, vitamin C alternating mornings, and ceramide moisturiser to support the barrier. Always wear broad-spectrum SPF the next morning regardless of which active you choose.',
      },
    ],
  },
  'skincare-routine-dry-skin': {
    title: 'The Complete Skincare Routine for Dry Skin (Organic Edition)',
    description:
      'A 6-step dermatologist-approved organic skincare routine for dry skin — right layering order, best ingredients, product picks.',
    category: 'Routines',
    date: 'March 2026',
    readTime: 8,
    sections: [
      {
        heading: 'Step 1 — Cleanse without stripping',
        body: 'Choose a creamy, sulphate-free cleanser. The job is to remove SPF and pollution without disturbing your skin barrier. Look for amino-acid-based surfactants and avoid foaming gel cleansers.',
      },
      {
        heading: 'Step 2 — Hydrating toner',
        body: 'Skip astringent or alcohol-based toners. A hydrating toner with hyaluronic acid, glycerin, or rose water adds the first layer of moisture for downstream actives to lock in.',
      },
      {
        heading: 'Step 3 — Targeted serum',
        body: 'For dry skin, this is your hydration and barrier-repair stage. Hyaluronic acid + niacinamide is the workhorse pairing. Bakuchiol three nights a week if anti-ageing is also a goal.',
      },
      {
        heading: 'Step 4 — Rich moisturiser',
        body: 'Squalane, shea butter, and ceramide-based formulations deliver lasting nourishment. Apply while skin is still damp — wet skin absorbs occlusives 30–40% better.',
      },
      {
        heading: 'Step 5 — Facial oil (night)',
        body: 'Rose hip or jojoba oil seals everything in. 2–3 drops, pressed (not rubbed) into the skin. Skip during the day if you live in a humid city.',
      },
      {
        heading: 'Step 6 — SPF (morning, non-negotiable)',
        body: 'Mineral SPF 30+ protects against UV-driven moisture loss. Reapply every two hours during outdoor exposure.',
      },
    ],
  },
  'organic-skincare-india': {
    title: 'Why Organic Skincare Is the Smartest Choice for Indian Skin',
    description:
      'Indian skin faces unique UV, humidity and pollution challenges. Learn why certified organic skincare outperforms conventional products.',
    category: 'Education',
    date: 'February 2026',
    readTime: 7,
    sections: [
      {
        heading: 'The Indian skin context',
        body: 'High UV index year-round, monsoon-driven humidity swings, and PM 2.5 pollution loads above WHO safe limits in most major cities. Each of these accelerates oxidative stress, and standard Western formulations are often calibrated for cooler, drier climates.',
      },
      {
        heading: 'Why "natural" is not enough',
        body: 'The wellness industry uses "natural" loosely. Organic certification — USDA, Ecocert, India Organic — requires verified non-synthetic sourcing, no banned pesticides, and chain-of-custody documentation. The certificate is the proof, not the marketing copy.',
      },
      {
        heading: 'Pollution defence is the real differentiator',
        body: 'Indian urban skin needs antioxidant load — green tea polyphenols, vitamin C, niacinamide, turmeric — every single day. Organic actives tend to come with their full plant matrix intact, which delivers a broader antioxidant profile than synthetic isolates.',
      },
      {
        heading: 'What to look for on the INCI list',
        body: 'Concentration order matters: ingredients are listed in descending order, so anything past position 6 is likely fragrance, preservative, or trace. Keep an eye out for parabens, sulphates, phthalates, formaldehyde donors, and synthetic fragrance — none have a legitimate place in a barrier-respecting routine.',
      },
    ],
  },
}

function articleJsonLd(article: Article, slug: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    author: { '@type': 'Organization', name: 'VerdeBliss' },
    publisher: {
      '@type': 'Organization',
      name: 'VerdeBliss',
      logo: { '@type': 'ImageObject', url: 'https://www.verdebliss.com/images/logo.webp' },
    },
    url: `https://www.verdebliss.com/blog/${slug}`,
  }
}

export async function generateStaticParams() {
  return Object.keys(ARTICLES).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = ARTICLES[slug]
  if (!article) return { title: 'Article Not Found' }
  return {
    title: article.title,
    description: article.description,
    openGraph: {
      title: article.title,
      description: article.description,
      url: `https://www.verdebliss.com/blog/${slug}`,
    },
    alternates: { canonical: `https://www.verdebliss.com/blog/${slug}` },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = ARTICLES[slug]
  if (!article) notFound()

  return (
    <>
      <StructuredData data={articleJsonLd(article, slug)} />
      <article className="bg-bg">
        <header className="bg-forest px-4 py-12">
          <div className="container-content max-w-[760px]">
            <Link
              href="/blog"
              className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-sage hover:text-white"
            >
              <ArrowLeft size={13} aria-hidden /> Back to journal
            </Link>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-sage">
              {article.category} · {article.readTime} min read
            </p>
            <h1 className="m-0 mb-4 font-serif text-[clamp(28px,4vw,44px)] font-normal leading-tight text-white">
              {article.title}
            </h1>
            <p className="text-sm leading-relaxed text-white/65">{article.description}</p>
            <p className="mt-4 text-[11px] uppercase tracking-wider text-white/40">
              Published {article.date}
            </p>
          </div>
        </header>

        <div className="container-content max-w-[760px] py-12">
          {article.sections.map((section, i) => (
            <section key={i} className="mb-9 last:mb-0">
              <h2 className="mb-3 font-serif text-xl font-semibold text-text">{section.heading}</h2>
              <p className="whitespace-pre-line text-[15px] leading-[1.85] text-muted">
                {section.body}
              </p>
            </section>
          ))}
        </div>

        <footer className="bg-forest px-4 py-14 text-center">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-sage">
            PUT IT INTO PRACTICE
          </p>
          <h2 className="mb-3 font-serif text-[clamp(1.5rem,2.5vw,2rem)] font-normal text-white">
            Ready to build your ritual?
          </h2>
          <p className="mx-auto mb-7 max-w-[400px] text-center text-sm text-white/55">
            Every formula built around the actives in this article.
          </p>
          <Link href="/products" className="btn-terra">
            Shop the collection <ArrowRight size={15} />
          </Link>
        </footer>
      </article>
    </>
  )
}
