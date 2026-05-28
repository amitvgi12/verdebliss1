import { expect, test } from '@playwright/test'
import {
  E2E_PRODUCT,
  mockPasswordReset,
  mockProductsCatalog,
  mockRefundApis,
  mockReviewsApi,
  mockSupabaseForSignedInUser,
  mockWishlistPersistence,
  seedConsent,
} from './helpers'

test.describe('account, support, and consent flows', () => {
  test('wishlist persists after login and page reload', async ({ page }) => {
    await seedConsent(page)
    await mockSupabaseForSignedInUser(page)
    await mockProductsCatalog(page)
    await mockWishlistPersistence(page)

    await page.goto(`/products/${E2E_PRODUCT.slug}`)
    await expect(page.getByText(/Earn \d+ loyalty points/i)).toBeVisible()
    await page.getByRole('button', { name: 'Save to wishlist' }).click()

    await page.reload()
    await expect(page.getByText(/Earn \d+ loyalty points/i)).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Save to wishlist' }).locator('svg')
    ).toHaveAttribute('fill', /#|rgb|[a-z]/i)
  })

  test('verified purchaser can submit a review', async ({ page }) => {
    await seedConsent(page)
    await mockSupabaseForSignedInUser(page)
    await mockProductsCatalog(page)
    await mockReviewsApi(page, 'verified')

    await page.goto(`/products/${E2E_PRODUCT.slug}`)
    await page.getByRole('button', { name: 'Write a Review' }).click()
    await page.getByLabel('REVIEW TITLE *').fill('Clearer by week two')
    await page
      .getByLabel('YOUR REVIEW *')
      .fill('This serum worked well for my skin and felt gentle enough for nightly use.')
    await page.getByRole('button', { name: /Submit Review/i }).click()

    await expect(page.getByText(/Thank you! Your review is pending moderation/i)).toBeVisible()
  })

  test('review before purchase is blocked with useful copy', async ({ page }) => {
    await seedConsent(page)
    await mockSupabaseForSignedInUser(page)
    await mockProductsCatalog(page)
    await mockReviewsApi(page, 'blocked')

    await page.goto(`/products/${E2E_PRODUCT.slug}`)
    await page.getByRole('button', { name: 'Write a Review' }).click()
    await page.getByLabel('REVIEW TITLE *').fill('Trying to review early')
    await page
      .getByLabel('YOUR REVIEW *')
      .fill('I should not be able to publish this before buying the product.')
    await page.getByRole('button', { name: /Submit Review/i }).click()

    await expect(
      page.getByText('Reviews are available after purchasing this product.')
    ).toBeVisible()
  })

  test('eligible order can request a refund', async ({ page }) => {
    await seedConsent(page)
    await mockSupabaseForSignedInUser(page)
    await mockRefundApis(page)

    await page.goto('/refund')
    await expect(page.getByText(/Order #ORDER-RE/i)).toBeVisible()
    await page.getByLabel('Refund reason').fill('The seal was damaged when the parcel arrived.')
    await page.getByRole('button', { name: 'Submit Refund Request' }).click()

    await expect(page.getByLabel('Refund reason')).toHaveValue('')
  })

  test('duplicate refund request is blocked', async ({ page }) => {
    await seedConsent(page)
    await mockSupabaseForSignedInUser(page)
    await mockRefundApis(page, true)

    await page.goto('/refund')
    await page.getByLabel('Refund reason').fill('I am submitting the same order twice.')
    await page.getByRole('button', { name: 'Submit Refund Request' }).click()

    await expect(page.getByText('A refund request is already open for this order')).toBeVisible()
  })

  test('password reset request sends a reset link', async ({ page }) => {
    await seedConsent(page)
    await mockPasswordReset(page)

    await page.goto('/account')
    await page.getByLabel('Email address').fill('kavya@verdebliss.test')
    await page.getByRole('button', { name: 'Forgot your password?' }).click()

    await expect(
      page.getByText('Password reset email sent. Check your inbox for the secure reset link.')
    ).toBeVisible()
  })

  test('delivery checker returns ETA and COD status', async ({ page }) => {
    await seedConsent(page)
    await mockProductsCatalog(page)
    await page.route(/\/api\/delivery-estimate(?:\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          pincode: '411014',
          dispatchWindow: 'Usually dispatched within 1 business day',
          deliveryEstimate: '2–3 business days',
          prepaidAvailable: true,
          codDecision: 'allow',
        }),
      })
    })

    await page.goto(`/products/${E2E_PRODUCT.slug}`)
    const purchaseDetails = page.getByRole('region', { name: 'Purchase details' })
    await expect(purchaseDetails).toBeVisible()

    const pincodeInput = purchaseDetails.getByLabel('PIN code')
    await pincodeInput.click()
    await pincodeInput.pressSequentially('411014')
    await expect(pincodeInput).toHaveValue('411014')

    const deliveryResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/delivery-estimate') &&
        response.request().method() === 'GET' &&
        response.status() === 200
    )
    await purchaseDetails.getByRole('button', { name: 'Check' }).click()
    await deliveryResponse

    await expect(purchaseDetails.getByText(/2–3 business days after dispatch/i)).toBeVisible()
    await expect(purchaseDetails.getByText(/COD is generally available/i)).toBeVisible()
  })

  test('AI consent flow blocks personal support when declined', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem('vb_cookie_consent')
    })
    await mockProductsCatalog(page)
    await page.goto('/')
    await page.getByRole('button', { name: 'Reject', exact: true }).click()
    await page.getByRole('button', { name: 'Chat with Verde' }).click()

    await page.locator('#chat-message').fill('Where is my latest order?')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.getByText(/Verde AI support/i)).toBeVisible()

    await page.getByRole('button', { name: 'Not now' }).click()
    await expect(
      page.getByText(/can't continue with AI support without that consent/i)
    ).toBeVisible()
  })
})
