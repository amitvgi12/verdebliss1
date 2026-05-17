// Server Component for nonced JSON-LD. Imported only from server entry points
// (e.g. layout.tsx, app/products/[id]/page.tsx, app/blog/[slug]/page.tsx).
import { headers } from 'next/headers'
import { safeJsonLd } from '@/lib/seo'

export async function StructuredData({ data }: { data: unknown }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  )
}
