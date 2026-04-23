/**
 * ChatBot.jsx — Context-aware support + beauty advisor
 *
 * When a user is logged in the bot receives:
 *   - profile (name, skin type, tier, points)
 *   - last 5 orders (id, status, total, items, created_at, payment_id)
 *
 * This lets Gemini answer:
 *   "Where is my order?"  "Can I get a refund?"  "How many points do I have?"
 *
 * Guest users see generic beauty advice + a sign-in nudge for account queries.
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, LogIn } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { C } from '@/constants/theme'
import { useWindowWidth, BP } from '@/hooks/useWindowWidth'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'

/* ── Quick reply sets ───────────────────────────────────────────────── */
const GUEST_REPLIES = [
  'Best serum for dry skin?',
  'What is Bakuchiol?',
  'Routine for oily skin?',
  'Do you have SPF options?',
]

const MEMBER_REPLIES = [
  'Where is my order?',
  'How do I request a refund?',
  'How many loyalty points do I have?',
  'Best products for my skin type?',
  'Track my latest order',
]

/* ── Fetch last 5 orders for a user ────────────────────────────────── */
async function fetchUserOrders(userId) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('id, status, total, items, payment_id, created_at, address')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)
    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}

/* ── Format orders for the AI system prompt ─────────────────────────── */
function buildOrderSummary(orders) {
  if (!orders.length) return 'No orders found for this user.'
  return orders.map((o, i) => {
    const date  = new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    const items = Array.isArray(o.items)
      ? o.items.map((it) => `${it.name} ×${it.qty}`).join(', ')
      : 'items not available'
    return `Order ${i + 1}: ID ${o.id.slice(0, 8)}… | Status: ${o.status} | Total: ₹${o.total} | Date: ${date} | Items: ${items} | Payment ref: ${o.payment_id || 'N/A'}`
  }).join('\n')
}

