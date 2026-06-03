import { defineConfig, devices } from '@playwright/test'

const sharedEnv = {
  NEXT_PUBLIC_SUPABASE_URL:
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'anon-key',
  NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? 'rzp_test_accessibility',
  RAZORPAY_WEBHOOK_SECRET:
    process.env.RAZORPAY_WEBHOOK_SECRET ?? process.env.E2E_RAZORPAY_WEBHOOK_SECRET ?? '',
  // Allows the production-mode test server to serve price-0 static product shells
  // instead of returning 404. Never set on Vercel — only for Playwright test runs.
  E2E_STATIC_CATALOGUE: '1',
}

export default defineConfig({
  testDir: './tests',
  testMatch: ['a11y/**/*.spec.ts', 'e2e/**/*.spec.ts', 'visual/**/*.spec.ts'],
  timeout: 60_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
    },
  },
  fullyParallel: true,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    // PLAYWRIGHT_BASE_URL lets you point the suite at the live production site
    // (or any already-running server) without starting a local server at all.
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3010',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Skip webServer entirely when an external base URL is provided.
  // CI: verify script runs `npm run build` before `test:a11y`, so the app is
  // already built here — just start it. Local dev: reuse the existing dev server
  // if one is running, otherwise start one.
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : process.env.CI
      ? {
          command: 'npm run start -- --hostname 127.0.0.1 --port 3010',
          url: 'http://127.0.0.1:3010',
          reuseExistingServer: false,
          timeout: 30_000,
          env: sharedEnv,
        }
      : {
          command: 'npm run dev -- --hostname 127.0.0.1 --port 3010',
          url: 'http://127.0.0.1:3010',
          reuseExistingServer: true,
          timeout: 120_000,
          env: sharedEnv,
        },
})
