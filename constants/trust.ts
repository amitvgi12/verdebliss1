export const TRUST_METRICS = {
  heroProofs: ['INCI-first formulas', 'Published claim status', 'Verified reviews after purchase'],
  collectionCopy:
    'Every formula is presented with full ingredient disclosure, product-specific guidance, and review states that reflect approved purchases.',
  philosophyCopy:
    'VerdeBliss is built around named botanicals, full ingredient disclosure, and practical guidance that customers can inspect before they buy.',
  proofLinks: [
    { label: 'Ingredient standards', href: '/ingredients' },
    { label: 'Sustainability roadmap', href: '/sustainability' },
    { label: 'Returns policy', href: '/returns-refunds' },
  ],
  reviewStandards: [
    'Verified reviews appear after purchase',
    'No unverified testimonials',
    'Schema omits empty aggregate ratings',
  ],
} as const
