import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

// __dirname equivalent for ESM (fixes: '__dirname' is not defined)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'tests/a11y/**',
      'tests/e2e/**',
      'tests/live/**',
      'tests/visual/**',
    ],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'app/**/*.{ts,tsx}',
        'components/**/*.{ts,tsx}',
        'store/**/*.ts',
        'lib/**/*.{ts,tsx}',
      ],
      thresholds: {
        statements: 26,
        branches: 22,
        functions: 23,
        lines: 27,
      },
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
