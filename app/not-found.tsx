import Link from 'next/link'

export const metadata = {
  title: 'Page Not Found',
  description: 'The page you are looking for does not exist.',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <div className="container-content py-24 text-center">
      <p className="label-eyebrow mb-3">404</p>
      <h1 className="mb-4 font-serif text-[clamp(28px,4vw,40px)] font-normal text-text">
        We couldn&apos;t find that page
      </h1>
      <p className="mx-auto mb-8 max-w-md text-sm text-muted">
        It may have moved or never existed. Try our homepage or shop the collection.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">
          Go home
        </Link>
        <Link href="/products" className="btn-outline">
          Shop products
        </Link>
      </div>
    </div>
  )
}
