// JSON-LD structured data for server entry points (layout.tsx, page.tsx, etc.).
// type="application/ld+json" is a data block, not executable — CSP script-src
// nonce is not required and must not call headers() here because this component
// is used inside ISR/static pages (revalidate=300). Calling headers() at runtime
// on a statically-rendered page triggers the Next.js static→dynamic error.
import { safeJsonLd } from '@/lib/seo'

export function StructuredData({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  )
}
