import { organizationJsonLd, websiteJsonLd } from '@/lib/site-schema'
import { safeJsonLd } from '@/lib/seo'

// Static schema — only changes when BUSINESS_COMPLIANCE env vars change (deploy).
export const dynamic = 'force-static'

export function GET() {
  return new Response(safeJsonLd([organizationJsonLd(), websiteJsonLd()]), {
    headers: {
      'Content-Type': 'application/ld+json',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
