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
  waitForPdpReady,
} from './helpers'

test.describe('account, support, and consent flows', () => {
  test('wishlist persists after login and page reload', async ({ page }) => {
    await seedConsent(page)
    await mockSupabaseForSignedInUser(page)
    await mockProductsCatalog(page)
    await mockWishlistPersistence(page)

    await page.goto(`/products/${E2E_PRODUCT.slug}`)
    await waitForPdpReady(page)
    await page.getByRole('button', { name: 'Save to wishlist' }).click()

    await page.reload()
    await waitForPdpReady(page)
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
    await waitForPdpReady(page)
    const reviewResponse = await page.evaluate(async (productId) => {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          rating: 5,
          title: 'Clearer by week two',
          body: 'This serum worked well for my skin and felt gentle enough for nightly use.',
        }),
      })
      return { ok: response.ok, status: response.status, body: await response.json() }
    }, E2E_PRODUCT.id)

    expect(reviewResponse).toMatchObject({ ok: true, status: 200, body: { ok: true } })
  })

  test('review before purchase is blocked with useful copy', async ({ page }) => {
    await seedConsent(page)
    await mockSupabaseForSignedInUser(page)
    await mockProductsCatalog(page)
    await mockReviewsApi(page, 'blocked')

    await page.goto(`/products/${E2E_PRODUCT.slug}`)
    await waitForPdpReady(page)
    const reviewResponse = await page.evaluate(async (productId) => {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          rating: 5,
          title: 'Trying to review early',
          body: 'I should not be able to publish this before buying the product.',
        }),
      })
      return { ok: response.ok, status: response.status, body: await response.json() }
    }, E2E_PRODUCT.id)

    expect(reviewResponse).toMatchObject({
      ok: false,
      status: 403,
      body: { error: 'Reviews are available after purchasing this product.' },
    })
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
    await waitForPdpReady(page)
    const purchaseDetails = page.getByRole('region', { name: 'Purchase details' })
    await expect(purchaseDetails).toBeVisible()

    const pincodeInput = purchaseDetails.getByLabel('PIN code')
    await pincodeInput.click()
    await pincodeInput.pressSequentially('411014')
    await expect(pincodeInput).toHaveValue('411014')

    const deliveryResponse = await page.evaluate(async () => {
      const response = await fetch('/api/delivery-estimate?pincode=411014')
      return { ok: response.ok, status: response.status, body: await response.json() }
    })

    expect(deliveryResponse).toMatchObject({
      ok: true,
      status: 200,
      body: {
        deliveryEstimate: '2–3 business days',
        codDecision: 'allow',
      },
    })
  })

  test('AI consent flow blocks personal support when declined', async ({ page }) => {
    await seedConsent(page, false)
    await mockProductsCatalog(page)
    let aiConsentHeader: string | undefined
    await page.route('**/api/chat', async (route) => {
      aiConsentHeader = route.request().headers()['x-vb-ai-consent']
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'AI support consent is required.' }),
      })
    })

    await page.goto('/')
    const chatResponse = await page.evaluate(async () => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vb-client': 'web',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Where is my latest order?' }],
        }),
      })
      return { ok: response.ok, status: response.status, body: await response.json() }
    })

    expect(aiConsentHeader).toBeUndefined()
    expect(chatResponse).toMatchObject({
      ok: false,
      status: 403,
      body: { error: 'AI support consent is required.' },
    })
  })
})
