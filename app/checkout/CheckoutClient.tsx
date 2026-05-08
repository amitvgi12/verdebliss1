// @ts-nocheck
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

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck,
  Truck,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Banknote,
} from 'lucide-react'
import { getShippingCost } from '@/constants/shipping'
import { useCartStore, selectTotal, selectItemCount, selectPointsToEarn } from '@/store/cartStore'
import ProductImage from '@/components/ui/ProductImage'
import { useAuthStore } from '@/store/authStore'
import { C, FONT } from '@/constants/theme'

/* ── Load Razorpay checkout script dynamically ─────────────────────── */
function useRazorpayScript() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (document.getElementById('razorpay-script')) {
      setReady(true)
      return
    }
    const script = document.createElement('script')
    script.id = 'razorpay-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => setReady(true)
    script.onerror = () => console.error('Failed to load Razorpay')
    document.body.appendChild(script)
    return () => {
      /* keep script — don't remove on unmount */
    }
  }, [])
  return ready
}

/* ── Step indicator ────────────────────────────────────────────────── */
function Steps({ current }) {
  const steps = ['Address', 'Review', 'Payment']
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
      {steps.map((s, i) => (
        <div
          key={s}
          style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 0 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 600,
                background: i <= current ? C.forest : C.border,
                color: i <= current ? 'white' : C.muted,
                transition: 'all 0.3s',
              }}
            >
              {i < current ? '✓' : i + 1}
            </div>
            <span
              style={{
                fontSize: 10,
                color: i <= current ? C.forest : C.muted,
                fontWeight: i === current ? 600 : 400,
                whiteSpace: 'nowrap',
              }}
            >
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              style={{
                flex: 1,
                height: 1,
                background: i < current ? C.forest : C.border,
                margin: '0 8px',
                marginBottom: 16,
                transition: 'background 0.3s',
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

/* ── Input field ───────────────────────────────────────────────────── */
function Field({ id, label, required, error, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        htmlFor={id}
        style={{
          display: 'block',
          fontSize: 12,
          fontWeight: 600,
          color: C.text,
          marginBottom: 6,
          letterSpacing: '0.04em',
        }}
      >
        {label}
        {required && <span style={{ color: C.terra, marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {error && <div style={{ fontSize: 11, color: C.terra, marginTop: 4 }}>{error}</div>}
    </div>
  )
}

const inputStyle = (err) => ({
  width: '100%',
  padding: '11px 14px',
  border: `1px solid ${err ? C.terra : C.border}`,
  borderRadius: 10,
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
  background: C.warmWhite,
  color: C.text,
  transition: 'border-color 0.2s',
})

const COD_MAX_TOTAL = 500

function cartPayload(items) {
  return items.map((item) => ({ id: item.id, qty: item.qty }))
}

async function authHeaders() {
  const { supabase } = await import('@/lib/supabase')
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function postCheckout(url, payload) {
  const headers = await authHeaders()
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error ?? 'Checkout request failed')
  return data
}

export default function Checkout() {
  const router = useRouter()
  const razorReady = useRazorpayScript()
  const items = useCartStore((s) => s.items)
  const clearCart = useCartStore((s) => s.clearCart)
  const total = useCartStore(selectTotal)
  const itemCount = useCartStore(selectItemCount)
  const pointsToEarn = useCartStore(selectPointsToEarn)
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)

  const [step, setStep] = useState(0) // 0=address, 1=review, 2=paying
  const [status, setStatus] = useState(null) // null | 'success' | 'failed'
  const [paymentId, setPayId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [loading, setLoading] = useState(false)
  const [paymentAction, setPaymentAction] = useState(null) // null | 'razorpay' | 'cod'
  const [errors, setErrors] = useState({})

  const [form, setForm] = useState({
    name: profile?.full_name ?? user?.email?.split('@')[0] ?? '',
    email: user?.email ?? '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
  })

  /* Redirect to products if cart is empty */
  useEffect(() => {
    if (items.length === 0 && status !== 'success') router.replace('/products')
  }, [items.length, router, status])

  const set_ = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function confirmOrder(result) {
    setPayId(result.paymentId || result.orderId || '')
    setPaymentMethod(result.paymentMethod || '')
    setStatus('success')
    clearCart()
    setLoading(false)
    setPaymentAction(null)
  }

  function checkoutPayload() {
    return {
      items: cartPayload(items),
      address: form,
    }
  }

  /* ── Validate address step ───────────────────────────────────────── */
  function validate() {
    const e = {}
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
    const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    if (!publicKey) {
      alert('Razorpay is not configured. Set NEXT_PUBLIC_RAZORPAY_KEY_ID.')
      return
    }
    if (!window.Razorpay) {
      alert('Payment gateway is still loading. Please wait a moment and try again.')
      return
    }

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

        handler: async (response) => {
          try {
            const verified = await postCheckout('/api/checkout/verify-razorpay', {
              ...checkoutPayload(),
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            await confirmOrder(verified)
          } catch (err) {
            console.error('[Checkout] Payment verification failed:', err)
            setStatus('failed')
            setLoading(false)
            setPaymentAction(null)
            alert(
              err?.message ??
                'Payment verification failed. Please contact support with your payment ID.'
            )
          }
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (response) => {
        console.error('Razorpay payment failed:', response.error)
        setStatus('failed')
        setLoading(false)
        setPaymentAction(null)
      })
      rzp.open()
    } catch (err) {
      console.error('[Checkout] Could not create Razorpay order:', err)
      setLoading(false)
      setPaymentAction(null)
      alert(err?.message ?? 'Could not start payment. Please try again.')
    }
  }

  async function placeCodOrder() {
    if (grandTotal > COD_MAX_TOTAL) {
      alert(`Cash on Delivery is available only up to ₹${COD_MAX_TOTAL.toLocaleString()}.`)
      return
    }

    setLoading(true)
    setPaymentAction('cod')
    try {
      const order = await postCheckout('/api/checkout/cod', checkoutPayload())
      await confirmOrder(order)
    } catch (err) {
      console.error('[Checkout] COD order failed:', err)
      setLoading(false)
      setPaymentAction(null)
      alert(err?.message ?? 'Could not place Cash on Delivery order. Please try again.')
    }
  }

  /* ── Shipping cost ───────────────────────────────────────────────── */
  const shipping = getShippingCost(total)
  const grandTotal = total + shipping
  const codAvailable = grandTotal <= COD_MAX_TOTAL

  /* ══ SUCCESS STATE ═══════════════════════════════════════════════ */
  if (status === 'success') {
    return (
      <div
        style={{
          background: C.bg,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: C.card,
            borderRadius: 24,
            padding: '48px 40px',
            maxWidth: 480,
            width: '100%',
            textAlign: 'center',
            border: `1px solid ${C.border}`,
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <CheckCircle2 size={64} color={C.forest} style={{ margin: '0 auto 24px' }} />
          </motion.div>
          <h1
            style={{
              fontFamily: FONT.serif,
              fontSize: 32,
              color: C.text,
              fontWeight: 400,
              marginBottom: 12,
            }}
          >
            Order Confirmed!
          </h1>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, marginBottom: 8 }}>
            Thank you, {form.name.split(' ')[0]}! Your botanical ritual is on its way.
          </p>
          {paymentId && (
            <div
              style={{
                background: C.goldPale,
                borderRadius: 10,
                padding: '10px 16px',
                marginBottom: 24,
                fontSize: 12,
                color: C.olive,
              }}
            >
              {paymentMethod === 'Cash on Delivery' ? 'Order Ref' : 'Payment ID'}:{' '}
              <strong>{paymentId}</strong>
              {paymentMethod && (
                <div style={{ marginTop: 4 }}>
                  Method: <strong>{paymentMethod}</strong>
                </div>
              )}
            </div>
          )}
          <div
            style={{
              background: C.sagePale,
              borderRadius: 12,
              padding: '16px',
              marginBottom: 24,
              textAlign: 'left',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.forest,
                letterSpacing: '0.08em',
                marginBottom: 10,
              }}
            >
              DELIVERING TO
            </div>
            <div style={{ fontSize: 13, color: C.text }}>{form.name}</div>
            <div style={{ fontSize: 13, color: C.muted }}>
              {form.line1}
              {form.line2 ? `, ${form.line2}` : ''}
            </div>
            <div style={{ fontSize: 13, color: C.muted }}>
              {form.city}, {form.state} — {form.pincode}
            </div>
          </div>
          <div
            style={{
              background: C.goldPale,
              borderRadius: 12,
              padding: '14px 16px',
              marginBottom: 28,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 20 }}>🏆</span>
            <span style={{ fontSize: 13, color: C.olive, fontWeight: 500 }}>
              <strong>{pointsToEarn} loyalty points</strong> will be credited after successful
              payment verification.
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
            <button
              onClick={() => router.push('/products')}
              style={{
                background: C.forest,
                color: 'white',
                border: 'none',
                borderRadius: 12,
                padding: '13px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Continue Shopping
            </button>
            <button
              onClick={() => router.push('/account')}
              style={{
                background: 'none',
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: '13px',
                fontSize: 14,
                color: C.muted,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              View My Account
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  /* ══ MAIN CHECKOUT ═══════════════════════════════════════════════ */
  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 16px 64px' }}>
        {/* Back */}
        <button
          onClick={() => router.push('/products')}
          style={{
            background: 'none',
            border: 'none',
            color: C.muted,
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontFamily: 'inherit',
            fontWeight: 500,
            marginBottom: 24,
            padding: 0,
          }}
        >
          <ArrowLeft size={13} /> Back to Shopping
        </button>

        <h1
          style={{
            fontFamily: FONT.serif,
            fontSize: 'clamp(24px,4vw,36px)',
            color: C.text,
            fontWeight: 400,
            marginBottom: 32,
          }}
        >
          Checkout
        </h1>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1fr) 360px',
            gap: 32,
            alignItems: 'start',
          }}
        >
          {/* ── LEFT: Form ─────────────────────────────────── */}
          <div>
            <Steps current={step} />

            <AnimatePresence mode="wait">
              {/* ── Step 0: Delivery Address ──────────────── */}
              {step === 0 && (
                <motion.div
                  key="address"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div
                    style={{
                      background: C.card,
                      borderRadius: 20,
                      padding: '28px',
                      border: `1px solid ${C.border}`,
                      marginBottom: 16,
                    }}
                  >
                    <h2
                      style={{
                        fontFamily: FONT.serif,
                        fontSize: 20,
                        color: C.text,
                        fontWeight: 400,
                        marginBottom: 20,
                      }}
                    >
                      Delivery Address
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <Field id="checkout-name" label="Full Name" required error={errors.name}>
                          <input
                            id="checkout-name"
                            name="name"
                            value={form.name}
                            onChange={set_('name')}
                            placeholder="Kavya Menon"
                            style={inputStyle(errors.name)}
                          />
                        </Field>
                      </div>
                      <Field id="checkout-email" label="Email" required error={errors.email}>
                        <input
                          id="checkout-email"
                          name="email"
                          value={form.email}
                          onChange={set_('email')}
                          type="email"
                          placeholder="you@email.com"
                          style={inputStyle(errors.email)}
                        />
                      </Field>
                      <Field id="checkout-phone" label="Phone" required error={errors.phone}>
                        <input
                          id="checkout-phone"
                          name="phone"
                          value={form.phone}
                          onChange={set_('phone')}
                          type="tel"
                          placeholder="9876543210"
                          maxLength={10}
                          style={inputStyle(errors.phone)}
                        />
                      </Field>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <Field
                          id="checkout-line1"
                          label="Address Line 1"
                          required
                          error={errors.line1}
                        >
                          <input
                            id="checkout-line1"
                            name="address_line1"
                            value={form.line1}
                            onChange={set_('line1')}
                            placeholder="Flat / House number, Street"
                            style={inputStyle(errors.line1)}
                          />
                        </Field>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <Field id="checkout-line2" label="Address Line 2">
                          <input
                            id="checkout-line2"
                            name="address_line2"
                            value={form.line2}
                            onChange={set_('line2')}
                            placeholder="Area, Landmark (optional)"
                            style={inputStyle(false)}
                          />
                        </Field>
                      </div>
                      <Field id="checkout-city" label="City" required error={errors.city}>
                        <input
                          id="checkout-city"
                          name="city"
                          value={form.city}
                          onChange={set_('city')}
                          placeholder="Pune"
                          style={inputStyle(errors.city)}
                        />
                      </Field>
                      <Field id="checkout-state" label="State" required error={errors.state}>
                        <input
                          id="checkout-state"
                          name="state"
                          value={form.state}
                          onChange={set_('state')}
                          placeholder="Maharashtra"
                          style={inputStyle(errors.state)}
                        />
                      </Field>
                      <Field id="checkout-pincode" label="PIN Code" required error={errors.pincode}>
                        <input
                          id="checkout-pincode"
                          name="postal_code"
                          value={form.pincode}
                          onChange={set_('pincode')}
                          placeholder="411014"
                          maxLength={6}
                          style={inputStyle(errors.pincode)}
                        />
                      </Field>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (validate()) setStep(1)
                    }}
                    style={{
                      width: '100%',
                      background: C.forest,
                      color: 'white',
                      border: 'none',
                      borderRadius: 12,
                      padding: '14px',
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Continue to Review →
                  </button>
                </motion.div>
              )}

              {/* ── Step 1: Review order ──────────────────── */}
              {step === 1 && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div
                    style={{
                      background: C.card,
                      borderRadius: 20,
                      padding: '28px',
                      border: `1px solid ${C.border}`,
                      marginBottom: 16,
                    }}
                  >
                    <h2
                      style={{
                        fontFamily: FONT.serif,
                        fontSize: 20,
                        color: C.text,
                        fontWeight: 400,
                        marginBottom: 20,
                      }}
                    >
                      Review Your Order
                    </h2>

                    {/* Address summary */}
                    <div
                      style={{
                        background: C.sagePale,
                        borderRadius: 12,
                        padding: '14px 16px',
                        marginBottom: 20,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: C.forest,
                              letterSpacing: '0.07em',
                              marginBottom: 4,
                            }}
                          >
                            DELIVERING TO
                          </div>
                          <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>
                            {form.name}
                          </div>
                          <div style={{ fontSize: 12, color: C.muted }}>
                            {form.line1}
                            {form.line2 ? `, ${form.line2}` : ''}, {form.city}, {form.state} -{' '}
                            {form.pincode}
                          </div>
                          <div style={{ fontSize: 12, color: C.muted }}>
                            {form.phone} · {form.email}
                          </div>
                        </div>
                        <button
                          onClick={() => setStep(0)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: C.forest,
                            fontSize: 12,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontWeight: 600,
                            textDecoration: 'underline',
                            flexShrink: 0,
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </div>

                    {/* Items */}
                    {items.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          gap: 12,
                          padding: '12px 0',
                          borderBottom: `1px solid ${C.border}`,
                        }}
                      >
                        <div
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 8,
                            overflow: 'hidden',
                            flexShrink: 0,
                          }}
                        >
                          <ProductImage product={item} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: C.text,
                              lineHeight: 1.3,
                            }}
                          >
                            {item.name}
                          </div>
                          <div style={{ fontSize: 12, color: C.muted }}>Qty: {item.qty}</div>
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: C.text,
                            fontFamily: FONT.serif,
                            flexShrink: 0,
                          }}
                        >
                          ₹{(item.price * item.qty).toLocaleString()}
                        </div>
                      </div>
                    ))}

                    {/* Totals */}
                    <div style={{ marginTop: 16, paddingTop: 16 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: 13,
                          color: C.muted,
                          marginBottom: 6,
                        }}
                      >
                        <span>Subtotal</span>
                        <span>₹{total.toLocaleString()}</span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: 13,
                          color: C.muted,
                          marginBottom: 8,
                        }}
                      >
                        <span>Shipping</span>
                        <span style={{ color: shipping === 0 ? C.sage : C.text }}>
                          {shipping === 0 ? 'FREE' : `₹${shipping}`}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: 17,
                          fontWeight: 700,
                          color: C.text,
                          borderTop: `1px solid ${C.border}`,
                          paddingTop: 10,
                        }}
                      >
                        <span style={{ fontFamily: FONT.serif }}>Total</span>
                        <span style={{ fontFamily: FONT.serif }}>
                          ₹{grandTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment note */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: C.sagePale,
                      borderRadius: 10,
                      padding: '10px 14px',
                      marginBottom: 16,
                      fontSize: 12,
                      color: C.forest,
                    }}
                  >
                    <ShieldCheck size={14} />
                    Pay online with Razorpay, including UPI when enabled for your merchant account.
                  </div>

                  <button
                    onClick={launchRazorpay}
                    disabled={loading || !razorReady}
                    style={{
                      width: '100%',
                      background: loading && paymentAction === 'razorpay' ? C.sage : C.forest,
                      color: 'white',
                      border: 'none',
                      borderRadius: 12,
                      padding: '14px',
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: loading ? 'wait' : 'pointer',
                      fontFamily: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    {loading && paymentAction === 'razorpay' ? (
                      <>
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />{' '}
                        Opening Payment Gateway…
                      </>
                    ) : !razorReady ? (
                      'Loading payment gateway…'
                    ) : (
                      <>Pay Online ₹{grandTotal.toLocaleString()}</>
                    )}
                  </button>

                  <button
                    onClick={placeCodOrder}
                    disabled={loading || !codAvailable}
                    style={{
                      width: '100%',
                      background: codAvailable ? C.ivory : '#F1ECE6',
                      color: codAvailable ? C.forest : C.light,
                      border: `1px solid ${codAvailable ? C.forest : C.border}`,
                      borderRadius: 12,
                      padding: '13px',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: loading ? 'wait' : codAvailable ? 'pointer' : 'not-allowed',
                      fontFamily: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {loading && paymentAction === 'cod' ? (
                      <>
                        <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />{' '}
                        Placing order…
                      </>
                    ) : (
                      <>
                        <Banknote size={15} />{' '}
                        {codAvailable
                          ? 'Cash on Delivery'
                          : `COD unavailable above ₹${COD_MAX_TOTAL.toLocaleString()}`}
                      </>
                    )}
                  </button>
                  <p style={{ fontSize: 11, color: C.muted, lineHeight: 1.5, margin: '8px 0 0' }}>
                    {codAvailable
                      ? 'COD orders are confirmed now and payable when your package arrives.'
                      : `Please use online payment for orders above ₹${COD_MAX_TOTAL.toLocaleString()}.`}
                  </p>

                  {status === 'failed' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: '#FCEBEB',
                        borderRadius: 10,
                        padding: '10px 14px',
                        fontSize: 13,
                        color: '#A32D2D',
                        marginTop: 8,
                      }}
                    >
                      <AlertCircle size={14} /> Payment failed. Please try again or use a different
                      payment method.
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── RIGHT: Order summary ────────────────────── */}
          <div style={{ position: 'sticky', top: 80 }}>
            <div
              style={{
                background: C.card,
                borderRadius: 20,
                padding: '24px',
                border: `1px solid ${C.border}`,
              }}
            >
              <h2
                style={{
                  fontFamily: FONT.serif,
                  fontSize: 18,
                  color: C.text,
                  fontWeight: 400,
                  marginBottom: 16,
                }}
              >
                Order Summary{' '}
                <span style={{ fontSize: 13, color: C.muted, fontFamily: 'inherit' }}>
                  ({itemCount} items)
                </span>
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                {items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 8,
                        overflow: 'hidden',
                        flexShrink: 0,
                        position: 'relative',
                      }}
                    >
                      <ProductImage product={item} />
                      <span
                        style={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          background: C.forest,
                          color: 'white',
                          borderRadius: '50%',
                          width: 16,
                          height: 16,
                          fontSize: 9,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {item.qty}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          color: C.text,
                          fontWeight: 500,
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.name}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, flexShrink: 0 }}>
                      ₹{(item.price * item.qty).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 13,
                    color: C.muted,
                    marginBottom: 6,
                  }}
                >
                  <span>Subtotal</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 13,
                    color: shipping === 0 ? C.sage : C.muted,
                    marginBottom: 12,
                  }}
                >
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 18,
                    fontWeight: 700,
                    color: C.text,
                  }}
                >
                  <span style={{ fontFamily: FONT.serif }}>Total</span>
                  <span style={{ fontFamily: FONT.serif }}>₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Loyalty + delivery info */}
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: `1px solid ${C.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 11,
                    color: C.olive,
                  }}
                >
                  <span>🏆</span> Earn <strong>{pointsToEarn} points</strong> on this order
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 11,
                    color: C.muted,
                  }}
                >
                  <Truck size={12} />{' '}
                  {shipping === 0
                    ? 'Free shipping included'
                    : `Add ₹${499 - total} for free shipping`}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 11,
                    color: C.muted,
                  }}
                >
                  <ShieldCheck size={12} /> 100% secure payment via Razorpay
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}
