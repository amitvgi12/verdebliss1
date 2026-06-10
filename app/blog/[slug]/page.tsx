import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { StructuredData } from '@/lib/structured-data'
import { ARTICLES, type Article } from '../articles'

export const revalidate = 3600

function articleJsonLd(article: Article, slug: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    datePublished: article.published,
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
