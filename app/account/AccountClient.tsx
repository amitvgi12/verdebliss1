'use client'
import Link from 'next/link'
import { useState, useEffect, type FormEvent, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { LogOut, Heart, Leaf, Check } from 'lucide-react'
import LoyaltyPanel from '@/components/features/loyalty/LoyaltyPanel'
import ProductImage from '@/components/ui/ProductImage'
import { useAuthStore } from '@/store/authStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { supabase } from '@/lib/supabase'
import { apiPost } from '@/lib/api-client'
import { productPath } from '@/lib/seo'
import { PRODUCTS } from '@/constants/products'
import { C, FONT } from '@/constants/theme'

// ── Login / Register ───────────────────────────────────
function AuthForm({
  bootstrapLoading = false,
  bootstrapError = null,
}: {
  bootstrapLoading?: boolean
  bootstrapError?: string | null
}) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [name, setName] = useState('')
  const [skin, setSkin] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resetting, setResetting] = useState(false)
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuthStore()
  const displayedError = error || bootstrapError || ''
  const busy = bootstrapLoading || submitting || resetting

  const submit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    setError('')
    setNotice('')
    setSubmitting(true)
    try {
      if (mode === 'login') await signIn(email, pass)
      else await signUp(email, pass, name, skin)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSubmitting(false)
    }
  }

  const requestPasswordReset = async () => {
    if (!email.trim()) {
      setError('Enter your email address first so we can send the reset link.')
      return
    }

    setError('')
    setNotice('')
    setResetting(true)
    try {
      await resetPassword(email)
      setNotice('Password reset email sent. Check your inbox for the secure reset link.')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setResetting(false)
    }
  }

  return (
    <AuthShell>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: C.sagePale,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Leaf size={24} color={C.forest} />
          </div>
          <h2
            style={{
              fontFamily: FONT.serif,
              fontSize: 34,
              color: C.text,
              margin: 0,
              fontWeight: 400,
            }}
          >
            {mode === 'login' ? 'Welcome back' : 'Join VerdeBliss'}
          </h2>
          <p style={{ fontSize: 14, color: C.muted, marginTop: 6 }}>
            {mode === 'login'
              ? 'Sign in to access your account & points'
              : 'Begin your botanical beauty journey'}
          </p>
        </div>

        {bootstrapLoading && (
          <div
            aria-live="polite"
            style={{
              background: C.sagePale,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 13,
              color: C.forest,
              marginBottom: 16,
            }}
          >
            Checking your account status...
          </div>
        )}

        {displayedError && (
          <div
            role="alert"
            aria-live="assertive"
            style={{
              background: '#FCEBEB',
              border: '1px solid #F7C1C1',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 13,
              color: '#A32D2D',
              marginBottom: 16,
            }}
          >
            {displayedError}
          </div>
        )}

        {notice && (
          <div
            aria-live="polite"
            style={{
              background: C.sagePale,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 13,
              color: C.forest,
              marginBottom: 16,
            }}
          >
            {notice}
          </div>
        )}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'register' && (
            <Field label="Full name" htmlFor="account-full-name">
              <input
                id="account-full-name"
                name="full_name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                autoComplete="name"
                disabled={busy}
                style={fieldControlStyle}
              />
            </Field>
          )}
          <Field label="Email address" htmlFor="account-email">
            <input
              id="account-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              autoComplete="email"
              disabled={busy}
              required
              style={fieldControlStyle}
            />
          </Field>
          <Field label="Password" htmlFor="account-password">
            <input
              id="account-password"
              name="password"
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="Password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              disabled={busy}
              required
              style={fieldControlStyle}
            />
          </Field>
          {mode === 'register' && (
            <Field label="Skin type" htmlFor="account-skin-type">
              <select
                id="account-skin-type"
                name="skin_type"
                aria-label="Skin type"
                value={skin}
                onChange={(e) => setSkin(e.target.value)}
                disabled={busy}
                style={fieldControlStyle}
              >
                <option value="">Choose your skin type</option>
                {['Dry', 'Oily', 'Combination', 'Sensitive'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={busy}
            style={{
              background: busy ? C.sage : C.forest,
              color: 'white',
              border: 'none',
              borderRadius: 10,
              padding: 13,
              fontSize: 15,
              fontWeight: 600,
              cursor: busy ? 'wait' : 'pointer',
              fontFamily: 'inherit',
              marginTop: 4,
            }}
          >
            {submitting ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </motion.button>

          {mode === 'login' && (
            <button
              type="button"
              onClick={requestPasswordReset}
              disabled={busy}
              style={inlineActionStyle}
            >
              {resetting ? 'Sending reset link...' : 'Forgot your password?'}
            </button>
          )}

          <div style={{ textAlign: 'center', fontSize: 13, color: C.muted }}>
            {mode === 'login' ? "Don't have an account? " : 'Already a member? '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login')
                setError('')
                setNotice('')
              }}
              disabled={busy}
              style={textButtonStyle}
            >
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 12, color: C.muted }}>or</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>

          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={busy}
            style={{
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: 12,
              background: C.ivory,
              cursor: 'pointer',
              fontSize: 14,
              fontFamily: 'inherit',
              color: C.text,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            🌐 Continue with Google
          </button>
        </form>
      </motion.div>
    </AuthShell>
  )
}

function PasswordRecoveryForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const updatePassword = useAuthStore((s) => s.updatePassword)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Use at least 8 characters for your new password.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await updatePassword(password)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: C.sagePale,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <Leaf size={24} color={C.forest} />
        </div>
        <h2
          style={{
            fontFamily: FONT.serif,
            fontSize: 34,
            color: C.text,
            margin: 0,
            fontWeight: 400,
          }}
        >
          Set a new password
        </h2>
        <p style={{ fontSize: 14, color: C.muted, marginTop: 6 }}>
          Choose a fresh password for your VerdeBliss account.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            background: '#FCEBEB',
            border: '1px solid #F7C1C1',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 13,
            color: '#A32D2D',
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="New password" htmlFor="account-new-password">
          <input
            id="account-new-password"
            name="new_password"
            type="password"
            aria-label="New password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            disabled={submitting}
            required
            style={fieldControlStyle}
          />
        </Field>
        <Field label="Confirm new password" htmlFor="account-confirm-password">
          <input
            id="account-confirm-password"
            name="confirm_password"
            type="password"
            aria-label="Confirm new password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            disabled={submitting}
            required
            style={fieldControlStyle}
          />
        </Field>
        <button
          type="submit"
          disabled={submitting}
          style={{
            background: submitting ? C.sage : C.forest,
            color: 'white',
            border: 'none',
            borderRadius: 10,
            padding: 13,
            fontSize: 15,
            fontWeight: 600,
            cursor: submitting ? 'wait' : 'pointer',
            fontFamily: 'inherit',
            marginTop: 4,
          }}
        >
          {submitting ? 'Updating password...' : 'Update Password'}
        </button>
      </form>
    </AuthShell>
  )
}

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: '82vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        background: C.bg,
      }}
    >
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 24,
          padding: 48,
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 4px 40px rgba(0,0,0,0.05)',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: ReactNode
}) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        display: 'grid',
        gap: 6,
        color: C.text,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {label}
      {children}
    </label>
  )
}

