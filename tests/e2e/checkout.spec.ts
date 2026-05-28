import { expect, test } from '@playwright/test'
import {
  addKnownProductFromPdp,
  E2E_ADDRESS,
  E2E_BAKUCHIOL_PRODUCT,
  fillCheckoutAddress,
  goToCheckoutPayment,
  mockCheckoutApis,
  mockProductsCatalog,
  mockRazorpayCheckout,
  mockSupabaseForSignedInUser,
  seedCart,
  seedConsent,
  setCart,
  waitForPdpReady,
} from './helpers'

test.describe('checkout customer journeys', () => {
  test('home to product to cart to checkout', async ({ page }) => {
    await seedConsent(page)
    await mockCheckoutApis(page)

    await page.goto('/')
    await page
      .getByRole('link', { name: /Bakuchiol Renewal Serum|View Bakuchiol Renewal Serum/i })
      .first()
      .click()

    await expect(page).toHaveURL(/\/products\/bakuchiol-renewal-serum/)
    await waitForPdpReady(page, E2E_BAKUCHIOL_PRODUCT.name)
    await setCart(page, E2E_BAKUCHIOL_PRODUCT)
    await page.goto('/checkout')

    await expect(page).toHaveURL(/\/checkout/)
    await fillCheckoutAddress(page)
    await page.getByRole('button', { name: /Continue to Review/i }).click()
    await expect(page.getByRole('heading', { name: 'Review Your Order' })).toBeVisible()
    await expect(page.getByText('Bakuchiol Renewal Serum').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Continue to Payment/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Pay Online/i })).not.toBeVisible()
  })

  test('guest can place a COD order', async ({ page }) => {
    await seedConsent(page)
    await seedCart(page)
    await mockCheckoutApis(page)

    await goToCheckoutPayment(page)
    await page.getByRole('button', { name: /Cash on Delivery/i }).click()

    await expect(page.getByRole('heading', { name: 'Order Confirmed!' })).toBeVisible()
    await expect(page.getByText(/Method:\s*Cash on Delivery/i)).toBeVisible()
  })

  test('logged-in customer can place a COD order with saved address', async ({ page }) => {
    await seedConsent(page)
    await seedCart(page)
    await mockSupabaseForSignedInUser(page)
    await mockProductsCatalog(page)
    await mockCheckoutApis(page)

    await page.goto('/checkout')
    await expect(page.locator('#checkout-line1')).toHaveValue(E2E_ADDRESS.line1)
    await fillCheckoutAddress(page)
    await page.getByRole('button', { name: /Continue to Review/i }).click()
    await expect(page.getByRole('heading', { name: 'Review Your Order' })).toBeVisible()
    await page.getByRole('button', { name: /Continue to Payment/i }).click()
    await expect(page.getByRole('heading', { name: 'Payment' })).toBeVisible()
    await page.getByRole('button', { name: /Cash on Delivery/i }).click()

    await expect(page.getByRole('heading', { name: 'Order Confirmed!' })).toBeVisible()
    await expect(page.getByText(/Thank you, Kavya/i)).toBeVisible()
  })

  test('Razorpay sandbox success confirms the order', async ({ page }) => {
    await seedConsent(page)
    await seedCart(page)
    await mockCheckoutApis(page)
    await mockRazorpayCheckout(page, 'success')

    await goToCheckoutPayment(page)
    await expect(page.getByRole('button', { name: /Pay Online/i })).toBeEnabled()
    await page.getByRole('button', { name: /Pay Online/i }).click()

    await expect(page.getByRole('heading', { name: 'Order Confirmed!' })).toBeVisible()
    await expect(page.getByText(/Method:\s*Razorpay · UPI/i)).toBeVisible()
  })

  test('Razorpay payment failure keeps the customer in payment with recovery copy', async ({
    page,
  }) => {
    await seedConsent(page)
    await mockCheckoutApis(page)
    await mockRazorpayCheckout(page, 'failure')
    await addKnownProductFromPdp(page)

    await goToCheckoutPayment(page)
    await expect(page.getByRole('button', { name: /Pay Online/i })).toBeEnabled()
    await page.getByRole('button', { name: /Pay Online/i }).click()

    await expect(
      page.getByText('Payment failed. Please try again or use a different payment method.')
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Payment' })).toBeVisible()
  })
})
