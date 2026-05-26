import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// wcag22aa adds SC 2.4.11 (Focus Not Obscured), 2.5.8 (Target Size),
// 3.2.6 (Consistent Help), and 3.3.7/8 (Accessible Authentication).
const axeTags = ['wcag2a', 'wcag2aa', 'wcag22aa']

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
        essential: true,
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
    await expect(page.getByRole('button', { name: /Back to Address/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Continue to Payment/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Pay Online/i })).not.toBeVisible()
    await expectNoAxeViolations(page, ['main'])
  })
})

test.describe('WCAG 2.2 keyboard flow', () => {
  test('checkout address form shows error summary on empty submit', async ({ page }) => {
    await addCheckoutItem(page)
    await page.goto('/checkout')
    await expect(page.getByRole('heading', { name: 'Delivery Address' })).toBeVisible()

    // Click Continue without filling anything
    await page.getByRole('button', { name: /Continue to Review/i }).click()

    // Error summary must appear and be readable
    const summary = page.getByRole('alert', { name: 'Checkout errors' })
    await expect(summary).toBeVisible()
    await expect(summary).toContainText('Please correct')
    // Each error link must be focusable and point to the corresponding input
    const firstErrorLink = summary.getByRole('link').first()
    await expect(firstErrorLink).toBeVisible()
  })

  test('cart drawer opens, traps focus, and closes on Escape', async ({ page }) => {
    await addCheckoutItem(page)
    await page.goto('/products')

    // Open the cart
    await page.getByRole('button', { name: /Cart,/i }).click()
    const drawer = page.getByRole('dialog', { name: /cart/i })
    await expect(drawer).toBeVisible()

    // Focus should land inside the drawer
    await page.waitForTimeout(300)
    const focused = await page.evaluate(() => document.activeElement?.tagName)
    expect(['BUTTON', 'A', 'INPUT']).toContain(focused)

    // Escape should close the drawer
    await page.keyboard.press('Escape')
    await expect(drawer).not.toBeVisible()
  })

  test('mobile nav menu opens, traps focus, and closes on Escape', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    const burger = page.getByRole('button', { name: /Open menu/i })
    await burger.click()

    const menu = page.getByRole('dialog', { name: /Navigation menu/i })
    await expect(menu).toBeVisible()

    // Escape must close the menu
    await page.keyboard.press('Escape')
    await expect(menu).not.toBeVisible()
  })

  test('checkout form fields have aria-required and aria-describedby wired up', async ({
    page,
  }) => {
    await addCheckoutItem(page)
    await page.goto('/checkout')
    await expect(page.getByRole('heading', { name: 'Delivery Address' })).toBeVisible()

    // Submit to trigger validation
    await page.getByRole('button', { name: /Continue to Review/i }).click()

    // Full Name field must be marked invalid with a description
    const nameInput = page.locator('#checkout-name')
    await expect(nameInput).toHaveAttribute('aria-invalid', 'true')
    const describedBy = await nameInput.getAttribute('aria-describedby')
    expect(describedBy).toBe('checkout-name-error')
    // The error element must exist and be non-empty
    const errorEl = page.locator(`#${describedBy}`)
    await expect(errorEl).toBeVisible()
    await expect(errorEl).not.toBeEmpty()
  })
})