const fieldControlStyle = {
  padding: '12px 16px',
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
  background: C.bg,
  color: C.text,
}

const inlineActionStyle = {
  border: 'none',
  background: 'none',
  color: C.terra,
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 13,
  justifySelf: 'center',
  padding: 0,
}

const textButtonStyle = {
  border: 'none',
  background: 'none',
  color: C.forest,
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 13,
  fontWeight: 600,
  padding: 0,
}

// ── Dashboard ──────────────────────────────────────────
interface OrderRow {
  id: string
  status?: string
  payment_status?: string
  total?: number
  points_earned?: number
  created_at?: string
  items?: Array<{ id: string; name: string; qty: number; price: number }>
  tracking_id?: string | null
  courier_partner?: string | null
  tracking_url?: string | null
}

const ORDER_STATUS_CHIP: Record<string, { bg: string; color: string }> = {
  Delivered: { bg: '#EBF0E9', color: '#1E5C28' },
  Shipped: { bg: '#EAF0E8', color: '#455C3C' },
  'Out for Delivery': { bg: '#EBF0E9', color: '#2D4A32' },
  Cancelled: { bg: '#F5F5F5', color: '#666' },
  Refunded: { bg: '#EDF4FB', color: '#1A5276' },
  'Cancellation Requested': { bg: '#FFF0ED', color: '#8B3A24' },
}

function orderStatusChip(status?: string) {
  return ORDER_STATUS_CHIP[status ?? ''] ?? { bg: '#FFF5E4', color: '#664A08' }
}

