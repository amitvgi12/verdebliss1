import { defineConfig, devices } from '@playwright/test'

const sharedEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'anon-key',
  NEXT_PUBLIC_RAZORPAY_KEY_ID:
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? 'rzp_test_accessibility',
}

export default defineConfig({
  testDir: './tests/a11y',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:3010',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // CI: verify script runs `npm run build` before `test:a11y`, so the app is
  // already built here — just start it. Local dev: reuse the existing dev server
  // if one is running, otherwise start one.
  webServer: process.env.CI
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
