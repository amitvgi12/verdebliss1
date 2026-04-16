import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor':   ['react', 'react-dom', 'react-router-dom'],
          'motion-vendor':  ['framer-motion'],
          'supabase-vendor':['@supabase/supabase-js'],
          'ui-vendor':      ['lucide-react', 'zustand'],
        },
      },
    },
  },
  /* ── Vitest config (co-located with Vite so aliases are shared) ── */
  test: {
    globals: true,           // describe / it / expect without importing
    environment: 'jsdom',    // simulates a browser DOM
    setupFiles: ['./src/tests/setup.js'],
    css: false,              // skip CSS parsing — speeds up tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/tests/**', 'src/main.jsx'],
    },
  },
})
