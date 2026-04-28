import IngredientsPageClient from './IngredientsPageClient'

export const metadata = {
  title: 'Ingredient Glossary — What\'s in Your Skincare',
  description: "Explore the certified organic botanicals inside every VerdeBliss formula.",
  alternates: { canonical: 'https://www.verdebliss.com/ingredients' },
}

export default function IngredientsPagePage() {
  return <IngredientsPageClient />
}
