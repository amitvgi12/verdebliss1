import type { Product, ProductSearchEntry } from '@/types'
import { TIER_THRESHOLDS } from '@/lib/loyalty'

// Static product shells for routes, tests, and non-price metadata.
// Prices, stock, discounts, ratings, and review counts are authoritative in Supabase only.
export const PRODUCTS = [
  {
    id: '1',
    slug: 'bakuchiol-renewal-serum',
    image_url: '/images/products/serum.webp',
    name: 'Bakuchiol Renewal Serum',
    category: 'Serum',
    price: 0,
    rating: null,
    review_count: 0,
    skin_types: ['Dry', 'Combination'],
    badges: ['Vegan-Friendly', 'Organic Botanicals'],
    description: 'Plant-based retinol alternative for a smoother-looking night ritual.',
    ingredient: 'Bakuchiol',
    bg_color: '#EBF0E9',
    emoji: '🌿',
  },
  {
    id: '2',
    slug: 'rose-hip-glow-moisturiser',
    image_url: '/images/products/moisturiser.webp',
    name: 'Rose Hip Glow Moisturiser',
    category: 'Moisturiser',
    price: 0,
    rating: null,
    review_count: 0,
    skin_types: ['Dry', 'Sensitive'],
    badges: ['Cruelty-free*', 'Vegan-Friendly'],
    description: 'Rich cloud-like hydration with rosehip oil and ceramides for lasting softness.',
    ingredient: 'Rose Hip',
    bg_color: '#F6EDE8',
    emoji: '🌹',
  },
  {
    id: '3',
    slug: 'green-tea-clarity-toner',
    image_url: '/images/products/toner.webp',
    name: 'Green Tea Clarity Toner',
    category: 'Toner',
    price: 0,
    rating: null,
    review_count: 0,
    skin_types: ['Oily', 'Combination'],
    badges: ['Vegan-Friendly', 'Organic Botanicals'],
    description: 'Helps oily and combination skin feel balanced with green tea extract.',
    ingredient: 'Green Tea',
    bg_color: '#E8F2EA',
    emoji: '🍃',
  },
  {
    id: '4',
    slug: 'turmeric-brightening-cleanser',
    image_url: '/images/products/cleanser.webp',
    name: 'Turmeric Brightening Cleanser',
    category: 'Cleanser',
    price: 0,
    rating: null,
    review_count: 0,
    skin_types: ['All Types'],
    badges: ['Cruelty-free*', 'Organic Botanicals'],
    description: 'Gentle foam cleanser with turmeric and neem for a fresh-looking complexion.',
    ingredient: 'Turmeric',
    bg_color: '#F5F0E4',
    emoji: '✨',
  },
  {
    id: '5',
    // Slug deliberately carries no SPF number: the product copy states that
    // independent SPF evidence is still in review, and a slug is a public claim.
    slug: 'botanical-mineral-sun-shield',
    image_url: '/images/products/spf.webp',
    name: 'Botanical Mineral Sun Shield',
    category: 'SPF',
    price: 0,
    rating: null,
    review_count: 0,
    skin_types: ['All Types'],
    badges: ['Vegan-Friendly', 'Cruelty-free*'],
    description:
      'Mineral daily sun-care shield with zinc oxide and soothing aloe vera. SPF-rating evidence is in review.',
    ingredient: 'Zinc Oxide',
    bg_color: '#FFF8E8',
    emoji: '☀️',
  },
  {
    id: '6',
    slug: 'wild-berry-lip-elixir',
    image_url: '/images/products/lip-elixir.webp',
    name: 'Wild Berry Lip Elixir',
    category: 'Lip Care',
    price: 0,
    rating: null,
    review_count: 0,
    skin_types: ['All Types'],
    badges: ['Organic Botanicals'],
    description: 'Nourishing lip treatment with berry extract and shea for soft-feeling lips.',
    ingredient: 'Acai Berry',
    bg_color: '#F0E8F5',
    emoji: '🫐',
  },
  {
    id: '7',
    slug: 'niacinamide-pore-serum',
    image_url: '/images/products/niacinamide-serum.webp',
    name: 'Niacinamide Pore Serum',
    category: 'Serum',
    price: 0,
    rating: null,
    review_count: 0,
    skin_types: ['Oily', 'Combination'],
    badges: ['Vegan-Friendly', 'Cruelty-free*'],
    description: 'Refines the look of pores and helps skin feel balanced with niacinamide.',
    ingredient: 'Niacinamide',
    bg_color: '#E8EFF5',
    emoji: '💧',
  },
  {
    id: '8',
    slug: 'shea-butter-night-cream',
    image_url: '/images/products/night-cream.webp',
    name: 'Shea Butter Night Cream',
    category: 'Moisturiser',
    price: 0,
    rating: null,
    review_count: 0,
    skin_types: ['Dry', 'Sensitive'],
    badges: ['Organic Botanicals', 'Cruelty-free*'],
    description:
      'Cushiony overnight cream with shea butter and vitamin E for a rested-looking glow.',
    ingredient: 'Shea Butter',
    bg_color: '#F5EBF0',
    emoji: '🌙',
  },
] satisfies Product[]

// Index for the nav search palette, shipped in every page's payload. Trimmed to
// the fields the palette renders so the raw badge vocabulary above and the long
// descriptions never reach the client (see ProductSearchEntry).
// `price` is deliberately NOT included: these static shells always carry price 0
// (real prices are authoritative in Supabase), the nav palette never renders a
// price, and shipping the field put a misleading 0 in every page's payload.
export const PRODUCT_SEARCH_INDEX: ProductSearchEntry[] = PRODUCTS.map(
  ({ id, slug, name, category, ingredient, bg_color, emoji }) => ({
    id,
    slug,
    name,
    category,
    ingredient,
    bg_color,
    emoji,
  })
)

export const CATEGORIES = [
  'All',
  'Serum',
  'Moisturiser',
  'Toner',
  'Cleanser',
  'SPF',
  'Lip Care',
] as const
export const SKIN_TYPES = ['All', 'Dry', 'Oily', 'Combination', 'Sensitive'] as const
export const SORT_OPTIONS = [
  'Bestselling',
  'Price Low→High',
  'Price High→Low',
  'Top Rated',
] as const

export interface LoyaltyTier {
  name: string
  min: number
  max: number
  color: string
  emoji: string
}

export const TIERS: LoyaltyTier[] = [
  { name: 'Green Leaf', min: 0, max: TIER_THRESHOLDS.GOLD - 1, color: '#3D6344', emoji: '🌿' },
  {
    name: 'Gold Botanist',
    min: TIER_THRESHOLDS.GOLD,
    max: TIER_THRESHOLDS.PLATINUM - 1,
    color: '#BFA06A',
    emoji: '🏆',
  },
  {
    name: 'Platinum Alchemist',
    min: TIER_THRESHOLDS.PLATINUM,
    max: Infinity,
    color: '#7B8FA6',
    emoji: '💎',
  },
]
