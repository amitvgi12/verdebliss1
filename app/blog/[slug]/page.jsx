import BlogPostClient from './BlogPostClient'

const ARTICLE_META = {
  'bakuchiol-vs-retinol': {
    title: 'Bakuchiol vs Retinol: Which Is Right for Your Skin?',
    description: 'A complete science-backed comparison of bakuchiol vs retinol. Which works better for sensitive skin in Indian climate?',
  },
  'skincare-routine-dry-skin': {
    title: 'The Complete Skincare Routine for Dry Skin (Organic Edition)',
    description: 'A 6-step dermatologist-approved organic skincare routine for dry skin — right layering order, best ingredients, product picks.',
  },
  'organic-skincare-india': {
    title: 'Why Organic Skincare Is the Smartest Choice for Indian Skin',
    description: 'Indian skin faces unique UV, humidity and pollution challenges. Learn why certified organic skincare outperforms conventional products.',
  },
}

export async function generateMetadata({ params }) {
  const meta = ARTICLE_META[params.slug]
  if (!meta) return { title: 'Article Not Found' }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: meta.title,
    description: meta.description,
    author: { '@type': 'Organization', name: 'VerdeBliss' },
    publisher: {
      '@type': 'Organization', name: 'VerdeBliss',
      logo: { '@type': 'ImageObject', url: 'https://www.verdebliss.com/images/logo.webp' },
    },
    url: `https://www.verdebliss.com/blog/${params.slug}`,
  }

  return {
    title: meta.title,
    description: meta.description,
    openGraph: { title: meta.title, description: meta.description, url: `https://www.verdebliss.com/blog/${params.slug}` },
    alternates: { canonical: `https://www.verdebliss.com/blog/${params.slug}` },
    other: { 'script:ld+json': JSON.stringify(jsonLd) },
  }
}

export async function generateStaticParams() {
  return Object.keys(ARTICLE_META).map((slug) => ({ slug }))
}

export default function Page({ params }) {
  return <BlogPostClient slug={params.slug} />
}
