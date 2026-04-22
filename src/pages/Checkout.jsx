/**
 * Checkout.jsx — /checkout
 *
 * Flow:
 *   1. User fills name / email / phone / address
 *   2. Click "Pay with Razorpay" → Razorpay modal opens
 *   3. On payment success  → show confirmation, clear cart, award loyalty points
 *   4. On payment failure  → show error, keep cart intact
 *
 * Razorpay key: VITE_RAZORPAY_KEY_ID (exposed to client — safe, it's a public key)
 * The Razorpay script is loaded dynamically only on this page (not every page).
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, Truck, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { useCartStore, selectTotal, selectItemCount, selectPointsToEarn } from '@/store/cartStore'
import ProductImage from '@/components/ui/ProductImage'
import { useAuthStore } from '@/store/authStore'
import { useSEO } from '@/hooks/useSEO'
import { C, FONT } from '@/constants/theme'

/* ── Load Razorpay checkout script dynamically ─────────────────────── */
function useRazorpayScript() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (document.getElementById('razorpay-script')) { setReady(true); return }
    const script = document.createElement('script')
    script.id  = 'razorpay-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload  = () => setReady(true)
    script.onerror = () => console.error('Failed to load Razorpay')
    document.body.appendChild(script)
    return () => { /* keep script — don't remove on unmount */ }
  }, [])
  return ready
}

/* ── Step indicator ────────────────────────────────────────────────── */
function Steps({ current }) {
  const steps = ['Address', 'Review', 'Payment']
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600,
              background: i <= current ? C.forest : C.border,
              color: i <= current ? 'white' : C.muted,
              transition: 'all 0.3s',
            }}>
              {i < current ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: 10, color: i <= current ? C.forest : C.muted, fontWeight: i === current ? 600 : 400, whiteSpace: 'nowrap' }}>{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 1, background: i < current ? C.forest : C.border, margin: '0 8px', marginBottom: 16, transition: 'background 0.3s' }} />
          )}
        </div>
      ))}
    </div>
  )
}

