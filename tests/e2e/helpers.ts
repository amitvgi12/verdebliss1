import { expect, type Page, type Route } from '@playwright/test'

export const E2E_USER = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'kavya@verdebliss.test',
  name: 'Kavya Menon',
}

export const E2E_ADDRESS = {
  name: E2E_USER.name,
  email: E2E_USER.email,
  phone: '9876543210',
  line1: 'Flat 4B, Green Heights',
  line2: 'Kharadi',
  city: 'Pune',
  state: 'Maharashtra',
  pincode: '411014',
}

export const E2E_PRODUCT = {
  id: '7',
  slug: 'niacinamide-pore-serum',
  name: 'Niacinamide Pore Serum',
  category: 'Serum',
  price: 895,
  description: 'Minimise pores and control sebum with a 10% niacinamide complex.',
  ingredient: 'Niacinamide',
  bg_color: '#E8EFF5',
  image_url: '/images/products/niacinamide-serum.webp',
  stock: 100,
}

export const E2E_BAKUCHIOL_PRODUCT = {
  id: '1',
  slug: 'bakuchiol-renewal-serum',
  name: 'Bakuchiol Renewal Serum',
  category: 'Serum',
  price: 1495,
  description: 'Plant-based retinol alternative for a smoother-looking night ritual.',
  ingredient: 'Bakuchiol',
  bg_color: '#EBF0E9',
  image_url: '/images/products/serum.webp',
  stock: 100,
}

function supabaseAuthStorageKeys() {
  const keys = ['sb-localhost-auth-token', 'sb-127-auth-token', 'sb-placeholder-auth-token']
  try {
    const host = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321').hostname
    keys.push(`sb-${host.split('.')[0]}-auth-token`)
  } catch {
    // Keep the static fallback keys above.
  }
  return [...new Set(keys)]
}

export async function seedConsent(page: Page, functionalThirdParty = false) {
  await page.addInitScript(
    ({ functional }) => {
      window.localStorage.setItem(
        'vb_cookie_consent',
        JSON.stringify({
          version: '1.2',
          essential: true,
          analytics: false,
          marketing: false,
          functional_third_party: functional,
          timestamp: '2026-05-20T00:00:00.000Z',
        })
      )
    },
    { functional: functionalThirdParty }
  )
}

export async function seedCart(page: Page, qty = 1) {
  await page.addInitScript(
    ({ product, quantity }) => {
      window.localStorage.setItem(
        'verdebliss-cart',
        JSON.stringify({
          state: { items: [{ ...product, qty: quantity }] },
          version: 0,
        })
      )
    },
    { product: E2E_PRODUCT, quantity: qty }
  )
}

export async function setCart(page: Page, product = E2E_PRODUCT, qty = 1) {
  await page.evaluate(
    ({ cartProduct, quantity }) => {
      window.localStorage.setItem(
        'verdebliss-cart',
        JSON.stringify({
          state: { items: [{ ...cartProduct, qty: quantity }] },
          version: 0,
        })
      )
    },
    { cartProduct: product, quantity: qty }
  )
}

export async function seedCheckoutAddress(page: Page) {
  await page.addInitScript(
    ({ address }) => {
      window.sessionStorage.setItem('verdebliss-checkout-address', JSON.stringify(address))
    },
    { address: E2E_ADDRESS }
  )
}

export async function seedSupabaseSession(page: Page) {
  await page.addInitScript(
    ({ user, storageKeys }) => {
      const session = {
        access_token: 'e2e-access-token',
        refresh_token: 'e2e-refresh-token',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: {
          id: user.id,
          aud: 'authenticated',
          role: 'authenticated',
          email: user.email,
          email_confirmed_at: '2026-05-20T00:00:00.000Z',
          phone: '',
          confirmed_at: '2026-05-20T00:00:00.000Z',
          last_sign_in_at: '2026-05-20T00:00:00.000Z',
          app_metadata: { provider: 'email', providers: ['email'] },
          user_metadata: { full_name: user.name, skin_type: 'Dry' },
          identities: [],
          created_at: '2026-05-20T00:00:00.000Z',
          updated_at: '2026-05-20T00:00:00.000Z',
        },
      }

      for (const key of storageKeys) {
        window.localStorage.setItem(key, JSON.stringify(session))
      }
    },
    { user: E2E_USER, storageKeys: supabaseAuthStorageKeys() }
  )
}

