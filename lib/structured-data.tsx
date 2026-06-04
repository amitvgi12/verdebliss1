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

/**
 * Inline JSON-LD for static / ISR routes (home, PDP, products, blog, faq) whose
 * CSP serves `script-src 'unsafe-inline'` — so the block needs no nonce.
 *
 * Unlike {@link StructuredData} this does NOT call headers(), so it never opts
 * the route out of static/ISR rendering (reading a request header is a Next.js
 * dynamic API). Use it on non-nonce routes; reserve StructuredData for the
 * nonce-enforced routes in `proxy.ts` `NONCE_ROUTE_PREFIXES`.
 *
 * Emitting JSON-LD inline (not via a `<script type="application/ld+json" src>`)
 * is mandatory: a non-JS script type is an HTML *data block* whose `src` is
 * ignored, so an external-src JSON-LD block never enters the DOM and crawlers
 * never parse it.
 */
export function InlineStructuredData({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  )
}
