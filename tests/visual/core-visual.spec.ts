import { expect, test, type Page } from '@playwright/test'
import { E2E_ADDRESS, seedCart, seedCheckoutAddress, seedConsent } from '../e2e/helpers'

test.use({ colorScheme: 'light' })

async function prepareVisualPage(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await seedConsent(page)
  await page.addInitScript(() => {
    const style = document.createElement('style')
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        scroll-behavior: auto !important;
      }
    `
    document.documentElement.appendChild(style)
  })
}

test.describe('visual regression', () => {
  test('desktop homepage', async ({ page }) => {
    await prepareVisualPage(page)
    await page.setViewportSize({ width: 1440, height: 1200 })
    await page.goto('/')
    await expect(page).toHaveScreenshot('desktop-homepage.png', { fullPage: true })
  })

  test('mobile homepage', async ({ page }) => {
    await prepareVisualPage(page)
    await page.setViewportSize({ width: 390, height: 1200 })
    await page.goto('/')
    await expect(page).toHaveScreenshot('mobile-homepage.png', { fullPage: true })
  })

  test('shop grid', async ({ page }) => {
    await prepareVisualPage(page)
    await page.setViewportSize({ width: 1440, height: 1100 })
    await page.goto('/products')
    await expect(page).toHaveScreenshot('shop-grid.png', { fullPage: true })
  })

  test('product detail', async ({ page }) => {
    await prepareVisualPage(page)
    await page.setViewportSize({ width: 1440, height: 1200 })
    await page.goto('/products/bakuchiol-renewal-serum')
    await expect(page).toHaveScreenshot('product-detail.png', { fullPage: true })
  })

  test('cart drawer', async ({ page }) => {
    await seedCart(page)
    await prepareVisualPage(page)
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto('/')
    await page.getByRole('button', { name: /Cart,/i }).click()
    await expect(page.getByRole('dialog', { name: /cart/i })).toBeVisible()
    await expect(page).toHaveScreenshot('cart-drawer.png', { fullPage: true })
  })

  test('checkout', async ({ page }) => {
    await seedCart(page)
    await seedCheckoutAddress(page)
    await prepareVisualPage(page)
    await page.setViewportSize({ width: 1440, height: 1100 })
    await page.goto('/checkout')
    await expect(page.locator('#checkout-name')).toHaveValue(E2E_ADDRESS.name)
    await expect(page).toHaveScreenshot('checkout.png', { fullPage: true })
  })

  test('account', async ({ page }) => {
    await prepareVisualPage(page)
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto('/account')
    await expect(page).toHaveScreenshot('account.png', { fullPage: true })
  })

  test('refund', async ({ page }) => {
    await prepareVisualPage(page)
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto('/refund')
    await expect(page).toHaveScreenshot('refund.png', { fullPage: true })
  })

  test('FAQ', async ({ page }) => {
    await prepareVisualPage(page)
    await page.setViewportSize({ width: 1440, height: 1200 })
    await page.goto('/faq')
    await expect(page).toHaveScreenshot('faq.png', { fullPage: true })
  })

  test('blog', async ({ page }) => {
    await prepareVisualPage(page)
    await page.setViewportSize({ width: 1440, height: 1200 })
    await page.goto('/blog')
    await expect(page).toHaveScreenshot('blog.png', { fullPage: true })
  })
})
