// Server Component for nonced JSON-LD. Imported only from server entry points
// (e.g. layout.tsx, app/products/[id]/page.tsx, app/blog/[slug]/page.tsx).
import { headers } from 'next/headers'
import { safeJsonLd } from '@/lib/seo'

export async function StructuredData({ data }: { data: unknown }) {
  // headers() throws DYNAMIC_SERVER_USAGE during build-time pre-rendering (ISR
  // static shell, generateStaticParams). JSON-LD scripts are type="application/ld+json"
  // (data, not executable), so CSP script-src nonce is not required for them.
  let nonce: string | undefined
  try {
    nonce = (await headers()).get('x-nonce') ?? undefined
  } catch {
    nonce = undefined
  }
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  )
}
