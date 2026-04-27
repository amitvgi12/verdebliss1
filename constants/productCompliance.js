/**
 * productCompliance.js
 * Per-product compliance data:
 *   - INCI ingredient list in descending concentration (CDSCO / EU Cosmetics Regulation)
 *   - Allergen warnings per product
 *   - PAO (Period After Opening) in months
 *   - Free-from claims (verifiable)
 *   - Age guidance where applicable
 */

export const PRODUCT_COMPLIANCE = {
  /* Bakuchiol Renewal Serum */
  '1': {
    pao: 12,
    inci: 'Aqua (Water), Bakuchiol (0.5%), Simmondsia Chinensis (Jojoba) Seed Oil, Tocopherol (Vitamin E), Sodium Hyaluronate (Hyaluronic Acid), Glycerin, Panthenol, Niacinamide, Cetyl Alcohol, Cetearyl Alcohol, Phenoxyethanol, Ethylhexylglycerin.',
    allergens: 'Contains Cetearyl Alcohol (fatty alcohol, not drying alcohol). Free from: Parabens, Sulphates, Synthetic Fragrance, Mineral Oil, Phthalates. Suitable for use during pregnancy (consult your healthcare provider).',
    patchTest: true,
    agingNote: null,
    freeFrom: ['Parabens', 'Sulphates', 'Synthetic Fragrance', 'Mineral Oil', 'Phthalates'],
  },
  /* Rose Hip Glow Moisturiser */
  '2': {
    pao: 12,
    inci: 'Aqua (Water), Rosa Canina (Rosehip) Fruit Oil, Glycerin, Ceramide NP, Ceramide AP, Ceramide EOP, Niacinamide, Ascorbic Acid (Vitamin C), Phenoxyethanol, Ethylhexylglycerin, Carbomer, Sodium Hydroxide.',
    allergens: 'Contains Rosa Canina (Rosehip) Oil. Free from: Parabens, Sulphates, Synthetic Fragrance, Alcohol Denat. Perform a patch test before use, especially if sensitive to rose-family botanicals.',
    patchTest: true,
    agingNote: null,
    freeFrom: ['Parabens', 'Sulphates', 'Synthetic Fragrance', 'Alcohol Denat'],
  },
  /* Green Tea Clarity Toner */
  '3': {
    pao: 12,
    inci: 'Aqua (Water), Camellia Sinensis (Green Tea) Leaf Extract, Salicylic Acid (0.5%), Hamamelis Virginiana (Witch Hazel) Water, Aloe Barbadensis Leaf Juice, Glycerin, Panthenol, Sodium PCA, Phenoxyethanol, Ethylhexylglycerin.',
    allergens: 'Contains Salicylic Acid — avoid if allergic to aspirin. Avoid during pregnancy. Free from: Alcohol Denat, Parabens, Sulphates.',
    patchTest: true,
    agingNote: 'Contains Salicylic Acid (BHA). Recommended for ages 12+. Consult a dermatologist before use during pregnancy.',
    freeFrom: ['Alcohol Denat', 'Parabens', 'Sulphates'],
  },
  /* Turmeric Brightening Cleanser */
  '4': {
    pao: 12,
    inci: 'Aqua (Water), Coco-Glucoside, Glycerin, Curcuma Longa (Turmeric) Root Extract, Azadirachta Indica (Neem) Leaf Extract, Aloe Barbadensis Leaf Juice, Panthenol, Citric Acid, Phenoxyethanol, Ethylhexylglycerin.',
    allergens: 'Contains Curcuma Longa (Turmeric) — may temporarily stain light fabrics. Free from: SLS, SLES, Parabens, Synthetic Fragrance. Avoid contact with eyes.',
    patchTest: true,
    agingNote: null,
    freeFrom: ['SLS', 'SLES', 'Parabens', 'Synthetic Fragrance'],
  },
  /* Botanical SPF 50 Shield */
  '5': {
    pao: 12,
    inci: 'Aqua (Water), Zinc Oxide (20%) [Non-nano], Aloe Barbadensis Leaf Juice, Tocopherol (Vitamin E), Caprylic/Capric Triglyceride, Glycerin, Cetearyl Alcohol, Phenoxyethanol, Ethylhexylglycerin.',
    allergens: 'Free from: Chemical UV filters (Oxybenzone, Octinoxate, Avobenzone), Parabens, Synthetic Fragrance. Contains Non-nano Zinc Oxide — reef-safe formulation.',
    patchTest: false,
    agingNote: 'Suitable for all ages. Reapply every 2 hours when outdoors. For infants under 6 months, consult a paediatrician.',
    freeFrom: ['Oxybenzone', 'Octinoxate', 'Avobenzone', 'Parabens', 'Synthetic Fragrance'],
  },
  /* Wild Berry Lip Elixir */
  '6': {
    pao: 18,
    inci: 'Caprylic/Capric Triglyceride, Butyrospermum Parkii (Shea) Butter, Vaccinium Myrtillus (Bilberry) Fruit Extract, Tocopherol (Vitamin E), Cocos Nucifera (Coconut) Oil, Flavor (Natural Berry), Ricinus Communis (Castor) Seed Oil, Beeswax (Cera Alba).',
    allergens: 'Contains Beeswax (not suitable for strict vegans — use Vegan Lip Gloss alternative). Contains Natural Berry Flavour. Free from: Parabens, Synthetic Fragrance, Mineral Oil.',
    patchTest: false,
    agingNote: null,
    freeFrom: ['Parabens', 'Synthetic Fragrance', 'Mineral Oil'],
  },
  /* Niacinamide Pore Serum */
  '7': {
    pao: 12,
    inci: 'Aqua (Water), Niacinamide (10%), Zinc PCA (1%), Sodium Hyaluronate (Hyaluronic Acid), Glycerin, Allantoin, Panthenol, Pentylene Glycol, Phenoxyethanol, Ethylhexylglycerin, Carbomer, Sodium Hydroxide.',
    allergens: 'Free from: Parabens, Sulphates, Synthetic Fragrance, Alcohol Denat, Mineral Oil. Niacinamide at concentrations above 5% may cause temporary flushing in highly reactive skin — perform a patch test.',
    patchTest: true,
    agingNote: null,
    freeFrom: ['Parabens', 'Sulphates', 'Synthetic Fragrance', 'Alcohol Denat', 'Mineral Oil'],
  },
  /* Shea Butter Night Cream */
  '8': {
    pao: 12,
    inci: 'Aqua (Water), Butyrospermum Parkii (Shea) Butter (Unrefined), Tocopherol (Vitamin E), Bakuchiol (0.2%), Squalane (Plant-derived), Glycerin, Cetearyl Alcohol, Cetyl Alcohol, Sodium Hyaluronate, Phenoxyethanol, Ethylhexylglycerin.',
    allergens: 'Contains Cetearyl Alcohol. Free from: Parabens, Synthetic Fragrance, Mineral Oil, Alcohol Denat. Suitable for use during pregnancy — consult your healthcare provider.',
    patchTest: true,
    agingNote: null,
    freeFrom: ['Parabens', 'Synthetic Fragrance', 'Mineral Oil', 'Alcohol Denat'],
  },
}
