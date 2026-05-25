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
      'A practical comparison of bakuchiol vs retinol: visible-skin goals, comfort profile, and routine fit for Indian climate.',
    category: 'Ingredient Science',
    date: 'April 2026',
    readTime: 6,
    sections: [
      {
        heading: 'The short answer',
        body: 'Bakuchiol and retinol are often used for similar visible-skin goals, but they are not the same ingredient. Retinol has the stronger clinical history for signs of ageing. Bakuchiol is commonly chosen when someone wants a gentler-feeling night routine, though individual tolerance varies.',
      },
      {
        heading: 'What the studies say',
        body: 'A 2019 randomised study published in the British Journal of Dermatology compared 0.5% bakuchiol with 0.5% retinol over 12 weeks. Both groups showed visible improvements in wrinkles and pigmentation measures, while the retinol group reported more scaling and stinging. It is useful evidence, not a promise that every formula or user will see the same result.',
      },
      {
        heading: 'Which one for which skin',
        body: 'Sensitive or reactive skin: consider a lower-friction routine and patch test first. Pregnancy or breastfeeding: avoid self-prescribing active swaps and ask your clinician before using retinoids or retinol-alternative products. Tolerant skin already adapted to actives may choose either based on goals, texture preference, and professional advice.',
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
      'A 6-step botanical skincare routine for dry-feeling skin — right layering order, ingredient roles, and product picks.',
    category: 'Routines',
    date: 'March 2026',
    readTime: 8,
    sections: [
      {
        heading: 'Step 1 — Cleanse without stripping',
        body: 'Choose a creamy, sulphate-free cleanser. The job is to remove sunscreen and daily buildup while keeping skin comfortable. Look for mild surfactants and avoid formulas that leave your skin feeling tight.',
      },
      {
        heading: 'Step 2 — Hydrating toner',
        body: 'Skip astringent or alcohol-based toners. A hydrating toner with hyaluronic acid, glycerin, or rose water adds the first layer of moisture for downstream actives to lock in.',
      },
      {
        heading: 'Step 3 — Targeted serum',
        body: 'For dry-feeling skin, this is your hydration and barrier-support stage. Hyaluronic acid plus niacinamide is a useful pairing. Bakuchiol can be introduced slowly at night if a smoother-looking routine is also a goal.',
      },
      {
        heading: 'Step 4 — Rich moisturiser',
        body: 'Squalane, shea butter, and ceramide-based formulations help reduce a dry, tight feel. Apply while skin is slightly damp to improve comfort and spreadability.',
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
      'Indian skin faces UV, humidity and pollution stressors. Learn how to evaluate botanical skincare claims with evidence-first habits.',
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
        body: 'Indian urban routines often benefit from antioxidant-support ingredients such as green tea polyphenols, vitamin C, niacinamide, and turmeric. The strongest choice is the one with a clear INCI list, appropriate concentration, and a formula your skin tolerates.',
      },
      {
        heading: 'What to look for on the INCI list',
        body: 'Concentration order matters: ingredients are listed in descending order until the low-concentration zone, where exact order can vary by regulation. Keep an eye out for known personal triggers and choose formulas with clear allergen and fragrance disclosure.',
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
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.description,
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
        <header className="editorial-hero text-left">
          <div className="editorial-hero__inner max-w-[760px] text-left">
            <Link
              href="/blog"
              className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-sage hover:text-white"
            >
              <ArrowLeft size={13} aria-hidden /> Back to journal
            </Link>
            <p className="editorial-hero__kicker mb-3 text-left">
              {article.category} · {article.readTime} min read
            </p>
            <h1 className="editorial-hero__title max-w-[720px] text-left">{article.title}</h1>
            <p className="editorial-hero__copy mx-0 max-w-[620px] text-left">
              {article.description}
            </p>
            <p className="mt-4 text-[11px] uppercase tracking-wider text-white/40">
              Published {article.date}
            </p>
          </div>
        </header>

        <div className="site-container editorial-section max-w-[760px]">
          {article.sections.map((section, i) => (
            <section key={i} className="mb-9 last:mb-0">
              <h2 className="mb-3 font-serif text-xl font-semibold text-text">{section.heading}</h2>
              <p className="whitespace-pre-line text-[15px] leading-[1.85] text-muted">
                {section.body}
              </p>
            </section>
          ))}
        </div>

        <footer className="editorial-cta">
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
