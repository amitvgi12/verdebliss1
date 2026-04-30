import nextPlugin from '@next/eslint-plugin-next'
import js from '@eslint/js'
import globals from 'globals'

export default [
  js.configs.recommended,

  // ── Next.js rules ─────────────────────────────────────────────────
  {
    plugins: { '@next/next': nextPlugin },
    rules: { ...nextPlugin.configs['core-web-vitals'].rules },
  },

  // ── JSX + browser globals — all JS/JSX source files ───────────────
  {
    files: ['**/*.{js,jsx,mjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },  // ← enables JSX parsing everywhere
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
  },

  // ── Node globals — config files + API routes + server libs ────────
  {
    files: [
      '*.config.{js,mjs,cjs}',
      'next.config.js',
      'vitest.config.js',
      'lib/**/*.js',
      'app/api/**/*.js',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
  },

  // ── Vitest test globals ────────────────────────────────────────────
  {
    files: ['tests/**/*.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
        describe: 'readonly', it: 'readonly', test: 'readonly',
        expect: 'readonly', vi: 'readonly',
        beforeEach: 'readonly', afterEach: 'readonly',
        beforeAll: 'readonly', afterAll: 'readonly',
      },
    },
  },

  // ── Ignored paths ──────────────────────────────────────────────────
  {
    ignores: ['.next/**', 'node_modules/**', 'dist/**', 'coverage/**'],
  },
]
