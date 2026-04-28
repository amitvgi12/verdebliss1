import BlogIndexClient from './BlogIndexClient'

export const metadata = {
  title: 'Skincare Education & Beauty Guides',
  description: 'Expert skincare guides from the VerdeBliss team. Organic ingredients, routines for every skin type, and the science behind clean beauty.',
  alternates: { canonical: 'https://www.verdebliss.com/blog' },
}

export default function BlogPage() {
  return <BlogIndexClient />
}
