import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

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
  },
  {
    slug: 'skincare-routine-dry-skin',
    title: 'The Complete Skincare Routine for Dry Skin (Organic Edition)',
    excerpt:
      'A 6-step dermatologist-approved organic routine for dry skin — correct layering order, best ingredients, product picks.',
    category: 'Routines',
    readTime: 8,
    date: 'March 2026',
  },
  {
    slug: 'organic-skincare-india',
    title: 'Why Organic Skincare Is the Smartest Choice for Indian Skin',
    excerpt:
      'Indian skin faces unique UV, humidity, and pollution challenges. Why certified organic outperforms conventional formulations.',
    category: 'Education',
    readTime: 7,
    date: 'February 2026',
  },
]

export default function BlogIndexPage() {
  return (
    <div className="bg-bg">
      <section className="bg-forest px-4 py-16 text-center">
        <div className="site-container">
          <p className="mb-3 text-[10px] font-semibold tracking-[0.16em] text-sage">
            THE VERDEBLISS JOURNAL
          </p>
          <h1 className="m-0 mb-4 font-serif text-[clamp(36px,5vw,56px)] font-normal leading-[1.05] text-white">
            Skincare Education
          </h1>
          <p className="mx-auto max-w-[600px] text-sm leading-relaxed text-white/65">
            Long-form, research-backed articles. No 200-word listicles, no sponsored content.
          </p>
        </div>
      </section>

      <section className="site-container py-16">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
          {POSTS.map((post) => (
            <article
              key={post.slug}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(0,0,0,0.07)]"
            >
              <div className="flex h-40 items-center justify-center bg-sagePale">
                <span className="text-5xl" aria-hidden>
                  📖
                </span>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="mb-2 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider text-terra">
                  <span>{post.category}</span>
                  <span aria-hidden>·</span>
                  <span>{post.readTime} min read</span>
                </div>
                <h2 className="mb-2 font-serif text-base font-semibold leading-snug text-text">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-text no-underline hover:text-forest"
                  >
                    {post.title}
                  </Link>
                </h2>
                <p className="mb-4 flex-1 text-xs leading-relaxed text-muted">{post.excerpt}</p>
                <div className="flex items-center justify-between text-[11px] text-light">
                  <span>{post.date}</span>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1 font-semibold text-forest hover:underline"
                  >
                    Read article <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-ivory px-4 py-16 text-center">
        <p className="label-eyebrow mb-2.5">QUESTIONS?</p>
        <h2 className="mb-3 font-serif text-[clamp(24px,3vw,32px)] font-normal text-text">
          Ask Verde, our AI advisor
        </h2>
        <p className="mx-auto mb-7 max-w-[440px] text-sm text-muted">
          Skin-type-aware recommendations based on the science. Available on every page.
        </p>
        <Link href="/contact" className="btn-outline">
          Or contact our team <ArrowRight size={15} />
        </Link>
      </section>
    </div>
  )
}
