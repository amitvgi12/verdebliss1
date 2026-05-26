'use client'
/**
 * Checkout.jsx — /checkout
 *
 * Flow:
 *   1. User fills name / email / phone / address
 *   2. Click "Pay with Razorpay" → Razorpay modal opens
 *   3. On payment success  → show confirmation, clear cart, award loyalty points
 *   4. On payment failure  → show error, keep cart intact
 *
 * Razorpay key: NEXT_PUBLIC_RAZORPAY_KEY_ID (exposed to client — safe, it's a public key)
 * The Razorpay script is loaded dynamically only on this page (not every page).
 */

import { useState, useEffect, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { getShippingCost } from '@/constants/shipping'
import { COD_MAX_TOTAL } from '@/constants/checkout'
import { BUSINESS_COMPLIANCE } from '@/constants/businessCompliance'
import { useCartStore, selectTotal, selectItemCount, selectPointsToEarn } from '@/store/cartStore'
import Steps from './_components/Steps'
import AddressStep from './_components/AddressStep'
import ReviewStep from './_components/ReviewStep'
import PaymentStep from './_components/PaymentStep'
import OrderSummary from './_components/OrderSummary'
import SuccessState from './_components/SuccessState'
import { useAuthStore } from '@/store/authStore'
import type { CartItem } from '@/types'
import type {
  CheckoutErrors,
  CheckoutForm,
  CheckoutResult,
  CheckoutStatus,
  PaymentAction,
  RazorpayFailure,
  RazorpaySuccess,
} from './checkout-types'

type CartPersistApi = {
  hasHydrated?: () => boolean
  onFinishHydration?: (callback: () => void) => () => void
}

function getCartPersist(): CartPersistApi | undefined {
  return (useCartStore as typeof useCartStore & { persist?: CartPersistApi }).persist
}

function readPersistedCartItems(): CartItem[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem('verdebliss-cart')
    if (!raw) return []

    const parsed = JSON.parse(raw) as { state?: { items?: CartItem[] } } | null
    return Array.isArray(parsed?.state?.items) ? parsed.state.items : []
  } catch {
    return []
  }
}

/* ── Load Razorpay checkout script dynamically ─────────────────────────
 * Programmatic script injection. The checkout page runs from a nonced Next
 * bundle, so CSP `strict-dynamic` allows this child script. We keep the script
 * around across unmounts (re-loading on every checkout return is wasteful)
 * and silently no-op when the iframe API has already been registered.
 *
 * Note for migration: a future refactor can replace this with `next/script`
 * + `strategy="lazyOnload"` to integrate with Next's build pipeline, but
 * that requires moving the load trigger into the React tree (Razorpay
 * doesn't always boot reliably from `beforeInteractive` in App Router).
 */
function useRazorpayScript() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.Razorpay) {
      setReady(true)
      return
    }
    if (document.getElementById('razorpay-script')) {
      // Already injected, possibly still loading — wait for it.
      const existing = document.getElementById('razorpay-script') as HTMLScriptElement | null
      if (existing) existing.addEventListener('load', () => setReady(true), { once: true })
      return
    }
    const script = document.createElement('script')
    script.id = 'razorpay-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => setReady(true)
    script.onerror = () =>
      console.error('[Razorpay] Failed to load checkout script — verify CSP and network.')
    document.body.appendChild(script)
    return () => {
      /* keep script — don't remove on unmount */
    }
  }, [])
  return ready
}

function cartPayload(items: CartItem[]) {
  return items.map((item) => ({ id: item.id, qty: item.qty }))
}

async function authHeaders(): Promise<Record<string, string>> {
  const { supabase } = await import('@/lib/supabase')
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

class CheckoutApiError extends Error {
  code?: string
  status: number

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'CheckoutApiError'
    this.status = status
    this.code = code
  }
}

