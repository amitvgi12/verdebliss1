/**
 * theme.js — VerdeBliss design tokens
 *
 * Earth tone palette: olive · ivory · gold as primary surface language.
 * Every background surface is warm — no cold whites or greys anywhere.
 *
 * Colour roles:
 *  bg          — page canvas (warm cream)
 *  card        — card/panel surface (barely-warm white — distinct from bg)
 *  warmWhite   — modal interiors, form inputs (slightly cooler than card for legibility)
 *  forest      — primary CTA, nav active, headings on dark
 *  forestLight — hover states on forest elements
 *  sage        — secondary accents, tags, icons
 *  sagePale    — sage tinted backgrounds, chips, badges
 *  terra       — terracotta accents, promo labels, CTAs
 *  terraPale   — terra tinted surfaces
 *  gold        — price displays, star ratings, section labels, active states
 *  goldPale    — gold tinted surfaces (loyalty, premium indicators)
 *  ivory       — section alternates, card hover surfaces, form inputs
 *  olive       — olive green text on ivory backgrounds (earth tone label)
 *  text        — primary body text (deep forest-tinted dark)
 *  muted       — secondary text (warm stone — not cold grey)
 *  light       — tertiary / disabled text
 *  border      — subtle earth-toned dividers
 */
export const C = {
  /* Surfaces */
  bg:          '#FAF7F2',   // warm cream — page canvas
  card:        '#FDFAF6',   // barely-warm white — cards, drawers, panels (NOT pure #FFF)
  warmWhite:   '#FFFEF9',   // form inputs, modals where max legibility needed

  /* Brand greens */
  forest:      '#2D4A32',
  forestLight: '#3D6344',

  /* Sage / Olive */
  sage:        '#7D9B76',
  sagePale:    '#EAF0E8',
  olive:       '#5C7A52',   // olive text on pale backgrounds

  /* Terracotta */
  terra:       '#C07A5A',
  terraPale:   '#F6EDE8',

  /* Gold — KEY earth tone, should appear on prices, labels, accents */
  gold:        '#BFA06A',
  goldPale:    '#F5EDD8',   // warm gold-tinted surface

  /* Ivory */
  ivory:       '#F2EAE0',   // section backgrounds, card hover, inputs

  /* Text */
  text:        '#1C221E',   // deep forest-tinted dark
  muted:       '#6B7A5E',   // warm stone — replaces cold #6E7D71
  light:       '#A8BAA9',

  /* Structure */
  border:      '#E4DAD0',   // warm earth dividers
}

export const FONT = {
  serif: "'Cormorant Garamond', Georgia, serif",
  sans:  "'DM Sans', system-ui, sans-serif",
}
