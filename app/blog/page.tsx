import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import FadeIn from '@/components/ui/FadeIn'

export const revalidate = 3600

export const metadata = {
  title: 'Skincare Education & Beauty Guides',
  description:
    'Expert skincare guides from the VerdeBliss team. Organic ingredients, routines for every skin type, and the science behind clean beauty.',
  alternates: { canonical: 'https://www.verdebliss.com/blog' },
}

const POSTS = [
  {
    slug: 'bakuchiol-vs-retinol',
    title: 'Bakuchiol vs Retinol: Which Is Right for Your Skin?',
    excerpt:
      'A complete science-backed comparison: efficacy, irritation profile, pregnancy safety, and which works better for Indian climates.',
    category: 'Ingredient Science',
    readTime: 6,
    date: 'April 2026',
    image: '/images/ingredients/bakuchiol.webp',
  },
  {
    slug: 'skincare-routine-dry-skin',
    title: 'The Complete Skincare Routine for Dry Skin (Organic Edition)',
    excerpt:
      'A 6-step dermatologist-approved organic routine for dry skin — correct layering order, best ingredients, product picks.',
    category: 'Routines',
    readTime: 8,
    date: 'March 2026',
    image: '/images/products/shea.webp',
  },
  {
    slug: 'organic-skincare-india',
    title: 'Why Organic Skincare Is the Smartest Choice for Indian Skin',
    excerpt:
      'Indian skin faces unique UV, humidity, and pollution challenges. Why certified organic outperforms conventional formulations.',
    category: 'Education',
    readTime: 7,
    date: 'February 2026',
    image: '/images/ingredients/greentealeaves.webp',
  },
]

export default function BlogIndexPage() {
  return (
    <div className="bg-bg">
      {/* Hero */}
      <section className="editorial-hero">
        <div className="editorial-hero__inner">
          <FadeIn>
            <p className="editorial-hero__kicker">THE VERDEBLISS JOURNAL</p>
            <h1 className="editorial-hero__title">Skincare Education</h1>
            <p className="editorial-hero__copy">
              Long-form, research-backed articles. No 200-word listicles, no sponsored content.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Post grid */}
      <section className="site-container editorial-section">
        <div className="journal-grid">
          {POSTS.map((post, i) => (
            <FadeIn key={post.slug} delay={i * 0.1}>
              <article className="journal-card soft-card soft-card-hover">
                <div className="journal-card__media">
                  <Image
                    src={post.image}
                    alt=""
                    fill
                    sizes="(max-width: 800px) 100vw, 33vw"
                    className="object-cover"
                  />
                  <div className="journal-card__overlay">
                    <span className="journal-card__read-time">{post.readTime} min read</span>
                    <p className="journal-card__category">{post.category}</p>
                  </div>
                </div>

                <div className="journal-card__body">
                  <p className="journal-card__date">{post.date}</p>
                  <h2 className="journal-card__title">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-text no-underline transition hover:text-forest"
                    >
                      {post.title}
                    </Link>
                  </h2>
                  <p className="journal-card__excerpt flex-1">{post.excerpt}</p>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1.5 self-start text-[12px] font-semibold text-forest transition hover:gap-2.5"
                  >
                    Read article <ArrowRight size={12} />
                  </Link>
                </div>
              </article>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="editorial-cta">
        <FadeIn>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-sage">
            QUESTIONS?
          </p>
          <h2 className="mb-3 font-serif text-[clamp(1.5rem,2.5vw,2rem)] font-normal text-white">
            Ask Verde, our AI skin advisor
          </h2>
          <p className="mx-auto mb-7 max-w-[440px] text-center text-sm text-white/55">
            Skin-type-aware recommendations based on the science. Available on every page.
          </p>
          <Link href="/contact" className="btn-terra">
            Or contact our team <ArrowRight size={15} />
          </Link>
        </FadeIn>
      </section>
    </div>
  )
}
