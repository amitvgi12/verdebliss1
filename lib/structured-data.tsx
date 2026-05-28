// JSON-LD structured data for server entry points (layout.tsx, page.tsx, etc.).
// The root layout forces request-time rendering so nonce-based CSP can protect
// Next's bootstrap scripts. Add the same nonce here because browsers still
// apply script CSP checks to application/ld+json script elements.
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
