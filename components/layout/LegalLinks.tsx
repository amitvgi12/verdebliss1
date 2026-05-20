import Link from 'next/link'

const LEGAL_LINKS: Array<[string, string]> = [
  ['Privacy Policy', '/privacy-policy'],
  ['Terms', '/terms'],
  ['Cookie Policy', '/cookie-policy'],
  ['Return and Refund Policy', '/returns-refunds'],
  ['Shipping Policy', '/shipping-policy'],
]

export default function LegalLinks() {
  return (
    <nav aria-label="Legal links" className="flex flex-wrap gap-5">
      {LEGAL_LINKS.map(([label, path]) => (
        <Link
          key={path}
          href={path}
          className="text-[11px] text-white underline decoration-white/45 underline-offset-4 transition hover:text-gold hover:decoration-gold"
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
