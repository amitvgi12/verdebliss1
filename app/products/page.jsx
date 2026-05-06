import { Metadata } from 'next'
import ProductsClient from './ProductsClient'

export const metadata = {
  title: 'Shop Organic Skincare',
  description: 'Browse VerdeBliss certified organic serums, moisturisers, cleansers and SPF. Filter by skin type. Free shipping above ₹499.',
  openGraph: { title: 'Shop Organic Skincare | VerdeBliss', url: 'https://www.verdebliss.com/products' },
  alternates: { canonical: 'https://www.verdebliss.com/products' },
}

export default function ProductsPage() {
  return <ProductsClient />
}