async function postCheckout<T = CheckoutResult>(url: string, payload: unknown): Promise<T> {
  const headers = await authHeaders()
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-vb-client': 'web', ...headers },
    body: JSON.stringify(payload),
  })
  const data = (await res.json().catch(() => ({}))) as { error?: string } & T
  if (!res.ok) {
    const payload = data as { error?: string; message?: string; code?: string }
    throw new CheckoutApiError(
      payload.error ?? payload.message ?? 'Checkout request failed',
      res.status,
      payload.code
    )
  }
  return data
}

function isTurnstileCheckoutError(error: unknown): boolean {
  if (!(error instanceof CheckoutApiError)) return false
  return (
    error.code === 'missing_token' ||
    error.code === 'timeout-or-duplicate' ||
    error.code === 'invalid-input-response' ||
    error.code === 'invalid-input-secret' ||
    error.code === 'bad-request' ||
    error.code === 'turnstile_not_configured' ||
    error.code === 'verify_network_error' ||
    Boolean(error.code?.startsWith('verify_http_'))
  )
}

function userFacingCheckoutError(error: unknown): string {
  const message = error instanceof Error ? error.message : ''
  const lower = message.toLowerCase()

  if (
    lower.includes('commerce persistence') ||
    lower.includes('supabase_service_role_key') ||
    lower.includes('online payment is not enabled yet')
  ) {
    return `Order placement is temporarily unavailable while checkout is being configured. Please contact ${BUSINESS_COMPLIANCE.emails.support} for help.`
  }

  return message || 'Checkout request failed. Please try again.'
}

const GUEST_CHECKOUT_ADDRESS_KEY = 'verdebliss-checkout-address'

type SavedAddress = Pick<CheckoutForm, 'line1' | 'line2' | 'city' | 'state' | 'pincode'>

function buildBaseCheckoutForm(profileName?: string | null, email?: string | null): CheckoutForm {
  return {
    name: profileName ?? email?.split('@')[0] ?? '',
    email: email ?? '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
  }
}

function readGuestCheckoutForm(): CheckoutForm | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.sessionStorage.getItem(GUEST_CHECKOUT_ADDRESS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<CheckoutForm>
    return {
      name: typeof parsed.name === 'string' ? parsed.name : '',
      email: typeof parsed.email === 'string' ? parsed.email : '',
      phone: typeof parsed.phone === 'string' ? parsed.phone : '',
      line1: typeof parsed.line1 === 'string' ? parsed.line1 : '',
      line2: typeof parsed.line2 === 'string' ? parsed.line2 : '',
      city: typeof parsed.city === 'string' ? parsed.city : '',
      state: typeof parsed.state === 'string' ? parsed.state : '',
      pincode: typeof parsed.pincode === 'string' ? parsed.pincode : '',
    }
  } catch {
    return null
  }
}

function hasAddressDraft(form: CheckoutForm): boolean {
  return Boolean(
    form.name ||
    form.email ||
    form.phone ||
    form.line1 ||
    form.line2 ||
    form.city ||
    form.state ||
    form.pincode
  )
}

