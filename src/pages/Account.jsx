import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LogOut, Heart, Leaf, Check } from 'lucide-react'
import LoyaltyPanel from '@/components/features/loyalty/LoyaltyPanel'
import { useAuthStore } from '@/store/authStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { supabase } from '@/lib/supabase'
import { PRODUCTS } from '@/constants/products'
import { C, FONT } from '@/constants/theme'

// ── Login / Register ───────────────────────────────────
function AuthForm() {
  const [mode, setMode]     = useState('login')
  const [email, setEmail]   = useState('')
  const [pass, setPass]     = useState('')
  const [name, setName]     = useState('')
  const [skin, setSkin]     = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp, signInWithGoogle } = useAuthStore()

  const submit = async () => {
    setError(''); setLoading(true)
    try {
      if (mode === 'login') await signIn(email, pass)
      else                  await signUp(email, pass, name, skin)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '82vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', background: C.bg }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 24, padding: 48, width: '100%', maxWidth: 420, boxShadow: '0 4px 40px rgba(0,0,0,0.05)' }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: C.sagePale, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Leaf size={24} color={C.forest} />
          </div>
          <h2 style={{ fontFamily: FONT.serif, fontSize: 34, color: C.text, margin: 0, fontWeight: 400 }}>
            {mode === 'login' ? 'Welcome back' : 'Join VerdeBliss'}
          </h2>
          <p style={{ fontSize: 14, color: C.muted, marginTop: 6 }}>
            {mode === 'login' ? 'Sign in to access your account & points' : 'Begin your botanical beauty journey'}
          </p>
        </div>

        {error && (
          <div style={{ background: '#FCEBEB', border: '1px solid #F7C1C1', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#A32D2D', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'register' && (
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name"
              style={{ padding: '12px 16px', border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: C.bg, color: C.text }} />
          )}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address"
            style={{ padding: '12px 16px', border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: C.bg, color: C.text }} />
          <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Password"
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            style={{ padding: '12px 16px', border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: C.bg, color: C.text }} />
          {mode === 'register' && (
            <select value={skin} onChange={(e) => setSkin(e.target.value)}
              style={{ padding: '12px 16px', border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: C.bg, color: C.text }}>
              <option value="">Your skin type (personalised picks)</option>
              {['Dry', 'Oily', 'Combination', 'Sensitive'].map((s) => <option key={s}>{s}</option>)}
            </select>
          )}

          <motion.button whileTap={{ scale: 0.97 }} onClick={submit} disabled={loading}
            style={{ background: loading ? C.sage : C.forest, color: 'white', border: 'none', borderRadius: 10, padding: 13, fontSize: 15, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', marginTop: 4 }}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </motion.button>

          {mode === 'login' && <div style={{ textAlign: 'center', fontSize: 13, color: C.terra, cursor: 'pointer' }}>Forgot your password?</div>}

          <div style={{ textAlign: 'center', fontSize: 13, color: C.muted }}>
            {mode === 'login' ? "Don't have an account? " : 'Already a member? '}
            <span onClick={() => setMode(mode === 'login' ? 'register' : 'login')} style={{ color: C.forest, fontWeight: 600, cursor: 'pointer' }}>
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 12, color: C.muted }}>or</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>

          <button onClick={signInWithGoogle}
            style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, background: C.ivory, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', color: C.text, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            🌐 Continue with Google
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Dashboard ──────────────────────────────────────────
function Dashboard({ user, profile }) {
  const signOut  = useAuthStore((s) => s.signOut)
  const { ids: wishIds } = useWishlistStore()
  const [orders, setOrders] = useState([])

  useEffect(() => {
    supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => data && setOrders(data))
  }, [user.id])

  const wishProducts = PRODUCTS.filter((p) => wishIds.includes(p.id))

  return (
    <div style={{ background: C.bg, minHeight: '80vh' }}>
      {/* Header */}
      <div style={{ background: C.forest, padding: '48px 24px 72px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 10, color: C.sage, letterSpacing: '0.14em', marginBottom: 8, fontWeight: 600 }}>MY ACCOUNT</div>
            <h1 style={{ fontFamily: FONT.serif, fontSize: 44, color: 'white', margin: 0, fontWeight: 400 }}>
              Hello, {profile?.full_name?.split(' ')[0] ?? 'there'} 🌿
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', margin: '8px 0 0', fontSize: 14 }}>Welcome back to your botanical sanctuary</p>
          </div>
          <button onClick={signOut}
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '9px 18px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '-40px auto 0', padding: '0 24px 80px', display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 20 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Profile card */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: C.sagePale, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: C.forest }}>
                {(profile?.full_name ?? user.email)?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: C.text }}>{profile?.full_name ?? '—'}</div>
                <div style={{ fontSize: 13, color: C.muted }}>{user.email}</div>
                {profile?.skin_type && <div style={{ fontSize: 11, color: C.sage, fontWeight: 500, marginTop: 2 }}>{profile.skin_type} skin</div>}
              </div>
            </div>
          </div>

          <LoyaltyPanel profile={profile} />

          {/* Tier benefits */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.text, letterSpacing: '0.07em', marginBottom: 14 }}>
              {profile?.tier?.toUpperCase() ?? 'GREEN LEAF'} BENEFITS
            </div>
            {[['🎁', 'Birthday bonus — double points'], ['🚀', 'Free express shipping'], ['💎', 'Early access to new launches'], ['🌿', 'Personalised routine review']].map(([e, b]) => (
              <div key={b} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${C.border}` }}>
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
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 20 }}>Order History</div>
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0', color: C.muted, fontSize: 13 }}>No orders yet — time to shop! 🌿</div>
            ) : orders.map((o) => (
              <div key={o.id} style={{ padding: '16px 0', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{o.id.slice(0, 8).toUpperCase()}</div>
                  <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 99, fontWeight: 700, background: o.status === 'Delivered' ? '#EBF0E9' : '#FFF5E4', color: o.status === 'Delivered' ? '#1E5C28' : '#664A08' }}>
                    {o.status}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.muted }}>
                  <span>{new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span style={{ fontWeight: 600, color: C.text }}>₹{o.total?.toLocaleString()}</span>
                </div>
                <div style={{ fontSize: 12, color: C.sage, marginTop: 4 }}>+{o.points_earned} points earned</div>
              </div>
            ))}
          </div>

          {/* Wishlist */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Heart size={15} color={C.terra} /> Wishlist ({wishProducts.length})
            </div>
            {wishProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: C.muted, fontSize: 13 }}>No items wishlisted yet</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 10 }}>
                {wishProducts.map((p) => (
                  <div key={p.id} style={{ background: p.bg_color, borderRadius: 12, padding: '14px 10px', textAlign: 'center', cursor: 'pointer', border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>{p.emoji}</div>
                    <div style={{ fontSize: 10, color: C.text, fontWeight: 500, lineHeight: 1.3 }}>{p.name.split(' ').slice(0, 2).join(' ')}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2, fontWeight: 600 }}>₹{p.price?.toLocaleString()}</div>
                  </div>
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
  const { user, profile, loading } = useAuthStore()
  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: C.muted }}>Loading…</div>
  if (!user)   return <AuthForm />
  return <Dashboard user={user} profile={profile} />
}
