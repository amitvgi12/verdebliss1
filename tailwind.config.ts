import type { Config } from 'tailwindcss'

/**
 * Tailwind v4 derives most theme tokens from the @theme block in
 * app/globals.css; this config is mostly a content allow-list and a place to
 * hang utilities Tailwind v4 doesn't infer (e.g. the screens defaults). We
 * keep both for IDE safety and as a fallback when a v3-style plugin is added.
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces
        bg: '#FAF7F2',
        card: '#FDFAF6',
        warmWhite: '#FFFEF9',
        // Brand greens
        forest: '#2D4A32',
        forestLight: '#3D6344',
        // Sage / Olive
        sage: '#7D9B76',
        sagePale: '#EAF0E8',
        olive: '#5C7A52',
        // Terracotta
        terra: '#C07A5A',
        terraPale: '#F6EDE8',
        // Gold
        gold: '#BFA06A',
        goldText: '#8B6914',
        goldPale: '#F5EDD8',
        // Ivory
        ivory: '#F2EAE0',
        // Text
        text: '#1C221E',
        muted: '#6B7A5E',
        light: '#A8BAA9',
        // Structure
        border: '#E4DAD0',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'DM Sans', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Cormorant Garamond', 'Georgia', 'serif'],
      },
      maxWidth: {
        content: '1200px',
      },
    },
  },
}

export default config
