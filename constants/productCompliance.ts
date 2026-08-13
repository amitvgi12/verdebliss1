import { BUSINESS_COMPLIANCE, formatPostalAddress } from '@/constants/businessCompliance'
import type { Product } from '@/types'

/**
 * productCompliance.js
 * Per-product compliance data:
 *   - INCI ingredient list in descending concentration (CDSCO / EU Cosmetics Regulation)
 *   - Allergen warnings per product
 *   - PAO (Period After Opening) in months
 *   - Free-from claims (verifiable)
 *   - Age guidance where applicable
 */

export interface ProductCompliance {
  pao: number
  inci: string
  allergens: string
  patchTest: boolean
  agingNote: string | null
  freeFrom: string[]
  countryOfOrigin: string
  manufacturer: string
  packer: string
  importer: string | null
  cdSCoImportLicence: string | null
}

const LOCAL_ENTITY_DETAILS = `${BUSINESS_COMPLIANCE.legalName}, ${formatPostalAddress()}`
const LOCAL_MANUFACTURER = LOCAL_ENTITY_DETAILS
const LOCAL_PACKER = LOCAL_ENTITY_DETAILS

export const DEFAULT_PRODUCT_COMPLIANCE: ProductCompliance = {
  pao: 12,
  inci: 'Full ingredient list is printed on product packaging and should be reviewed before use.',
  allergens:
    'Review the product packaging before use. Perform a patch test if you have sensitive or reactive skin.',
  patchTest: true,
  agingNote: null,
  freeFrom: [],
  countryOfOrigin: 'India',
  manufacturer: LOCAL_MANUFACTURER,
  packer: LOCAL_PACKER,
  importer: null,
  cdSCoImportLicence: null,
}