export async function mockSupabaseForSignedInUser(page: Page) {
  await seedSupabaseSession(page)

  await page.route('**/auth/v1/user', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: E2E_USER.id,
        email: E2E_USER.email,
        user_metadata: { full_name: E2E_USER.name, skin_type: 'Dry' },
      }),
    })
  })

  await page.route('**/rest/v1/profiles*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: E2E_USER.id,
        full_name: E2E_USER.name,
        email: E2E_USER.email,
        points: 640,
        tier: 'Gold Botanist',
        skin_type: 'Dry',
      }),
    })
  })

  await page.route('**/rest/v1/addresses*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user_id: E2E_USER.id,
        label: 'Home',
        line1: E2E_ADDRESS.line1,
        line2: E2E_ADDRESS.line2,
        city: E2E_ADDRESS.city,
        state: E2E_ADDRESS.state,
        pincode: E2E_ADDRESS.pincode,
        is_default: true,
      }),
    })
  })
}

export async function mockWishlistPersistence(page: Page, initialIds: string[] = []) {
  let wishlistIds = new Set(initialIds)

  await page.route('**/rest/v1/wishlist*', async (route) => {
    const request = route.request()
    if (request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([...wishlistIds].map((productId) => ({ product_id: productId }))),
      })
      return
    }

    if (request.method() === 'POST') {
      const body = request.postDataJSON() as { product_id?: string } | { product_id?: string }[]
      const row = Array.isArray(body) ? body[0] : body
      if (row?.product_id) wishlistIds.add(row.product_id)
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({}),
      })
      return
    }

    if (request.method() === 'DELETE') {
      const productId = new URL(request.url()).searchParams.get('product_id')?.replace(/^eq\./, '')
      if (productId) wishlistIds.delete(productId)
      await route.fulfill({ status: 204, body: '' })
      return
    }

    await route.continue()
  })
}

export async function mockCheckoutApis(page: Page) {
  await mockProductsCatalog(page)
  await mockTurnstileWidget(page)

  await page.route('**/api/checkout/cod', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        orderId: 'COD-E2E-ORDER',
        paymentId: 'COD-E2E-ORDER',
        paymentMethod: 'Cash on Delivery',
        pointsPending: 89,
        totals: { subtotal: 895, shipping: 0, total: 895 },
        verificationRequired: false,
      }),
    })
  })

  await page.route('**/api/checkout/create-razorpay-order', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        orderId: 'order_e2e_success',
        amount: 89500,
        currency: 'INR',
        key: 'rzp_test_playwright',
      }),
    })
  })

  await page.route('**/api/checkout/verify-razorpay', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        orderId: 'order_e2e_success',
        paymentId: 'pay_e2e_success',
        paymentMethod: 'Razorpay · UPI',
        totals: { subtotal: 895, shipping: 0, total: 895 },
      }),
    })
  })
}

export async function mockTurnstileWidget(page: Page, token = 'e2e-turnstile-token') {
  await page.addInitScript(
    ({ challengeToken }) => {
      window.turnstile = {
        render: (container, options) => {
          const node = typeof container === 'string' ? document.querySelector(container) : container
          const widgetId = `e2e-turnstile-${Math.random().toString(36).slice(2)}`

          if (node) {
            const input = document.createElement('input')
            input.type = 'hidden'
            input.name = 'cf-turnstile-response'
            input.value = challengeToken
            node.appendChild(input)
          }

          window.setTimeout(() => options.callback?.(challengeToken), 0)
          return widgetId
        },
        remove: () => {},
        reset: () => {},
      }
    },
    { challengeToken: token }
  )
}

export async function mockRazorpayCheckout(page: Page, outcome: 'success' | 'failure') {
  await page.route('https://checkout.razorpay.com/v1/checkout.js', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `
        window.Razorpay = function Razorpay(options) {
          this._events = {};
          this.on = (event, handler) => { this._events[event] = handler; };
          this.open = () => {
            setTimeout(() => {
              if (${JSON.stringify(outcome)} === 'failure') {
                this._events['payment.failed']?.({
                  error: { description: 'Playwright sandbox failure' }
                });
                return;
              }
              options.handler({
                razorpay_order_id: options.order_id,
                razorpay_payment_id: 'pay_e2e_success',
                razorpay_signature: 'sig_e2e_success'
              });
            }, 25);
          };
        };
      `,
    })
  })
}

