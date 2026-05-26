export const revalidate = 300

import FAQClient from './FAQClient'
import { StructuredData } from '@/lib/structured-data'
import { BUSINESS_COMPLIANCE } from '@/constants/businessCompliance'

const FAQ_DATA = [
  {
    q: 'Are VerdeBliss products organic?',
    a: 'Our formulas are built around organic botanical ingredients. Third-party certification is in progress and evidence will be published in the Trust Centre at verdebliss.com/certifications.',
  },
  {
    q: 'Do you ship across India?',
    a: `Yes, we ship to all serviceable PIN codes in India. Free shipping on orders above ₹499. Standard delivery is 2 to 3 business days from our ${BUSINESS_COMPLIANCE.fulfilmentCity} fulfilment centre.`,
  },
  {
    q: 'What is your return policy?',
    a: `We accept returns of unopened products within 14 days of delivery. Opened products may be reviewed for adverse-reaction support under the returns policy. Email ${BUSINESS_COMPLIANCE.emails.returns} with your order ID.`,
  },
  {
    q: 'How do loyalty points work?',
    a: 'You earn 1 point per ₹10 spent after successful payment verification. Tiers: Green Leaf (0–499), Gold Botanist (500–1499), Platinum Alchemist (1500+). Higher tiers unlock early access, free samples, and special discounts.',
  },
  {
    q: 'Can I use VerdeBliss products during pregnancy?',
    a: 'Some cosmetic ingredients require extra caution during pregnancy or breastfeeding. The Green Tea Clarity Toner contains Salicylic Acid (BHA), so speak with your healthcare provider before use. If you are pregnant, breastfeeding, or under medical care, review the full INCI list and consult your clinician before changing your routine.',
  },
  {
    q: 'How do I patch test a new product?',
    a: 'Apply a small amount to the inside of your forearm and wait 24 hours. If redness, itching, or irritation appears, discontinue use. Patch testing is recommended for active products, especially if you have sensitive or reactive skin.',
  },
  {
    q: 'What does INCI mean?',
    a: 'INCI (International Nomenclature of Cosmetic Ingredients) is the global standard for listing cosmetic ingredients on labels. Each VerdeBliss product page shows the full INCI list in descending order of concentration — required by EU Cosmetics Regulation and CDSCO India.',
  },
  {
    q: 'How long do products stay fresh after opening?',
    a: 'Each product has a PAO (Period After Opening) symbol on its page and packaging. Most VerdeBliss products are 12M (use within 12 months); the Wild Berry Lip Elixir is 18M. Store in a cool, dry place away from direct sunlight.',
  },
  {
    q: 'Are your products vegan?',
    a: 'Most formulas are vegan-friendly. The Wild Berry Lip Elixir contains Beeswax and is not vegan. Formal vegan certification is in progress. Current status is published in the Trust Centre at verdebliss.com/certifications.',
  },
  {
    q: 'Do you test on animals?',
    a: 'No. We do not conduct or commission animal testing at any stage of formulation or manufacture. Cruelty-free certification is in progress. The verified listing will be published in the Trust Centre at verdebliss.com/certifications once confirmed.',
  },
  {
    q: 'How do I track my order?',
    a: 'You will receive a tracking link by email and SMS once your order ships. You can also view all orders in My Account → Orders.',
  },
  {
    q: 'Do you offer payment in instalments?',
    a: 'Yes, Razorpay supports EMI and Pay Later options. Available payment methods at checkout include UPI, Cards, Net Banking, Wallets, and EMI.',
  },
  {
    q: 'What if I have a reaction to a product?',
    a: `Stop using the product immediately and seek medical advice if symptoms persist or feel severe. Email ${BUSINESS_COMPLIANCE.emails.reactions} with your order ID, product name, and photos so our team can review the case under the returns policy.`,
  },
]

export const metadata = {
  title: 'Frequently Asked Questions',
  description:
    'Answers about VerdeBliss botanical skincare: shipping, returns, ingredients, formulation standards, pregnancy-use cautions, loyalty points, and more.',
  alternates: { canonical: 'https://www.verdebliss.com/faq' },
}

export default function FAQPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_DATA.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }

  return (
    <>
      <StructuredData data={jsonLd} />
      <FAQClient items={FAQ_DATA} />
    </>
  )
}
