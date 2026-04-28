import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'url'

// __dirname equivalent for ESM (fixes: '__dirname' is not defined)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['app/**/*.{js,jsx}', 'components/**/*.{js,jsx}', 'store/**/*.js'],
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
