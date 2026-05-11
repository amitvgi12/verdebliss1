import Link from 'next/link'

const LEGAL_LINKS: Array<[string, string]> = [
  ['Privacy Policy', '/privacy-policy'],
  ['Terms', '/terms'],
  ['Cookie Policy', '/cookie-policy'],
  ['Returns & Refunds', '/returns-refunds'],
  ['Shipping Policy', '/shipping-policy'],
]

export default function LegalLinks() {
  return (
    <nav aria-label="Legal links" className="flex flex-wrap gap-5">
      {LEGAL_LINKS.map(([label, path]) => (
        <Link
          key={path}
          href={path}
          className="text-[11px] text-white/55 transition hover:text-white/90"
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
