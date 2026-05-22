import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const axeTags = ['wcag2a', 'wcag2aa']

async function expectNoAxeViolations(page: Page, selectors: string[]) {
  await page.waitForTimeout(700)
  const builder = new AxeBuilder({ page }).withTags(axeTags)

  for (const selector of selectors) {
    builder.include(selector)
  }

  const results = await builder.analyze()
  expect(results.violations).toEqual([])
}

async function addCheckoutItem(page: Page) {
  // Inject consent into localStorage before the page loads so the cookie
  // modal never mounts visible and cannot intercept pointer events.
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'vb_cookie_consent',
      JSON.stringify({
        version: '1.2',
        timestamp: new Date().toISOString(),
        analytics: false,
        marketing: false,
        functional_third_party: false,
      })
    )
  })
  await page.goto('/products')
  await page
    .getByRole('button', { name: /Add .* to cart/i })
    .first()
    .click()
  await expect(page.getByRole('button', { name: /Cart, 1 items/i })).toBeVisible()
}

async function seedGuestCheckoutAddress(page: Page) {
  await page.evaluate(() => {
    window.sessionStorage.setItem(
      'verdebliss-checkout-address',
      JSON.stringify({
        name: 'Kavya Menon',
        email: 'kavya@verdebliss.test',
        phone: '9876543210',
        line1: 'Flat 4B, Green Heights',
        line2: '',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411014',
      })
    )
  })
}

test.describe('core accessibility surfaces', () => {
  test('navigation and footer pass axe AA checks', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('navigation').first()).toBeVisible()
    await expect(page.getByRole('contentinfo')).toBeVisible()

    await expectNoAxeViolations(page, ['nav', 'footer'])
  })

  test('checkout address state passes axe AA checks', async ({ page }) => {
    await addCheckoutItem(page)
    await page.goto('/checkout')

    await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Delivery Address' })).toBeVisible()
    await expectNoAxeViolations(page, ['main'])
  })

  test('checkout review state passes axe AA checks', async ({ page }) => {
    await addCheckoutItem(page)
    await seedGuestCheckoutAddress(page)
    await page.goto('/checkout')

    await expect(page.getByRole('heading', { name: 'Delivery Address' })).toBeVisible()
    await expect(page.locator('#checkout-pincode')).toHaveValue('411014')
    await page.waitForTimeout(800)
    await page.getByRole('button', { name: /Continue to Review/i }).click()

    await expect(page.getByRole('heading', { name: 'Review Your Order' })).toBeVisible()
    await expect(page.getByText('ORDER ITEMS')).toBeVisible()
    await expectNoAxeViolations(page, ['main'])
  })
})
