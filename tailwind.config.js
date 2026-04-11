/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest:  '#2D4A32',
        sage:    '#7D9B76',
        terra:   '#C07A5A',
        ivory:   '#F2EAE0',
        cream:   '#FAF7F2',
        gold:    '#BFA06A',
        border:  '#E4DAD0',
        muted:   '#6E7D71',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans:  ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