export const PRODUCT_COMPLIANCE: Record<string, ProductCompliance> = {
  /* Bakuchiol Renewal Serum */
  1: {
    pao: 12,
    inci: 'Aqua (Water), Bakuchiol (0.5%), Simmondsia Chinensis (Jojoba) Seed Oil, Tocopherol (Vitamin E), Sodium Hyaluronate (Hyaluronic Acid), Glycerin, Panthenol, Niacinamide, Cetyl Alcohol, Cetearyl Alcohol, Phenoxyethanol, Ethylhexylglycerin.',
    allergens:
      'Contains Cetearyl Alcohol (fatty alcohol, not drying alcohol). Free from: Parabens, Sulphates, Synthetic Fragrance, Mineral Oil, Phthalates. If pregnant, breastfeeding, or under medical care, consult your healthcare provider before use.',
    patchTest: true,
    agingNote: null,
    freeFrom: ['Parabens', 'Sulphates', 'Synthetic Fragrance', 'Mineral Oil', 'Phthalates'],
    countryOfOrigin: 'India',
    manufacturer: LOCAL_MANUFACTURER,
    packer: LOCAL_PACKER,
    importer: null,
    cdSCoImportLicence: null,
  },
  /* Rose Hip Glow Moisturiser */
  2: {
    pao: 12,
    inci: 'Aqua (Water), Rosa Canina (Rosehip) Fruit Oil, Glycerin, Ceramide NP, Ceramide AP, Ceramide EOP, Niacinamide, Ascorbic Acid (Vitamin C), Phenoxyethanol, Ethylhexylglycerin, Carbomer, Sodium Hydroxide.',
    allergens:
      'Contains Rosa Canina (Rosehip) Oil. Free from: Parabens, Sulphates, Synthetic Fragrance, Alcohol Denat. Perform a patch test before use, especially if sensitive to rose-family botanicals.',
    patchTest: true,
    agingNote: null,
    freeFrom: ['Parabens', 'Sulphates', 'Synthetic Fragrance', 'Alcohol Denat'],
    countryOfOrigin: 'India',
    manufacturer: LOCAL_MANUFACTURER,
    packer: LOCAL_PACKER,
    importer: null,
    cdSCoImportLicence: null,
  },
  /* Green Tea Clarity Toner */
  3: {
    pao: 12,
    inci: 'Aqua (Water), Camellia Sinensis (Green Tea) Leaf Extract, Salicylic Acid (0.5%), Hamamelis Virginiana (Witch Hazel) Water, Aloe Barbadensis Leaf Juice, Glycerin, Panthenol, Sodium PCA, Phenoxyethanol, Ethylhexylglycerin.',
    allergens:
      // Kept consistent with the age-guidance line below and the FAQ, which
      // both say "consult"; the previous absolute "Avoid during pregnancy"
      // contradicted them on the same page.
      'Contains Salicylic Acid — avoid if allergic to aspirin. Consult your healthcare provider before use during pregnancy or breastfeeding. Free from: Alcohol Denat, Parabens, Sulphates.',
    patchTest: true,
    agingNote:
      'Contains Salicylic Acid (BHA). Recommended for ages 12+. Consult your healthcare provider before use during pregnancy.',
    freeFrom: ['Alcohol Denat', 'Parabens', 'Sulphates'],
    countryOfOrigin: 'India',
    manufacturer: LOCAL_MANUFACTURER,
    packer: LOCAL_PACKER,
    importer: null,
    cdSCoImportLicence: null,
  },
  /* Turmeric Brightening Cleanser */
  4: {
    pao: 12,
    inci: 'Aqua (Water), Coco-Glucoside, Glycerin, Curcuma Longa (Turmeric) Root Extract, Azadirachta Indica (Neem) Leaf Extract, Aloe Barbadensis Leaf Juice, Panthenol, Citric Acid, Phenoxyethanol, Ethylhexylglycerin.',
    allergens:
      'Contains Curcuma Longa (Turmeric) — may temporarily stain light fabrics. Free from: SLS, SLES, Parabens, Synthetic Fragrance. Avoid contact with eyes.',
    patchTest: true,
    agingNote: null,
    freeFrom: ['SLS', 'SLES', 'Parabens', 'Synthetic Fragrance'],
    countryOfOrigin: 'India',
    manufacturer: LOCAL_MANUFACTURER,
    packer: LOCAL_PACKER,
    importer: null,
    cdSCoImportLicence: null,
  },
  /* Botanical Mineral Sun Shield */
  5: {
    pao: 12,
    inci: 'Aqua (Water), Zinc Oxide (20%) [Non-nano], Aloe Barbadensis Leaf Juice, Tocopherol (Vitamin E), Caprylic/Capric Triglyceride, Glycerin, Cetearyl Alcohol, Phenoxyethanol, Ethylhexylglycerin.',
    allergens:
      'Free from: Oxybenzone, Octinoxate, Avobenzone, Parabens, Synthetic Fragrance. Contains Non-nano Zinc Oxide. Independent SPF and environmental-impact evidence is in review.',
    patchTest: false,
    agingNote:
      'Reapply every 2 hours when outdoors. For children or infants under 6 months, consult a paediatrician.',
    freeFrom: ['Oxybenzone', 'Octinoxate', 'Avobenzone', 'Parabens', 'Synthetic Fragrance'],
    countryOfOrigin: 'India',
    manufacturer: LOCAL_MANUFACTURER,
    packer: LOCAL_PACKER,
    importer: null,
    cdSCoImportLicence: null,
  },
  /* Wild Berry Lip Elixir */
  6: {
    pao: 18,
    inci: 'Caprylic/Capric Triglyceride, Butyrospermum Parkii (Shea) Butter, Vaccinium Myrtillus (Bilberry) Fruit Extract, Tocopherol (Vitamin E), Cocos Nucifera (Coconut) Oil, Flavor (Natural Berry), Ricinus Communis (Castor) Seed Oil, Beeswax (Cera Alba).',
    allergens:
      'Contains Beeswax (not suitable for strict vegans — use Vegan Lip Gloss alternative). Contains Natural Berry Flavour. Free from: Parabens, Synthetic Fragrance, Mineral Oil.',
    patchTest: false,
    agingNote: null,
    freeFrom: ['Parabens', 'Synthetic Fragrance', 'Mineral Oil'],
    countryOfOrigin: 'India',
    manufacturer: LOCAL_MANUFACTURER,
    packer: LOCAL_PACKER,
    importer: null,
    cdSCoImportLicence: null,
  },
  /* Niacinamide Pore Serum */
  7: {
    pao: 12,
    inci: 'Aqua (Water), Niacinamide (10%), Zinc PCA (1%), Sodium Hyaluronate (Hyaluronic Acid), Glycerin, Allantoin, Panthenol, Pentylene Glycol, Phenoxyethanol, Ethylhexylglycerin, Carbomer, Sodium Hydroxide.',
    allergens:
      'Free from: Parabens, Sulphates, Synthetic Fragrance, Alcohol Denat, Mineral Oil. Niacinamide at concentrations above 5% may cause temporary flushing in highly reactive skin — perform a patch test.',
    patchTest: true,
    agingNote: null,
    freeFrom: ['Parabens', 'Sulphates', 'Synthetic Fragrance', 'Alcohol Denat', 'Mineral Oil'],
    countryOfOrigin: 'India',
    manufacturer: LOCAL_MANUFACTURER,
    packer: LOCAL_PACKER,
    importer: null,
    cdSCoImportLicence: null,
  },
  /* Shea Butter Night Cream */
  8: {
    pao: 12,
    inci: 'Aqua (Water), Butyrospermum Parkii (Shea) Butter (Unrefined), Tocopherol (Vitamin E), Bakuchiol (0.2%), Squalane (Plant-derived), Glycerin, Cetearyl Alcohol, Cetyl Alcohol, Sodium Hyaluronate, Phenoxyethanol, Ethylhexylglycerin.',
    allergens:
      'Contains Cetearyl Alcohol. Free from: Parabens, Synthetic Fragrance, Mineral Oil, Alcohol Denat. If pregnant, breastfeeding, or under medical care, consult your healthcare provider before use.',
    patchTest: true,
    agingNote: null,
    freeFrom: ['Parabens', 'Synthetic Fragrance', 'Mineral Oil', 'Alcohol Denat'],
    countryOfOrigin: 'India',
    manufacturer: LOCAL_MANUFACTURER,
    packer: LOCAL_PACKER,
    importer: null,
    cdSCoImportLicence: null,
  },
}

export function getProductCompliance(
  product: Pick<Product, 'id' | 'slug'> | null | undefined,
  routeId?: string
): ProductCompliance {
  if (!product) return DEFAULT_PRODUCT_COMPLIANCE
  return (
    PRODUCT_COMPLIANCE[product.id] ??
    (product.slug ? PRODUCT_COMPLIANCE[product.slug] : undefined) ??
    (routeId ? PRODUCT_COMPLIANCE[routeId] : undefined) ??
    DEFAULT_PRODUCT_COMPLIANCE
  )
}
