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
      <section className="bg-forest px-4 py-14 text-center">
        <div className="site-container">
          <FadeIn>
            <p className="mb-3 text-[10px] font-semibold tracking-[0.16em] text-sage">
              THE VERDEBLISS JOURNAL
            </p>
            <h1 className="m-0 mb-4 font-serif text-[clamp(2rem,3.5vw,3rem)] font-normal leading-[1.05] text-white">
              Skincare Education
            </h1>
            <p className="mx-auto max-w-[560px] text-center text-sm leading-relaxed text-white/65">
              Long-form, research-backed articles. No 200-word listicles, no sponsored content.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Post grid */}
      <section className="site-container py-14">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
          {POSTS.map((post, i) => (
            <FadeIn key={post.slug} delay={i * 0.08}>
              <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_2px_12px_rgba(45,74,50,0.06)] transition hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(45,74,50,0.12)]">
                {/* Editorial card header */}
                <div
                  className="relative flex h-48 flex-col justify-between overflow-hidden p-6"
                  style={{ background: post.cardBg }}
                >
                  {/* Big background number */}
                  <span
                    className="pointer-events-none absolute -right-3 -top-3 select-none font-serif text-[9rem] font-bold leading-none"
                    style={{ color: 'rgba(255,255,255,0.06)' }}
                    aria-hidden
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  {/* Top: read time */}
                  <span
                    className="relative z-10 self-start rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{
                      background: 'rgba(255,255,255,0.12)',
                      color: post.accentColor,
                      border: '1px solid rgba(255,255,255,0.16)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    {post.readTime} min read
                  </span>

                  {/* Bottom: category */}
                  <div className="relative z-10">
                    <p
                      className="font-serif text-2xl font-normal leading-tight text-white"
                      style={{ letterSpacing: '-0.02em' }}
                    >
                      {post.category}
                    </p>
                  </div>
                </div>

                {/* Card body */}
                <div className="flex flex-1 flex-col p-6">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-terra">
                    {post.date}
                  </p>
                  <h2 className="mb-3 font-serif text-base font-semibold leading-snug text-text">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-text no-underline transition hover:text-forest"
                    >
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mb-5 flex-1 text-xs leading-relaxed text-muted">{post.excerpt}</p>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1.5 self-start text-[12px] font-semibold text-forest hover:underline"
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
      <section className="bg-ivory px-4 py-14 text-center">
        <FadeIn>
          <p className="label-eyebrow mb-2.5">QUESTIONS?</p>
          <h2 className="mb-3 font-serif text-[clamp(1.5rem,2.5vw,2rem)] font-normal text-text">
            Ask Verde, our AI skin advisor
          </h2>
          <p className="mx-auto mb-7 max-w-[440px] text-center text-sm text-muted">
            Skin-type-aware recommendations based on the science. Available on every page.
          </p>
          <Link href="/contact" className="btn-outline">
            Or contact our team <ArrowRight size={15} />
          </Link>
        </FadeIn>
      </section>
    </div>
  )
}