export default function ChatBot() {
  const navigate   = useNavigate()
  const width      = useWindowWidth()
  const isMobile   = width < BP.tablet
  const user       = useAuthStore((s) => s.user)
  const profile    = useAuthStore((s) => s.profile)

  const [open,    setOpen]    = useState(false)
  const [msgs,    setMsgs]    = useState([])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [orders,  setOrders]  = useState([])
  const [ordersLoaded, setOrdersLoaded] = useState(false)
  const endRef = useRef(null)

  /* ── Welcome message depends on auth state ─────────────────────── */
  const welcomeMsg = useCallback(() => {
    if (user && profile?.full_name) {
      return `Hello, ${profile.full_name.split(' ')[0]}! 🌿 I'm Verde. I can help with your orders, loyalty points, returns, or finding the perfect skincare. What do you need?`
    }
    return "Hello! I'm Verde, your botanical beauty advisor 🌿 How can I help you find your perfect skincare match today?"
  }, [user, profile])

  /* Reset messages when auth state changes */
  useEffect(() => {
    setMsgs([{ role: 'assistant', content: welcomeMsg() }])
    setOrdersLoaded(false)
    setOrders([])
  }, [user?.id, welcomeMsg])

  /* Scroll to bottom on new messages */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, loading])

  /* Fetch orders when panel opens and user is logged in */
  useEffect(() => {
    if (open && user?.id && !ordersLoaded) {
      fetchUserOrders(user.id).then((data) => {
        setOrders(data)
        setOrdersLoaded(true)
      })
    }
  }, [open, user?.id, ordersLoaded])

  /* ── Send message ───────────────────────────────────────────────── */
  const send = async (text) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')
    const next = [...msgs, { role: 'user', content: msg }]
    setMsgs(next)
    setLoading(true)

    try {
      /* Build user context for the API */
      const context = user
        ? {
            isLoggedIn:  true,
            name:        profile?.full_name ?? user.email,
            email:       user.email,
            skinType:    profile?.skin_type ?? 'not specified',
            tier:        profile?.tier ?? 'Green Leaf',
            points:      profile?.points ?? 0,
            orderCount:  orders.length,
            orders:      buildOrderSummary(orders),
          }
        : { isLoggedIn: false }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, context }),
      })

      const data = await res.json()

      if (!res.ok) {
        console.error('[ChatBot] API error', res.status, data)
        setMsgs([...next, { role: 'assistant', content: `⚠️ ${data?.error ?? `Server error ${res.status}`}` }])
      } else {
        const reply = data.content?.[0]?.text ?? 'Let me help you find the perfect match! 🌿'
        setMsgs([...next, { role: 'assistant', content: reply }])
      }
    } catch (err) {
      console.error('[ChatBot] Network error', err)
      setMsgs([...next, { role: 'assistant', content: "Couldn't reach the server — please check your connection." }])
    }
    setLoading(false)
  }

  /* ── Responsive layout values ───────────────────────────────────── */
  const fabRight    = isMobile ? 16 : 28
  const fabBottom   = isMobile ? 20 : 28
  const panelRight  = isMobile ? 16 : 28
  const panelWidth  = isMobile ? 'calc(100vw - 32px)' : 'min(360px, calc(100vw - 56px))'
  const panelHeight = isMobile ? 460 : 520
  const panelBottom = isMobile ? 80 : 94

  const quickReplies = user ? MEMBER_REPLIES : GUEST_REPLIES

  return (
    <>
      {/* FAB — no whileHover (causes glow bleed on mobile) */}
      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close chat' : 'Chat with Verde'}
        style={{
          position: 'fixed', bottom: fabBottom, right: fabRight,
          width: 52, height: 52, borderRadius: '50%',
          background: C.forest, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isMobile ? '0 2px 12px rgba(45,74,50,0.35)' : '0 4px 20px rgba(45,74,50,0.4)',
          zIndex: 150,
        }}
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X size={20} color="white" /></motion.span>
            : <motion.span key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><MessageCircle size={20} color="white" /></motion.span>
          }
        </AnimatePresence>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.94 }}
            transition={{ type: 'spring', damping: 26 }}
            role="dialog"
            aria-label="Verde — VerdeBliss support advisor"
            style={{
              position: 'fixed', bottom: panelBottom, right: panelRight,
              width: panelWidth, height: panelHeight,
              background: C.card, borderRadius: 20,
              border: `1px solid ${C.border}`,
              boxShadow: '0 8px 48px rgba(0,0,0,0.14)',
              zIndex: 150, display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ background: `linear-gradient(135deg, ${C.forest}, #3D6344)`, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <img src="/images/logo.webp" alt="" aria-hidden="true"
                style={{ height: 32, width: 32, objectFit: 'contain', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', padding: 3 }}
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>Verde</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)' }}>
                  {user ? `${profile?.tier ?? 'Member'} · Beauty & Order Support` : 'Botanical Beauty Advisor'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80' }} />
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>Online</span>
              </div>
            </div>

            {/* Sign-in nudge for guests asking account queries */}
            {!user && (
              <div style={{ background: C.goldPale, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
                <LogIn size={13} color={C.olive} />
                <span style={{ fontSize: 11, color: C.olive, flex: 1 }}>Sign in to track orders & get personalised help</span>
                <button onClick={() => { setOpen(false); navigate('/account') }}
                  style={{ fontSize: 11, fontWeight: 600, color: C.forest, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>
                  Sign in
                </button>
              </div>
            )}

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {msgs.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
                  {m.role === 'assistant' && (
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: C.sagePale, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0, border: `1px solid ${C.border}` }}>
                      🌿
                    </div>
                  )}
                  <div style={{
                    fontSize: 13, lineHeight: 1.6,
                    padding: '9px 12px',
                    borderRadius: m.role === 'user' ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                    background: m.role === 'user' ? C.forest : C.ivory,
                    color: m.role === 'user' ? 'white' : C.text,
                    border: m.role === 'user' ? 'none' : `1px solid ${C.border}`,
                    maxWidth: '80%',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {m.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: C.sagePale, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>🌿</div>
                  <div style={{ display: 'flex', gap: 4, padding: '10px 12px', background: C.ivory, border: `1px solid ${C.border}`, borderRadius: '14px 14px 14px 3px' }}>
                    {[0, 1, 2].map((i) => (
                      <motion.div key={i} animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        style={{ width: 6, height: 6, borderRadius: '50%', background: C.sage }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Quick replies — show after welcome only */}
            {msgs.length <= 1 && (
              <div style={{ padding: '0 14px 10px', display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
                {quickReplies.map((q) => (
                  <button key={q} onClick={() => send(q)}
                    style={{ fontSize: 11, color: C.forest, border: `1px solid ${C.sage}`, borderRadius: 20, padding: '4px 10px', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div style={{ padding: '10px 14px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder={user ? 'Ask about orders, refunds, skin care…' : 'Ask about ingredients, routines…'}
                style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', background: C.warmWhite, color: C.text }}
              />
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => send()} aria-label="Send"
                style={{ background: C.terra, border: 'none', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Send size={15} color="white" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
