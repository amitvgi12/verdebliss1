import nextPlugin from '@next/eslint-plugin-next'
import js from '@eslint/js'
import globals from 'globals'

export default [
  js.configs.recommended,

  // ── Next.js core web vitals rules ────────────────────────────────
  {
    plugins: { '@next/next': nextPlugin },
    rules: { ...nextPlugin.configs['core-web-vitals'].rules },
  },

  // ── Browser globals (window, fetch, setTimeout, URLSearchParams…)
  // Applies to: client components, hooks, stores, test setup
  {
    files: [
      'components/**/*.{js,jsx}',
      'hooks/**/*.{js,jsx}',
      'store/**/*.{js,jsx}',
      'app/**/*.{js,jsx}',
      'tests/**/*.{js,jsx}',
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
  },

  // ── Node.js globals (process, console, module, __dirname, require)
  // Applies to: config files, API routes, server utilities
  {
    files: [
      '*.config.{js,mjs,cjs}',
      'next.config.js',
      'vitest.config.js',
      'lib/**/*.{js,ts}',
      'app/api/**/*.{js,ts}',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
  },

  // ── Vitest test globals (describe, it, expect, vi, beforeEach…)
  {
    files: ['tests/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
        // vitest globals (enabled via vitest.config.js globals:true)
        describe: 'readonly',
        it:       'readonly',
        test:     'readonly',
        expect:   'readonly',
        vi:       'readonly',
        beforeEach: 'readonly',
        afterEach:  'readonly',
        beforeAll:  'readonly',
        afterAll:   'readonly',
      },
    },
  },

  // ── Ignored paths ────────────────────────────────────────────────
  {
    ignores: ['.next/**', 'node_modules/**', 'dist/**', 'coverage/**'],
  },
]