export async function mockReviewsApi(page: Page, mode: 'verified' | 'blocked') {
  await page.route('**/rest/v1/reviews*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
  })

  await page.route('**/api/reviews', async (route) => {
    if (mode === 'verified') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      })
      return
    }

    await route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Reviews are available after purchasing this product.' }),
    })
  })
}

export async function mockRefundApis(page: Page, duplicate = false) {
  await page.route('**/rest/v1/refunds*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        duplicate
          ? [
              {
                id: 'refund-existing',
                order_id: 'order-refundable',
                reason: 'Already requested',
                status: 'requested',
                created_at: '2026-05-18T10:00:00.000Z',
              },
            ]
          : []
      ),
    })
  })

  await page.route('**/api/refunds/eligible-orders', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        orders: [
          {
            id: 'order-refundable',
            status: 'Delivered',
            payment_status: 'paid',
            created_at: '2026-05-18T10:00:00.000Z',
            total: 895,
            items: [
              { id: E2E_PRODUCT.id, name: E2E_PRODUCT.name, qty: 1, price: E2E_PRODUCT.price },
            ],
          },
        ],
      }),
    })
  })

  await page.route('**/api/refunds/request', async (route) => {
    const body = route.request().postDataJSON() as { orderId?: string; reason?: string }
    expect(body.orderId).toBe('order-refundable')
    if (duplicate) {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'A refund request is already open for this order' }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    })
  })
}

export async function mockPasswordReset(page: Page) {
  await page.route('**/auth/v1/**', async (route) => {
    if (!route.request().url().includes('/recover')) {
      await route.continue()
      return
    }

    const corsHeaders = {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info',
      'access-control-allow-private-network': 'true',
    }

    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders, body: '' })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: corsHeaders,
      body: JSON.stringify({}),
    })
  })
}

export async function fillCheckoutAddress(page: Page) {
  await page.locator('#checkout-name').fill(E2E_ADDRESS.name)
  await page.locator('#checkout-email').fill(E2E_ADDRESS.email)
  await page.locator('#checkout-phone').fill(E2E_ADDRESS.phone)
  await page.locator('#checkout-line1').fill(E2E_ADDRESS.line1)
  await page.locator('#checkout-line2').fill(E2E_ADDRESS.line2)
  await page.locator('#checkout-city').fill(E2E_ADDRESS.city)
  await page.locator('#checkout-state').fill(E2E_ADDRESS.state)
  await page.locator('#checkout-pincode').fill(E2E_ADDRESS.pincode)
}

export async function waitForPdpReady(page: Page, productName = E2E_PRODUCT.name) {
  await expect(page.getByRole('heading', { name: productName })).toBeVisible()
  await expect(page.getByText(/Earn \d+ loyalty points/i)).toBeVisible()
}

export async function goToCheckoutReview(page: Page) {
  await mockProductsCatalog(page)
  await seedCheckoutAddress(page)
  await page.goto('/checkout')
  await expect(page.locator('#checkout-name')).toHaveValue(E2E_ADDRESS.name)
  await expect(page.locator('#checkout-pincode')).toHaveValue(E2E_ADDRESS.pincode)
  await expect(async () => {
    const button = page.getByRole('button', { name: /Continue to Review/i })
    await button.click({ trial: true, timeout: 1000 })
    await button.click({ timeout: 1000 })
  }).toPass({ timeout: 10_000 })
  await expect(page.getByRole('heading', { name: 'Review Your Order' })).toBeVisible()
}

export async function goToCheckoutPayment(page: Page) {
  await goToCheckoutReview(page)
  await page.getByRole('button', { name: /Continue to Payment/i }).click()
  await expect(page.getByRole('heading', { name: 'Payment' })).toBeVisible()
}

export async function addKnownProductFromPdp(page: Page) {
  await seedCart(page)
}

export async function mockProductsCatalog(page: Page) {
  await page.route('**/rest/v1/products*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([E2E_BAKUCHIOL_PRODUCT, E2E_PRODUCT]),
    })
  })
}

export async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}