export default function Checkout() {
  const router = useRouter()
  const razorReady = useRazorpayScript()
  const items = useCartStore((s) => s.items)
  const clearCart = useCartStore((s) => s.clearCart)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQty = useCartStore((s) => s.updateQty)
  const total = useCartStore(selectTotal)
  const itemCount = useCartStore(selectItemCount)
  const pointsToEarn = useCartStore(selectPointsToEarn)
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)

  const [step, setStep] = useState(0) // 0=address, 1=review, 2=payment
  const [status, setStatus] = useState<CheckoutStatus>(null) // null | 'success' | 'failed'
  const [paymentId, setPayId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [loading, setLoading] = useState(false)
  const [paymentAction, setPaymentAction] = useState<PaymentAction>(null) // null | 'razorpay' | 'cod'
  const [errors, setErrors] = useState<CheckoutErrors>({})
  const [checkoutError, setCheckoutError] = useState('')
  const [codVerificationRequired, setCodVerificationRequired] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileResetKey, setTurnstileResetKey] = useState(0)
  const [cartHydrated, setCartHydrated] = useState(() => getCartPersist()?.hasHydrated?.() ?? true)
  const hasTurnstileSiteKey = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
  const requiresTurnstile = process.env.NODE_ENV === 'production' || hasTurnstileSiteKey

  const [form, setForm] = useState<CheckoutForm>(() =>
    buildBaseCheckoutForm(profile?.full_name, user?.email)
  )
  const [addressHydrated, setAddressHydrated] = useState(false)

  useEffect(() => {
    const persist = getCartPersist()
    if (!persist) {
      setCartHydrated(true)
      return
    }

    const unsubscribe = persist.onFinishHydration?.(() => setCartHydrated(true))
    setCartHydrated(persist.hasHydrated?.() ?? true)
    return unsubscribe
  }, [])

  useEffect(() => {
    if (items.length > 0) return

    const persistedItems = readPersistedCartItems()
    if (persistedItems.length > 0) {
      useCartStore.setState({ items: persistedItems })
    }
  }, [items.length])

  /* Redirect to products if cart is empty after persisted cart state is ready. */
  useEffect(() => {
    if (!cartHydrated) return
    if (items.length === 0 && readPersistedCartItems().length === 0 && status !== 'success') {
      router.replace('/products')
    }
  }, [cartHydrated, items.length, router, status])

  useEffect(() => {
    let cancelled = false

    async function hydrateAddress() {
      if (user?.id) {
        const { supabase } = await import('@/lib/supabase')
        const { data } = await supabase
          .from('addresses')
          .select('line1, line2, city, state, pincode')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (cancelled) return

        const savedAddress = data as SavedAddress | null
        setForm((current) => ({
          ...current,
          name: current.name || profile?.full_name || user.email?.split('@')[0] || '',
          email: current.email || user.email || '',
          ...(savedAddress ?? {}),
        }))
        setAddressHydrated(true)
        return
      }

      const draft = readGuestCheckoutForm()
      if (cancelled) return
      setForm(draft ?? buildBaseCheckoutForm())
      setAddressHydrated(true)
    }

    void hydrateAddress()
    return () => {
      cancelled = true
    }
  }, [profile?.full_name, user?.email, user?.id])

  useEffect(() => {
    if (!addressHydrated || user?.id || typeof window === 'undefined') return

    if (hasAddressDraft(form)) {
      window.sessionStorage.setItem(GUEST_CHECKOUT_ADDRESS_KEY, JSON.stringify(form))
    } else {
      window.sessionStorage.removeItem(GUEST_CHECKOUT_ADDRESS_KEY)
    }
  }, [addressHydrated, form, user?.id])

  const set_ = (k: keyof CheckoutForm) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function confirmOrder(result: CheckoutResult) {
    setCheckoutError('')
    setPayId(result.paymentId || result.orderId || '')
    setPaymentMethod(result.paymentMethod || '')
    setCodVerificationRequired(Boolean(result.verificationRequired))
    setStatus('success')
    clearCart()
    if (!user?.id && typeof window !== 'undefined') {
      window.sessionStorage.removeItem(GUEST_CHECKOUT_ADDRESS_KEY)
    }
    setLoading(false)
    setPaymentAction(null)
  }

  function checkoutPayload() {
    return {
      items: cartPayload(items),
      address: form,
      turnstileToken,
    }
  }

  function requireCheckoutVerification() {
    if (requiresTurnstile && !turnstileToken) {
      setCheckoutError('Complete the Cloudflare verification box before placing your order.')
      return false
    }
    return true
  }

  function resetCheckoutVerification() {
    setTurnstileToken(null)
    setTurnstileResetKey((key) => key + 1)
  }

  /* ── Validate address step ───────────────────────────────────────── */
  function validate() {
    const e: CheckoutErrors = {}
    if (!form.name.trim()) e.name = 'Full name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.phone.trim()) e.phone = 'Phone number is required'
    else if (!/^\d{10}$/.test(form.phone.replace(/\s/g, '')))
      e.phone = 'Enter a 10-digit phone number'
    if (!form.line1.trim()) e.line1 = 'Address is required'
    if (!form.city.trim()) e.city = 'City is required'
    if (!form.state.trim()) e.state = 'State is required'
    if (!form.pincode.trim()) e.pincode = 'PIN code is required'
    else if (!/^\d{6}$/.test(form.pincode)) e.pincode = 'Enter a valid 6-digit PIN code'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  /* ── Launch Razorpay ─────────────────────────────────────────────── */
  async function launchRazorpay() {
    if (!requireCheckoutVerification()) return

    const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    if (!publicKey) {
      setCheckoutError(
        'Online payment is not configured. Set NEXT_PUBLIC_RAZORPAY_KEY_ID in Vercel/local env.'
      )
      return
    }
    if (!window.Razorpay) {
      setCheckoutError('Payment gateway is still loading. Please wait a moment and try again.')
      return
    }

    setCheckoutError('')
    setLoading(true)
    setPaymentAction('razorpay')

    try {
      const created = await postCheckout('/api/checkout/create-razorpay-order', checkoutPayload())

      const options = {
        key: created.key || publicKey,
        amount: created.amount,
        currency: created.currency || 'INR',
        order_id: created.orderId,
        name: 'VerdeBliss',
        description: `Order of ${itemCount} item${itemCount !== 1 ? 's' : ''}`,
        image: '/images/logo.webp',

        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },

        notes: {
          address: `${form.line1}, ${form.line2 ? form.line2 + ', ' : ''}${form.city}, ${form.state} - ${form.pincode}`,
          items: items.map((i) => `${i.name} ×${i.qty}`).join('; '),
          payment_method: 'Razorpay',
        },

        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
          emi: true,
          paylater: true,
        },

        config: {
          display: {
            blocks: {
              upi: { name: 'Pay by UPI', instruments: [{ method: 'upi' }] },
              cards: { name: 'Cards', instruments: [{ method: 'card' }] },
              other: {
                name: 'More payment options',
                instruments: [
                  { method: 'netbanking' },
                  { method: 'wallet' },
                  { method: 'paylater' },
                  { method: 'emi' },
                ],
              },
            },
            sequence: ['block.upi', 'block.cards', 'block.other'],
            preferences: { show_default_blocks: true },
          },
        },

        theme: { color: '#2D4A32' },

        modal: {
          ondismiss: () => {
            setLoading(false)
            setPaymentAction(null)
          },
        },

        handler: async (response: RazorpaySuccess) => {
          try {
            const verified = await postCheckout('/api/checkout/verify-razorpay', {
              ...checkoutPayload(),
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            await confirmOrder(verified)
          } catch (err: unknown) {
            console.error('[Checkout] Payment verification failed:', err)
            setStatus('failed')
            setLoading(false)
            setPaymentAction(null)
            setCheckoutError(
              (err instanceof Error ? err.message : undefined) ??
                'Payment verification failed. Please contact support with your payment ID.'
            )
          }
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (...args: unknown[]) => {
        const response = args[0] as RazorpayFailure | undefined
        console.error('Razorpay payment failed:', response?.error)
        setStatus('failed')
        setLoading(false)
        setPaymentAction(null)
      })
      rzp.open()
    } catch (err: unknown) {
      console.error('[Checkout] Could not create Razorpay order:', err)
      setLoading(false)
      setPaymentAction(null)
      if (isTurnstileCheckoutError(err)) resetCheckoutVerification()
      setCheckoutError(userFacingCheckoutError(err))
    }
  }

  async function placeCodOrder() {
    if (!requireCheckoutVerification()) return

    if (grandTotal > COD_MAX_TOTAL) {
      setCheckoutError(
        `Cash on Delivery is available only up to ₹${COD_MAX_TOTAL.toLocaleString()}.`
      )
      return
    }

    setCheckoutError('')
    setLoading(true)
    setPaymentAction('cod')
    try {
      const order = await postCheckout('/api/checkout/cod', checkoutPayload())
      await confirmOrder(order)
    } catch (err: unknown) {
      console.error('[Checkout] COD order failed:', err)
      setLoading(false)
      setPaymentAction(null)
      if (isTurnstileCheckoutError(err)) resetCheckoutVerification()
      setCheckoutError(userFacingCheckoutError(err))
    }
  }

  /* ── Shipping cost ───────────────────────────────────────────────── */
  const shipping = getShippingCost(total)
  const grandTotal = total + shipping
  const codAvailable = grandTotal <= COD_MAX_TOTAL

  /* ══ SUCCESS STATE ═══════════════════════════════════════════════ */
  if (status === 'success') {
    return (
      <SuccessState
        form={form}
        paymentId={paymentId}
        paymentMethod={paymentMethod}
        pointsToEarn={pointsToEarn}
        codVerificationRequired={codVerificationRequired}
        onContinueShopping={() => router.push('/products')}
        onViewAccount={() => router.push('/account')}
      />
    )
  }

  /* ══ MAIN CHECKOUT ═══════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-bg">
      <div className="checkout-shell">
        {/* Back */}
        <button
          onClick={() => router.push('/products')}
          className="mb-6 flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-xs font-medium text-muted hover:text-text"
        >
          <ArrowLeft size={13} /> Back to Shopping
        </button>

        <h1 className="checkout-title font-serif text-[clamp(24px,4vw,36px)] font-normal text-text">
          Checkout
        </h1>

        <div className="checkout-grid">
          {/* ── LEFT: Form ─────────────────────────────────── */}
          <div>
            <Steps current={step} />

            <AnimatePresence mode="wait">
              {/* ── Step 0: Delivery Address ──────────────── */}
              {step === 0 && (
                <AddressStep
                  form={form}
                  errors={errors}
                  onChange={set_}
                  onContinue={() => {
                    if (validate()) setStep(1)
                  }}
                />
              )}

              {/* ── Step 1: Review order ──────────────────── */}
              {step === 1 && (
                <ReviewStep
                  form={form}
                  items={items}
                  onEditAddress={() => setStep(0)}
                  onBackToAddress={() => setStep(0)}
                  onContinueToPayment={() => {
                    setCheckoutError('')
                    setStatus(null)
                    setStep(2)
                  }}
                  onContinueShopping={() => router.push('/products')}
                  onIncreaseQty={(id) => updateQty(id, 1)}
                  onDecreaseQty={(id) => updateQty(id, -1)}
                  onRemoveItem={removeItem}
                />
              )}

              {/* ── Step 2: Payment ──────────────────────── */}
              {step === 2 && (
                <PaymentStep
                  grandTotal={grandTotal}
                  codAvailable={codAvailable}
                  codMaxTotal={COD_MAX_TOTAL}
                  loading={loading}
                  paymentAction={paymentAction}
                  razorReady={razorReady}
                  status={status}
                  checkoutError={checkoutError}
                  turnstileToken={turnstileToken}
                  turnstileResetKey={turnstileResetKey}
                  turnstileConfigured={hasTurnstileSiteKey}
                  requiresTurnstile={requiresTurnstile}
                  onBackToReview={() => {
                    setCheckoutError('')
                    setStatus(null)
                    setStep(1)
                  }}
                  onEditAddress={() => {
                    setCheckoutError('')
                    setStatus(null)
                    setStep(0)
                  }}
                  onTurnstileToken={setTurnstileToken}
                  onLaunchRazorpay={launchRazorpay}
                  onPlaceCod={placeCodOrder}
                />
              )}
            </AnimatePresence>
          </div>

          {/* ── RIGHT: Order summary ────────────────────── */}
          <OrderSummary
            items={items}
            itemCount={itemCount}
            total={total}
            shipping={shipping}
            grandTotal={grandTotal}
            pointsToEarn={pointsToEarn}
          />
        </div>
      </div>
    </div>
  )
}
