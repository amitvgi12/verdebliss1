import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const axeTags = ['wcag2a', 'wcag2aa']

async function suppressCookieModal(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'vb_cookie_consent',
      JSON.stringify({
        version: '1.2',
        essential: true,
        timestamp: new Date().toISOString(),
        analytics: false,
        marketing: false,
        functional_third_party: false,
      })
    )
  })
}

async function expectNoAxeViolations(page: Page, selector: string) {
  await page.waitForTimeout(700)
  const results = await new AxeBuilder({ page }).withTags(axeTags).include(selector).analyze()
  expect(results.violations).toEqual([])
}

test.describe('PDP, quiz, and account accessibility', () => {
  test('product detail page passes axe AA checks', async ({ page }) => {
    await suppressCookieModal(page)
    await page.goto('/products/bakuchiol-renewal-serum')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expectNoAxeViolations(page, 'main')
  })

  test('quiz page passes axe AA checks', async ({ page }) => {
    await suppressCookieModal(page)
    await page.goto('/quiz')
    // Wait for the first quiz question to render
    await expect(page.getByRole('radiogroup')).toBeVisible()
    await expectNoAxeViolations(page, 'main')
  })

  test('account page (unauthenticated) passes axe AA checks', async ({ page }) => {
    await suppressCookieModal(page)
    await page.goto('/account')
    // Unauthenticated state: sign-in form or redirect to login
    await page.waitForLoadState('networkidle')
    await expectNoAxeViolations(page, 'main')
  })
})
