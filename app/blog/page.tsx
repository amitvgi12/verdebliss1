import Link from 'next/link'
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
    cardBg: 'linear-gradient(135deg, #2d4a32 0%, #122017 100%)',
    accentColor: '#bfa06a',
  },
  {
    slug: 'skincare-routine-dry-skin',
    title: 'The Complete Skincare Routine for Dry Skin (Organic Edition)',
    excerpt:
      'A 6-step dermatologist-approved organic routine for dry skin — correct layering order, best ingredients, product picks.',
    category: 'Routines',
    readTime: 8,
    date: 'March 2026',
    cardBg: 'linear-gradient(135deg, #c07a5a 0%, #7a3e22 100%)',
    accentColor: '#fdfaf6',
  },
  {
    slug: 'organic-skincare-india',
    title: 'Why Organic Skincare Is the Smartest Choice for Indian Skin',
    excerpt:
      'Indian skin faces unique UV, humidity, and pollution challenges. Why certified organic outperforms conventional formulations.',
    category: 'Education',
    readTime: 7,
    date: 'February 2026',
    cardBg: 'linear-gradient(135deg, #4a6844 0%, #2d4a32 100%)',
    accentColor: '#bfa06a',
  },
]

export default function BlogIndexPage() {
  return (
    <div className="bg-bg">
      {/* Hero */}
      <section className="bg-forest px-4 py-20 text-center">
        <div className="site-container">
          <FadeIn>
            <p className="mb-4 text-[10px] font-semibold tracking-[0.18em] text-sage">
              THE VERDEBLISS JOURNAL
            </p>
            <h1 className="m-0 mb-5 font-serif text-[clamp(2.2rem,4vw,3.4rem)] font-normal leading-[1.02] tracking-[-0.03em] text-white">
              Skincare Education
            </h1>
            <p className="mx-auto max-w-[520px] text-center text-[15px] leading-[1.75] text-white/60">
              Long-form, research-backed articles. No 200-word listicles, no sponsored content.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Post grid */}
      <section className="site-container py-16">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-7">
          {POSTS.map((post, i) => (
            <FadeIn key={post.slug} delay={i * 0.1}>
              <article className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-border bg-card shadow-[0_4px_18px_rgba(45,74,50,0.07)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(45,74,50,0.13)]">
                {/* Editorial card header */}
                <div
                  className="relative flex h-56 flex-col justify-between overflow-hidden p-7"
                  style={{ background: post.cardBg }}
                >
                  {/* Big background number */}
                  <span
                    className="pointer-events-none absolute -right-2 -top-4 select-none font-serif text-[10rem] font-bold leading-none"
                    style={{ color: 'rgba(255,255,255,0.09)' }}
                    aria-hidden
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  {/* Top: read time pill */}
                  <span
                    className="relative z-10 self-start rounded-full px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{
                      background: 'rgba(255,255,255,0.14)',
                      color: post.accentColor,
                      border: '1px solid rgba(255,255,255,0.18)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    {post.readTime} min read
                  </span>

                  {/* Bottom: category */}
                  <div className="relative z-10">
                    <p
                      className="font-serif text-[1.6rem] font-normal leading-tight text-white"
                      style={{ letterSpacing: '-0.025em' }}
                    >
                      {post.category}
                    </p>
                  </div>
                </div>

                {/* Card body */}
                <div className="flex flex-1 flex-col p-6">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-terra">
                    {post.date}
                  </p>
                  <h2 className="mb-3 font-serif text-[1.05rem] font-semibold leading-snug text-text">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-text no-underline transition hover:text-forest"
                    >
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mb-6 flex-1 text-[13px] leading-relaxed text-muted">
                    {post.excerpt}
                  </p>
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
      <section className="bg-forest px-4 py-16 text-center">
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