function canCancelOrder(status?: string | null) {
  const normalised = String(status ?? '').toLowerCase()
  return (
    Boolean(normalised) &&
    !normalised.includes('delivered') &&
    !normalised.includes('cancel') &&
    !normalised.includes('refunded')
  )
}

function Dashboard({
  user,
  profile,
}: {
  user: { id: string; email?: string }
  profile: import('@/types').CustomerProfile | null
}) {
  const signOut = useAuthStore((s) => s.signOut)
  const { ids: wishIds } = useWishlistStore()
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null)
  const [orderNotice, setOrderNotice] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  useEffect(() => {
    supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (Array.isArray(data)) setOrders(data as OrderRow[])
      })
  }, [user.id])

  const cancelOrder = async (orderId: string) => {
    if (!window.confirm('Cancel this order before delivery?')) return

    setCancellingOrderId(orderId)
    setOrderNotice(null)
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      const result = await apiPost<{ status: string; message?: string }>(
        '/api/orders/cancel',
        { orderId },
        { authToken: token }
      )

      setOrders((current) =>
        current.map((order) => (order.id === orderId ? { ...order, status: result.status } : order))
      )
      setOrderNotice({
        type: 'success',
        text: result.message ?? 'Cancellation request received.',
      })
    } catch (error) {
      setOrderNotice({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unable to cancel order.',
      })
    } finally {
      setCancellingOrderId(null)
    }
  }

  const wishProducts = PRODUCTS.filter((p) => wishIds.includes(p.id))

  return (
    <div style={{ background: C.bg, minHeight: '80vh' }}>
      {/* Header */}
      <div style={{ background: C.forest, padding: '48px 24px 72px' }}>
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                color: C.sage,
                letterSpacing: '0.14em',
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              MY ACCOUNT
            </div>
            <h1
              style={{
                fontFamily: FONT.serif,
                fontSize: 44,
                color: 'white',
                margin: 0,
                fontWeight: 400,
              }}
            >
              Hello, {profile?.full_name?.split(' ')[0] ?? 'there'} 🌿
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', margin: '8px 0 0', fontSize: 14 }}>
              Welcome back to your botanical sanctuary
            </p>
          </div>
          <button
            onClick={signOut}
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 10,
              padding: '9px 18px',
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'inherit',
            }}
          >
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1100,
          margin: '-40px auto 0',
          padding: '0 24px 80px',
          display: 'grid',
          gridTemplateColumns: '1fr 1.5fr',
          gap: 20,
        }}
      >
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Profile card */}
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: C.sagePale,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 700,
                  color: C.forest,
                }}
              >
                {(profile?.full_name ?? user.email)?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: C.text }}>
                  {profile?.full_name ?? '—'}
                </div>
                <div style={{ fontSize: 13, color: C.muted }}>{user.email}</div>
                {profile?.skin_type && (
                  <div style={{ fontSize: 11, color: C.sage, fontWeight: 500, marginTop: 2 }}>
                    {profile.skin_type} skin
                  </div>
                )}
              </div>
            </div>
          </div>

          <LoyaltyPanel profile={profile} />

          {/* Tier benefits */}
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              padding: 20,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.text,
                letterSpacing: '0.07em',
                marginBottom: 14,
              }}
            >
              {profile?.tier?.toUpperCase() ?? 'GREEN LEAF'} BENEFITS
            </div>
            {[
              ['🎁', 'Birthday bonus — double points'],
              ['🚀', 'Free express shipping'],
              ['💎', 'Early access to new launches'],
              ['🌿', 'Personalised routine review'],
            ].map(([e, b]) => (
              <div
                key={b}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                  padding: '7px 0',
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <span style={{ fontSize: 15 }}>{e}</span>
                <span style={{ fontSize: 12, color: C.muted, flex: 1 }}>{b}</span>
                <Check size={12} color={C.sage} />
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Orders */}
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              padding: 24,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 20 }}>
              Order History
            </div>
            {orderNotice &&
              (orderNotice.type === 'error' ? (
                <div
                  role="alert"
                  style={{
                    marginBottom: 16,
                    borderRadius: 12,
                    border: '1px solid #F1B8A5',
                    background: '#FFF2EC',
                    color: '#8B3A24',
                    padding: '10px 12px',
                    fontSize: 12,
                    lineHeight: 1.5,
                  }}
                >
                  {orderNotice.text}
                </div>
              ) : (
                <div
                  role="status"
                  style={{
                    marginBottom: 16,
                    borderRadius: 12,
                    border: '1px solid #CADCCA',
                    background: '#EFF6EE',
                    color: C.forest,
                    padding: '10px 12px',
                    fontSize: 12,
                    lineHeight: 1.5,
                  }}
                >
                  {orderNotice.text}
                </div>
              ))}
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0', color: C.muted, fontSize: 13 }}>
                No orders yet — time to shop! 🌿
              </div>
            ) : (
              orders.map((o) => (
                <div
                  key={o.id}
                  style={{ padding: '16px 0', borderBottom: `1px solid ${C.border}` }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 6,
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                      {o.id.slice(0, 8).toUpperCase()}
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '4px 10px',
                        borderRadius: 99,
                        fontWeight: 700,
                        background: orderStatusChip(o.status).bg,
                        color: orderStatusChip(o.status).color,
                      }}
                    >
                      {o.status}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 13,
                      color: C.muted,
                    }}
                  >
                    <span>
                      {new Date(o.created_at ?? Date.now()).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span style={{ fontWeight: 600, color: C.text }}>
                      ₹{o.total?.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: C.sage, marginTop: 4 }}>
                    +{o.points_earned} points earned
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    <Link
                      href={`/account/orders/${o.id}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        border: `1px solid ${C.border}`,
                        borderRadius: 999,
                        background: C.sagePale,
                        color: C.forest,
                        textDecoration: 'none',
                        fontSize: 12,
                        fontWeight: 700,
                        padding: '7px 14px',
                      }}
                    >
                      View details →
                    </Link>
                    {o.tracking_url && (
                      <a
                        href={o.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          border: `1px solid ${C.border}`,
                          borderRadius: 999,
                          background: C.forest,
                          color: '#fff',
                          textDecoration: 'none',
                          fontSize: 12,
                          fontWeight: 700,
                          padding: '7px 14px',
                        }}
                      >
                        Track Order →
                      </a>
                    )}
                    {canCancelOrder(o.status) && (
                      <button
                        type="button"
                        onClick={() => void cancelOrder(o.id)}
                        disabled={cancellingOrderId === o.id}
                        style={{
                          border: `1px solid ${C.border}`,
                          borderRadius: 999,
                          background: '#FAF4EE',
                          color: C.forest,
                          cursor: cancellingOrderId === o.id ? 'not-allowed' : 'pointer',
                          fontFamily: 'inherit',
                          fontSize: 12,
                          fontWeight: 700,
                          padding: '7px 14px',
                          opacity: cancellingOrderId === o.id ? 0.65 : 1,
                        }}
                      >
                        {cancellingOrderId === o.id ? 'Cancelling...' : 'Cancel order'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Wishlist */}
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              padding: 24,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: C.text,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Heart size={15} color={C.terra} /> Wishlist ({wishProducts.length})
            </div>
            {wishProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: C.muted, fontSize: 13 }}>
                No items wishlisted yet
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                  gap: 10,
                }}
              >
                {wishProducts.map((p) => (
                  <Link
                    key={p.id}
                    href={productPath(p)}
                    aria-label={`View ${p.name}`}
                    style={{
                      background: C.card,
                      borderRadius: 12,
                      padding: 8,
                      textAlign: 'center',
                      cursor: 'pointer',
                      border: `1px solid ${C.border}`,
                      textDecoration: 'none',
                      color: 'inherit',
                      display: 'block',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: '1 / 1',
                        borderRadius: 10,
                        overflow: 'hidden',
                        border: `1px solid ${C.border}`,
                        marginBottom: 8,
                        background: p.bg_color,
                      }}
                    >
                      <ProductImage product={p} sizes="96px" />
                    </div>
                    <div style={{ fontSize: 11, color: C.text, fontWeight: 600, lineHeight: 1.3 }}>
                      {p.name.split(' ').slice(0, 2).join(' ')}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2, fontWeight: 600 }}>
                      ₹{p.price?.toLocaleString()}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page export ────────────────────────────────────────
export default function Account() {
  const { user, profile, loading, initializationError, recoveryMode } = useAuthStore()
  if (recoveryMode) return <PasswordRecoveryForm />
  if (loading) return <AuthForm bootstrapLoading />
  if (!user) return <AuthForm bootstrapError={initializationError} />
  return <Dashboard user={user} profile={profile} />
}
