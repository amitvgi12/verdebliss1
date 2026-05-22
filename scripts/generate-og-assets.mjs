import { Buffer } from 'node:buffer'
import sharp from 'sharp'

const PRODUCTS = [
  [
    'bakuchiol-renewal-serum',
    'Bakuchiol Renewal Serum',
    'Plant-based renewal serum',
    '/images/products/serum.webp',
  ],
  [
    'rose-hip-glow-moisturiser',
    'Rose Hip Glow Moisturiser',
    'Cloud-soft daily hydration',
    '/images/products/moisturiser.webp',
  ],
  [
    'green-tea-clarity-toner',
    'Green Tea Clarity Toner',
    'Antioxidant clarity ritual',
    '/images/products/toner.webp',
  ],
  [
    'turmeric-brightening-cleanser',
    'Turmeric Brightening Cleanser',
    'Gentle botanical cleanse',
    '/images/products/cleanser.webp',
  ],
  [
    'botanical-spf-50-shield',
    'Botanical SPF 50 Shield',
    'Mineral daily sun care',
    '/images/products/spf.webp',
  ],
  [
    'wild-berry-lip-elixir',
    'Wild Berry Lip Elixir',
    'Nourishing lip ritual',
    '/images/products/lip-elixir.webp',
  ],
  [
    'niacinamide-pore-serum',
    'Niacinamide Pore Serum',
    'Pore-refining serum',
    '/images/products/niacinamide-serum.webp',
  ],
  [
    'shea-butter-night-cream',
    'Shea Butter Night Cream',
    'Overnight barrier comfort',
    '/images/products/night-cream.webp',
  ],
]

function escapeXml(value) {
  return value.replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char])
}

function wrapTitle(value) {
  const words = value.split(/\s+/)
  const lines = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > 22 && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }

  if (current) lines.push(current)
  return lines.slice(0, 2)
}

function ogSvg(title, subtitle) {
  const titleLines = wrapTitle(title)
  const titleText = titleLines
    .map(
      (line, index) =>
        `<text x="96" y="${270 + index * 74}" fill="#1c221e" font-family="Georgia, serif" font-size="64" font-weight="500">${escapeXml(line)}</text>`
    )
    .join('')
  const subtitleY = titleLines.length > 1 ? 390 : 338

  return Buffer.from(`
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#fffdf9"/>
          <stop offset="0.55" stop-color="#f4eee5"/>
          <stop offset="1" stop-color="#dce8d7"/>
        </linearGradient>
        <radialGradient id="halo" cx="70%" cy="48%" r="48%">
          <stop offset="0" stop-color="#7d9b76" stop-opacity=".34"/>
          <stop offset="1" stop-color="#7d9b76" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)"/>
      <rect width="1200" height="630" fill="url(#halo)"/>
      <circle cx="880" cy="315" r="246" fill="#2d4a32" opacity=".09"/>
      <rect x="76" y="72" width="1048" height="486" rx="44" fill="none" stroke="#2d4a32" stroke-opacity=".16"/>
      <text x="96" y="180" fill="#bfa06a" font-family="Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="7">INCI-FIRST BOTANICAL SKINCARE</text>
      ${titleText}
      <text x="98" y="${subtitleY}" fill="#5f7058" font-family="Arial, sans-serif" font-size="30" font-weight="500">${escapeXml(subtitle)}</text>
      <text x="98" y="434" fill="#2d4a32" font-family="Arial, sans-serif" font-size="25" font-weight="700">VerdeBliss Cosmetics</text>
      <text x="98" y="475" fill="#6b7a64" font-family="Arial, sans-serif" font-size="21">Verified reviews after purchase · MRP inclusive of all taxes</text>
    </svg>
  `)
}

async function writeOgAsset(output, title, subtitle, imagePath) {
  const product = await sharp(`public${imagePath}`)
    .resize({ height: 500, fit: 'contain' })
    .png()
    .toBuffer()

  await sharp(ogSvg(title, subtitle))
    .composite([{ input: product, left: 760, top: 70 }])
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(output)
}

await writeOgAsset(
  'public/og/home.jpg',
  'Pure. Botanical. Radiant.',
  'Luxury skincare rooted in nature',
  '/images/products/serum.webp'
)

for (const [slug, title, subtitle, imagePath] of PRODUCTS) {
  await writeOgAsset(`public/og/products/${slug}.jpg`, title, subtitle, imagePath)
}
