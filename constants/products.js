// Used as fallback when Supabase is unavailable or during development
export const PRODUCTS = [
  { id:'1', name:'Bakuchiol Renewal Serum',      category:'Serum',       price:2850, rating:4.8, review_count:124, skin_types:['Dry','Combination'],  badges:['Vegan','Organic Certified'], description:'Plant-based retinol alternative for visible cell renewal without irritation.', ingredient:'Bakuchiol',   bg_color:'#EBF0E9', emoji:'🌿' },
  { id:'2', name:'Rose Hip Glow Moisturiser',    category:'Moisturiser', price:1990, rating:4.7, review_count:89,  skin_types:['Dry','Sensitive'],    badges:['Cruelty-Free','Vegan'],      description:'Rich cloud-like hydration with rosehip oil and ceramides for lasting softness.',ingredient:'Rose Hip',    bg_color:'#F6EDE8', emoji:'🌹' },
  { id:'3', name:'Green Tea Clarity Toner',      category:'Toner',       price:1450, rating:4.5, review_count:67,  skin_types:['Oily','Combination'], badges:['Vegan','Organic Certified'], description:'Balance oil and refine pores with antioxidant-rich green tea extract.',          ingredient:'Green Tea',   bg_color:'#E8F2EA', emoji:'🍃' },
  { id:'4', name:'Turmeric Brightening Cleanser',category:'Cleanser',    price:1250, rating:4.6, review_count:103, skin_types:['All Types'],          badges:['Cruelty-Free','Organic Certified'], description:'Gentle foam cleanser with turmeric and neem for a luminous complexion.', ingredient:'Turmeric',    bg_color:'#F5F0E4', emoji:'✨' },
  { id:'5', name:'Botanical SPF 50 Shield',      category:'SPF',         price:2200, rating:4.9, review_count:215, skin_types:['All Types'],          badges:['Vegan','Cruelty-Free'],      description:'Featherlight mineral sunscreen with zinc oxide and soothing aloe vera.',         ingredient:'Zinc Oxide',  bg_color:'#FFF8E8', emoji:'☀️' },
  { id:'6', name:'Wild Berry Lip Elixir',        category:'Lip Care',    price:890,  rating:4.4, review_count:58,  skin_types:['All Types'],          badges:['Vegan','Organic Certified'], description:'Nourishing lip treatment with acai berry and shea for pillowy softness.',        ingredient:'Acai Berry',  bg_color:'#F0E8F5', emoji:'🫐' },
  { id:'7', name:'Niacinamide Pore Serum',       category:'Serum',       price:2450, rating:4.7, review_count:142, skin_types:['Oily','Combination'], badges:['Vegan','Cruelty-Free'],      description:'Minimise pores and control sebum with a 10% niacinamide complex.',              ingredient:'Niacinamide', bg_color:'#E8EFF5', emoji:'💧' },
  { id:'8', name:'Shea Butter Night Cream',      category:'Moisturiser', price:2650, rating:4.8, review_count:76,  skin_types:['Dry','Sensitive'],    badges:['Organic Certified','Cruelty-Free'], description:'Intensive overnight repair with shea butter and vitamin E for morning glow.', ingredient:'Shea Butter', bg_color:'#F5EBF0', emoji:'🌙' },
]

export const CATEGORIES = ['All','Serum','Moisturiser','Toner','Cleanser','SPF','Lip Care']
export const SKIN_TYPES  = ['All','Dry','Oily','Combination','Sensitive']
export const SORT_OPTIONS = ['Bestselling','Price Low→High','Price High→Low','Top Rated']

export const TIERS = [
  { name:'Green Leaf',       min:0,    max:499,  color:'#3D6344', emoji:'🌿' },
  { name:'Gold Botanist',    min:500,  max:1499, color:'#BFA06A', emoji:'🏆' },
  { name:'Platinum Alchemist',min:1500,max:Infinity,color:'#7B8FA6',emoji:'💎' },
]