/* ── Input field ───────────────────────────────────────────────────── */
function Field({ label, required, error, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6, letterSpacing: '0.04em' }}>
        {label}{required && <span style={{ color: C.terra, marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {error && <div style={{ fontSize: 11, color: C.terra, marginTop: 4 }}>{error}</div>}
    </div>
  )
}

const inputStyle = (err) => ({
  width: '100%', padding: '11px 14px', border: `1px solid ${err ? C.terra : C.border}`,
  borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit',
  background: C.warmWhite, color: C.text, transition: 'border-color 0.2s',
})

export default function Checkout() {
  useSEO({ title: 'Checkout | VerdeBliss' })
  const navigate     = useNavigate()
  const razorReady   = useRazorpayScript()
  const items        = useCartStore((s) => s.items)
  const clearCart    = useCartStore((s) => s.clearCart)
  const total        = useCartStore(selectTotal)
  const itemCount    = useCartStore(selectItemCount)
  const pointsToEarn = useCartStore(selectPointsToEarn)
  const user         = useAuthStore((s) => s.user)
  const profile      = useAuthStore((s) => s.profile)

  const [step, setStep]       = useState(0)   // 0=address, 1=review, 2=paying
  const [status, setStatus]   = useState(null) // null | 'success' | 'failed'
  const [paymentId, setPayId] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors]   = useState({})

  const [form, setForm] = useState({
    name:    profile?.full_name ?? user?.email?.split('@')[0] ?? '',
    email:   user?.email ?? '',
    phone:   '',
    line1:   '',
    line2:   '',
    city:    '',
    state:   '',
    pincode: '',
  })

  /* Redirect to products if cart is empty */
  useEffect(() => {
    if (items.length === 0 && status !== 'success') navigate('/products')
  }, [items.length, navigate, status])

  const set_ = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  /* ── Validate address step ───────────────────────────────────────── */
  function validate() {
    const e = {}
    if (!form.name.trim())    e.name    = 'Full name is required'
    if (!form.email.trim())   e.email   = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.phone.trim())   e.phone   = 'Phone number is required'
    else if (!/^\d{10}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Enter a 10-digit phone number'
    if (!form.line1.trim())   e.line1   = 'Address is required'
    if (!form.city.trim())    e.city    = 'City is required'
    if (!form.state.trim())   e.state   = 'State is required'
    if (!form.pincode.trim()) e.pincode = 'PIN code is required'
    else if (!/^\d{6}$/.test(form.pincode)) e.pincode = 'Enter a valid 6-digit PIN code'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  /* ── Launch Razorpay ─────────────────────────────────────────────── */
  function launchRazorpay() {
    const key = import.meta.env.VITE_RAZORPAY_KEY_ID
    if (!key) {
      alert('Razorpay is not configured. Set VITE_RAZORPAY_KEY_ID in your environment variables.')
      return
    }
    if (!window.Razorpay) {
      alert('Payment gateway is still loading. Please wait a moment and try again.')
      return
    }

    setLoading(true)

    /* Amount in paise (₹1 = 100 paise) */
    const amountPaise = Math.round(total * 100)

    const options = {
      key,
      amount:   amountPaise,
      currency: 'INR',
      name:     'VerdeBliss',
      description: `Order of ${itemCount} item${itemCount !== 1 ? 's' : ''}`,
      image:    '/images/logo.webp',

      prefill: {
        name:    form.name,
        email:   form.email,
        contact: form.phone,
      },

      notes: {
        address: `${form.line1}, ${form.line2 ? form.line2 + ', ' : ''}${form.city}, ${form.state} - ${form.pincode}`,
        items:   items.map((i) => `${i.name} ×${i.qty}`).join('; '),
      },

      theme: {
        color: '#2D4A32',  // forest green
      },

      modal: {
        ondismiss: () => {
          setLoading(false)
        },
      },

      handler: (response) => {
        /* Payment successful */
        setPayId(response.razorpay_payment_id)
        setStatus('success')
        clearCart()
        setLoading(false)
      },
    }

    try {
      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (response) => {
        console.error('Razorpay payment failed:', response.error)
        setStatus('failed')
        setLoading(false)
      })
      rzp.open()
    } catch (err) {
      console.error('Razorpay error:', err)
      setLoading(false)
      alert('Could not open payment gateway. Please try again.')
    }
  }

  /* ── Shipping cost ───────────────────────────────────────────────── */
  const shipping    = total >= 499 ? 0 : 79
  const grandTotal  = total + shipping

  /* ══ SUCCESS STATE ═══════════════════════════════════════════════ */
  if (status === 'success') {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ background: C.card, borderRadius: 24, padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center', border: `1px solid ${C.border}` }}
        >
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}>
            <CheckCircle2 size={64} color={C.forest} style={{ margin: '0 auto 24px' }} />
          </motion.div>
          <h1 style={{ fontFamily: FONT.serif, fontSize: 32, color: C.text, fontWeight: 400, marginBottom: 12 }}>Order Confirmed!</h1>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, marginBottom: 8 }}>
            Thank you, {form.name.split(' ')[0]}! Your botanical ritual is on its way.
          </p>
          {paymentId && (
            <div style={{ background: C.goldPale, borderRadius: 10, padding: '10px 16px', marginBottom: 24, fontSize: 12, color: C.olive }}>
              Payment ID: <strong>{paymentId}</strong>
            </div>
          )}
          <div style={{ background: C.sagePale, borderRadius: 12, padding: '16px', marginBottom: 24, textAlign: 'left' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.forest, letterSpacing: '0.08em', marginBottom: 10 }}>DELIVERING TO</div>
            <div style={{ fontSize: 13, color: C.text }}>{form.name}</div>
            <div style={{ fontSize: 13, color: C.muted }}>{form.line1}{form.line2 ? `, ${form.line2}` : ''}</div>
            <div style={{ fontSize: 13, color: C.muted }}>{form.city}, {form.state} — {form.pincode}</div>
          </div>
          <div style={{ background: C.goldPale, borderRadius: 12, padding: '14px 16px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🏆</span>
            <span style={{ fontSize: 13, color: C.olive, fontWeight: 500 }}>
              <strong>{pointsToEarn} loyalty points</strong> will be credited to your account within 24 hours.
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
            <button onClick={() => navigate('/products')}
              style={{ background: C.forest, color: 'white', border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Continue Shopping
            </button>
            <button onClick={() => navigate('/account')}
              style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 12, padding: '13px', fontSize: 14, color: C.muted, cursor: 'pointer', fontFamily: 'inherit' }}>
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
        <button onClick={() => navigate('/products')}
          style={{ background: 'none', border: 'none', color: C.muted, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit', fontWeight: 500, marginBottom: 24, padding: 0 }}>
          <ArrowLeft size={13} /> Back to Shopping
        </button>

        <h1 style={{ fontFamily: FONT.serif, fontSize: 'clamp(24px,4vw,36px)', color: C.text, fontWeight: 400, marginBottom: 32 }}>Checkout</h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: 32, alignItems: 'start' }}>

          {/* ── LEFT: Form ─────────────────────────────────── */}
          <div>
            <Steps current={step} />

            <AnimatePresence mode="wait">
              {/* ── Step 0: Delivery Address ──────────────── */}
              {step === 0 && (
                <motion.div key="address" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div style={{ background: C.card, borderRadius: 20, padding: '28px', border: `1px solid ${C.border}`, marginBottom: 16 }}>
                    <h2 style={{ fontFamily: FONT.serif, fontSize: 20, color: C.text, fontWeight: 400, marginBottom: 20 }}>Delivery Address</h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <Field label="Full Name" required error={errors.name}>
                          <input value={form.name} onChange={set_('name')} placeholder="Kavya Menon" style={inputStyle(errors.name)} />
                        </Field>
                      </div>
                      <Field label="Email" required error={errors.email}>
                        <input value={form.email} onChange={set_('email')} type="email" placeholder="you@email.com" style={inputStyle(errors.email)} />
                      </Field>
                      <Field label="Phone" required error={errors.phone}>
                        <input value={form.phone} onChange={set_('phone')} type="tel" placeholder="9876543210" maxLength={10} style={inputStyle(errors.phone)} />
                      </Field>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <Field label="Address Line 1" required error={errors.line1}>
                          <input value={form.line1} onChange={set_('line1')} placeholder="Flat / House number, Street" style={inputStyle(errors.line1)} />
                        </Field>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <Field label="Address Line 2">
                          <input value={form.line2} onChange={set_('line2')} placeholder="Area, Landmark (optional)" style={inputStyle(false)} />
                        </Field>
                      </div>
                      <Field label="City" required error={errors.city}>
                        <input value={form.city} onChange={set_('city')} placeholder="Pune" style={inputStyle(errors.city)} />
                      </Field>
                      <Field label="State" required error={errors.state}>
                        <input value={form.state} onChange={set_('state')} placeholder="Maharashtra" style={inputStyle(errors.state)} />
                      </Field>
                      <Field label="PIN Code" required error={errors.pincode}>
                        <input value={form.pincode} onChange={set_('pincode')} placeholder="411014" maxLength={6} style={inputStyle(errors.pincode)} />
                      </Field>
                    </div>
                  </div>

                  <button
                    onClick={() => { if (validate()) setStep(1) }}
                    style={{ width: '100%', background: C.forest, color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Continue to Review →
                  </button>
                </motion.div>
              )}

              {/* ── Step 1: Review order ──────────────────── */}
              {step === 1 && (
                <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div style={{ background: C.card, borderRadius: 20, padding: '28px', border: `1px solid ${C.border}`, marginBottom: 16 }}>
                    <h2 style={{ fontFamily: FONT.serif, fontSize: 20, color: C.text, fontWeight: 400, marginBottom: 20 }}>Review Your Order</h2>

                    {/* Address summary */}
                    <div style={{ background: C.sagePale, borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: C.forest, letterSpacing: '0.07em', marginBottom: 4 }}>DELIVERING TO</div>
                          <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{form.name}</div>
                          <div style={{ fontSize: 12, color: C.muted }}>{form.line1}{form.line2 ? `, ${form.line2}` : ''}, {form.city}, {form.state} - {form.pincode}</div>
                          <div style={{ fontSize: 12, color: C.muted }}>{form.phone} · {form.email}</div>
                        </div>
                        <button onClick={() => setStep(0)} style={{ background: 'none', border: 'none', color: C.forest, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, textDecoration: 'underline', flexShrink: 0 }}>Edit</button>
                      </div>
                    </div>

                    {/* Items */}
                    {items.map((item) => (
                      <div key={item.id} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>
                        <div style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                          <ProductImage product={item} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: C.text, lineHeight: 1.3 }}>{item.name}</div>
                          <div style={{ fontSize: 12, color: C.muted }}>Qty: {item.qty}</div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: FONT.serif, flexShrink: 0 }}>
                          ₹{(item.price * item.qty).toLocaleString()}
                        </div>
                      </div>
                    ))}

                    {/* Totals */}
                    <div style={{ marginTop: 16, paddingTop: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.muted, marginBottom: 6 }}>
                        <span>Subtotal</span><span>₹{total.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.muted, marginBottom: 8 }}>
                        <span>Shipping</span>
                        <span style={{ color: shipping === 0 ? C.sage : C.text }}>
                          {shipping === 0 ? 'FREE' : `₹${shipping}`}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 700, color: C.text, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                        <span style={{ fontFamily: FONT.serif }}>Total</span>
                        <span style={{ fontFamily: FONT.serif }}>₹{grandTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment note */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.sagePale, borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: C.forest }}>
                    <ShieldCheck size={14} />
                    Secured by Razorpay · UPI, Cards, Net Banking, Wallets accepted
                  </div>

                  <button
                    onClick={launchRazorpay}
                    disabled={loading || !razorReady}
                    style={{ width: '100%', background: loading ? C.sage : C.forest, color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                    {loading
                      ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Opening Payment Gateway…</>
                      : !razorReady
                      ? 'Loading payment gateway…'
                      : <>Pay ₹{grandTotal.toLocaleString()} with Razorpay</>
                    }
                  </button>

                  {status === 'failed' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FCEBEB', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#A32D2D', marginTop: 8 }}>
                      <AlertCircle size={14} /> Payment failed. Please try again or use a different payment method.
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── RIGHT: Order summary ────────────────────── */}
          <div style={{ position: 'sticky', top: 80 }}>
            <div style={{ background: C.card, borderRadius: 20, padding: '24px', border: `1px solid ${C.border}` }}>
              <h2 style={{ fontFamily: FONT.serif, fontSize: 18, color: C.text, fontWeight: 400, marginBottom: 16 }}>
                Order Summary <span style={{ fontSize: 13, color: C.muted, fontFamily: 'inherit' }}>({itemCount} items)</span>
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                {items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                      <ProductImage product={item} />
                      <span style={{ position: 'absolute', top: -4, right: -4, background: C.forest, color: 'white', borderRadius: '50%', width: 16, height: 16, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.qty}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: C.text, fontWeight: 500, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, flexShrink: 0 }}>₹{(item.price * item.qty).toLocaleString()}</div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.muted, marginBottom: 6 }}>
                  <span>Subtotal</span><span>₹{total.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: shipping === 0 ? C.sage : C.muted, marginBottom: 12 }}>
                  <span>Shipping</span><span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, color: C.text }}>
                  <span style={{ fontFamily: FONT.serif }}>Total</span>
                  <span style={{ fontFamily: FONT.serif }}>₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Loyalty + delivery info */}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: C.olive }}>
                  <span>🏆</span> Earn <strong>{pointsToEarn} points</strong> on this order
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: C.muted }}>
                  <Truck size={12} /> {shipping === 0 ? 'Free shipping included' : `Add ₹${499 - total} for free shipping`}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: C.muted }}>
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
