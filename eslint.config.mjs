import nextPlugin from '@next/eslint-plugin-next'
import js from '@eslint/js'

export default [
  js.configs.recommended,

  {
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs['core-web-vitals'].rules,
      // 🔒 Hardening rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
    },
  },

  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'dist/**'
    ],
  },
]