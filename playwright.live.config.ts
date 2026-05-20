import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/live',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL:
      process.env.LIVE_BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? 'https://www.verdebliss.com',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-live',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
