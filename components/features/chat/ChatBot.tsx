'use client'
/**
 * ChatBot.tsx — Context-aware support + beauty advisor
 *
 * When a user is logged in the bot receives:
 *   - profile (name, skin type, tier, points)
 *   - limited recent order context when needed for an order-related request
 *
 * This lets Gemini answer:
 *   "Where is my order?"  "Can I get a refund?"  "How many points do I have?"
 *
 * Guest users see generic beauty advice + a sign-in nudge for account queries.
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, LogIn, ShieldCheck } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { C } from '@/constants/theme'
import { BUSINESS_COMPLIANCE } from '@/constants/businessCompliance'
import {
  CONSENT_UPDATED_EVENT,
  loadStoredConsent,
  persistConsent,
  type StoredConsent,
} from '@/lib/consent'
import { useAuthStore } from '@/store/authStore'

interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

function renderMessage(text: string, isUser: boolean) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g)
  return parts.map((part, i) => {
    const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (match) {
      return (
        <a
          key={i}
          href={match[2]}
          style={{
            color: isUser ? 'rgba(255,255,255,0.9)' : '#2D5A35',
            textDecoration: 'underline',
            fontWeight: 600,
          }}
        >
          {match[1]}
        </a>
      )
    }
    return part
  })
}

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

const AI_CONSENT_REQUEST =
  'I can help with that through Verde AI support, but I need your permission first. If you agree, your chat message may be sent to Google Gemini. For signed-in order questions, limited account and recent order context may also be included.'

const AI_CONSENT_DECLINED =
  "No problem. I can't continue with AI support without that consent. You can still use the FAQ, account page, or contact form, and you can change this later from Cookie preferences in the footer."

function needsPersonalAiContext(message: string) {
  return /\b(where is my order|track my|latest order|order status|my order|how many loyalty points|how many points|my points|my loyalty|my account|my refund|refund status)\b/i.test(
    message
  )
}

function consentSafeReply(message: string): string | null {
  const text = message.toLowerCase()

  if (needsPersonalAiContext(message)) return null

  if (/^(hi|hello|hey)\b/.test(text) || text.includes('what can you do')) {
    return 'I can help with general ingredient basics, routines, shipping, COD, returns, and support links without AI consent. For personalised order help or a richer skin-advisor chat, I will ask before using AI support.'
  }

  if (text.includes('bakuchiol')) {
    return 'Bakuchiol is a plant-based retinol alternative used for visible renewal without the usual retinoid harshness. On VerdeBliss, it anchors the Bakuchiol Renewal Serum.'
  }

  if (text.includes('niacinamide')) {
    return 'Niacinamide is a calming, barrier-friendly active often used for visible pores, excess oil, and uneven tone. Our Niacinamide Pore Serum is the serum-family option for oily or combination skin.'
  }

  if (text.includes('spf') || text.includes('sunscreen')) {
    return 'For daily sun protection, look at Botanical Mineral Sun Shield. It is positioned as a mineral sunscreen with zinc oxide and soothing aloe vera; independent SPF-rating documentation is tracked in the Trust Centre.'
  }

  if (text.includes('shipping') || text.includes('delivery')) {
    return 'Shipping is calculated at checkout. Orders above Rs 499 qualify for free shipping; smaller orders show the delivery charge before payment.'
  }

  if (text.includes('cod') || text.includes('cash on delivery')) {
    return 'Cash on Delivery is available where the order passes address, phone, PIN-code, and value checks. You will see COD eligibility during checkout.'
  }

  if (text.includes('refund') || text.includes('return')) {
    return 'You can submit a refund request directly on the [Refund Request page](/refund). Sign in first so your eligible orders appear automatically. Returns are accepted for unopened products within 14 days of delivery, and refunds are processed within 3–7 business days.'
  }

  if (text.includes('contact') || text.includes('support') || text.includes('email')) {
    return `You can reach VerdeBliss support through the Contact page or email ${BUSINESS_COMPLIANCE.emails.support}. For order history, the Account page is the safest non-AI route.`
  }

  if (
    text.includes('routine') ||
    text.includes('dry skin') ||
    text.includes('oily skin') ||
    text.includes('sensitive skin') ||
    text.includes('combination skin')
  ) {
    return 'A simple routine is cleanser, targeted serum, moisturiser, and SPF in the morning. Use the Skin Quiz for a non-AI product path, or allow AI support here for a more tailored chat.'
  }

  return null
}

export default function ChatBot() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)

  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<ChatTurn[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiConsent, setAiConsent] = useState(false)
  const [aiConsentDeclined, setAiConsentDeclined] = useState(false)
  const [awaitingAiConsent, setAwaitingAiConsent] = useState(false)
  const [pendingAiMessages, setPendingAiMessages] = useState<ChatTurn[] | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)

  /* ── Welcome message depends on auth state ─────────────────────── */
  const welcomeMsg = useCallback(() => {
    if (user && profile?.full_name) {
      return `Hello, ${profile.full_name.split(' ')[0]}! 🌿 I'm Verde. I can help with your orders, loyalty points, returns, or finding the perfect skincare. What do you need?`
    }
    return "Hello! I'm Verde, your botanical beauty advisor 🌿 How can I help you find your perfect skincare match today?"
  }, [user, profile])

  /* Reset messages when auth state changes */
  useEffect(() => {
    setMsgs([{ role: 'assistant' as const, content: welcomeMsg() }])
    setAwaitingAiConsent(false)
    setPendingAiMessages(null)
  }, [user?.id, welcomeMsg])

  useEffect(() => {
    setAiConsent(loadStoredConsent()?.functional_third_party === true)

    const handleConsentUpdate = (event: Event) => {
      const consent = (event as CustomEvent<StoredConsent>).detail
      setAiConsent(consent?.functional_third_party === true)
      if (consent?.functional_third_party === true) {
        setAiConsentDeclined(false)
        setAwaitingAiConsent(false)
      }
    }

    window.addEventListener(CONSENT_UPDATED_EVENT, handleConsentUpdate)
    return () => window.removeEventListener(CONSENT_UPDATED_EVENT, handleConsentUpdate)
  }, [])

  /* Scroll to bottom on new messages */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, loading])

  const requestAiReply = useCallback(
    async (conversation: ChatTurn[], visibleBase: ChatTurn[] = conversation) => {
      setLoading(true)

      try {
        const { supabase } = await import('@/lib/supabase')
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData.session?.access_token

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-vb-client': 'web',
            'x-vb-ai-consent': 'granted',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ messages: conversation }),
        })

        const data = await res.json()

        if (!res.ok) {
          console.error('[ChatBot] API error', res.status, data)
          setMsgs([
            ...visibleBase,
            {
              role: 'assistant' as const,
              content: `${data?.error ?? `Server error ${res.status}`}`,
            },
          ])
        } else {
          const reply = data.content?.[0]?.text ?? 'Let me help you find the perfect match.'
          setMsgs([...visibleBase, { role: 'assistant' as const, content: reply }])
        }
      } catch (err) {
        console.error('[ChatBot] Network error', err)
        setMsgs([
          ...visibleBase,
          {
            role: 'assistant' as const,
            content: "Couldn't reach the server. Please check your connection and try again.",
          },
        ])
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const grantAiConsent = async () => {
    const stored = loadStoredConsent()
    persistConsent({
      analytics: stored?.analytics ?? false,
      marketing: stored?.marketing ?? false,
      functional_third_party: true,
    })
    setAiConsent(true)
    setAiConsentDeclined(false)
    setAwaitingAiConsent(false)

    const conversation = pendingAiMessages
    setPendingAiMessages(null)

    if (conversation) {
      await requestAiReply(conversation, [
        ...msgs,
        { role: 'assistant' as const, content: 'Thanks. I can use AI support for this reply now.' },
      ])
    }
  }

  const declineAiConsent = () => {
    const stored = loadStoredConsent()
    persistConsent({
      analytics: stored?.analytics ?? false,
      marketing: stored?.marketing ?? false,
      functional_third_party: false,
    })
    setAiConsent(false)
    setAiConsentDeclined(true)
    setAwaitingAiConsent(false)
    setPendingAiMessages(null)
    setMsgs((current) => [...current, { role: 'assistant' as const, content: AI_CONSENT_DECLINED }])
  }

  /* ── Send message ───────────────────────────────────────────────── */
  const send = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')
    const next: ChatTurn[] = [...msgs, { role: 'user' as const, content: msg }]
    setMsgs(next)

    if (!aiConsent) {
      const localReply = consentSafeReply(msg)

      if (localReply) {
        setMsgs([...next, { role: 'assistant' as const, content: localReply }])
        return
      }

      if (aiConsentDeclined) {
        setMsgs([...next, { role: 'assistant' as const, content: AI_CONSENT_DECLINED }])
        return
      }

      setPendingAiMessages(next)
      setAwaitingAiConsent(true)
      setMsgs([...next, { role: 'assistant' as const, content: AI_CONSENT_REQUEST }])
      return
    }

    await requestAiReply(next)
  }

  const quickReplies = user ? MEMBER_REPLIES : GUEST_REPLIES

  return (
    <>
      {/* FAB — fixed bottom-right; responsive offsets via Tailwind. */}
      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close chat' : 'Chat with Verde'}
        className="chat-fab fixed bottom-5 right-4 z-[150] flex cursor-pointer items-center justify-center rounded-full border-none sm:bottom-6 sm:right-6"
        style={{ background: C.forest }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span
              key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X size={20} color="white" />
            </motion.span>
          ) : (
            <motion.span
              key="m"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <MessageCircle size={20} color="white" />
            </motion.span>
          )}
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
            className="fixed bottom-20 right-4 z-[150] flex h-[460px] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[20px] border border-border bg-card shadow-[0_8px_48px_rgba(0,0,0,0.14)] sm:bottom-[94px] sm:right-7 sm:h-[520px] sm:w-[min(360px,calc(100vw-56px))]"
          >
            {/* Header */}
            <div
              style={{
                background: `linear-gradient(135deg, ${C.forest}, #3D6344)`,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexShrink: 0,
              }}
            >
              <div
                aria-hidden="true"
                className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/30 bg-cream shadow-sm"
              >
                <Image
                  src="/images/logo.webp"
                  alt=""
                  fill
                  sizes="36px"
                  className="scale-125 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>Verde</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)' }}>
                  {user
                    ? `${profile?.tier ?? 'Member'} · Beauty & Order Support`
                    : 'Botanical Beauty Advisor'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80' }} />
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>Online</span>
              </div>
            </div>

            {/* Sign-in nudge for guests asking account queries */}
            {!user && (
              <div
                style={{
                  background: C.goldPale,
                  padding: '8px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  borderBottom: `1px solid ${C.border}`,
                  flexShrink: 0,
                }}
              >
                <LogIn size={13} color={C.olive} />
                <span style={{ fontSize: 11, color: C.olive, flex: 1 }}>
                  Sign in to track orders & get personalised help
                </span>
                <button
                  onClick={() => {
                    setOpen(false)
                    router.push('/account')
                  }}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: C.forest,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textDecoration: 'underline',
                  }}
                >
                  Sign in
                </button>
              </div>
            )}

            {/* Messages */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {msgs.map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 8,
                    flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
                  }}
                >
                  {m.role === 'assistant' && (
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: C.sagePale,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        flexShrink: 0,
                        border: `1px solid ${C.border}`,
                      }}
                    >
                      🌿
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 13,
                      lineHeight: 1.6,
                      padding: '9px 12px',
                      borderRadius: m.role === 'user' ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                      background: m.role === 'user' ? C.forest : C.ivory,
                      color: m.role === 'user' ? 'white' : C.text,
                      border: m.role === 'user' ? 'none' : `1px solid ${C.border}`,
                      maxWidth: '80%',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {renderMessage(m.content, m.role === 'user')}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: C.sagePale,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      flexShrink: 0,
                    }}
                  >
                    🌿
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 4,
                      padding: '10px 12px',
                      background: C.ivory,
                      border: `1px solid ${C.border}`,
                      borderRadius: '14px 14px 14px 3px',
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        style={{ width: 6, height: 6, borderRadius: '50%', background: C.sage }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {awaitingAiConsent && (
                <div
                  role="group"
                  aria-label="AI support consent"
                  style={{
                    marginLeft: 32,
                    border: `1px solid ${C.border}`,
                    borderRadius: 14,
                    background: C.goldPale,
                    padding: '10px 12px',
                    display: 'grid',
                    gap: 9,
                  }}
                >
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <ShieldCheck size={15} color={C.forest} aria-hidden="true" />
                    <strong style={{ fontSize: 12, color: C.forest }}>
                      Allow AI support for this chat?
                    </strong>
                  </div>
                  <p style={{ margin: 0, fontSize: 11, lineHeight: 1.55, color: C.olive }}>
                    This enables Google Gemini for richer support. Without it, Verde can still
                    answer general policy and ingredient questions locally.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <button
                      type="button"
                      onClick={grantAiConsent}
                      style={{
                        minHeight: 34,
                        borderRadius: 999,
                        border: 'none',
                        background: C.forest,
                        color: 'white',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: 12,
                        fontWeight: 700,
                        padding: '7px 13px',
                      }}
                    >
                      Allow AI support
                    </button>
                    <button
                      type="button"
                      onClick={declineAiConsent}
                      style={{
                        minHeight: 34,
                        borderRadius: 999,
                        border: `1px solid ${C.border}`,
                        background: C.warmWhite,
                        color: C.forest,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: 12,
                        fontWeight: 700,
                        padding: '7px 13px',
                      }}
                    >
                      Not now
                    </button>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Quick replies — show after welcome only */}
            {msgs.length <= 1 && !awaitingAiConsent && (
              <div
                style={{
                  padding: '0 14px 10px',
                  display: 'flex',
                  gap: 6,
                  flexWrap: 'wrap',
                  flexShrink: 0,
                }}
              >
                {quickReplies.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    style={{
                      fontSize: 11,
                      color: C.forest,
                      border: `1px solid ${C.sage}`,
                      borderRadius: 20,
                      padding: '4px 10px',
                      background: 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div
              style={{
                padding: '10px 14px',
                borderTop: `1px solid ${C.border}`,
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <input
                id="chat-message"
                name="message"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder={
                  user
                    ? 'Ask about orders, refunds, skin care…'
                    : 'Ask about ingredients, routines…'
                }
                style={{
                  flex: 1,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  padding: '8px 12px',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  outline: 'none',
                  background: C.warmWhite,
                  color: C.text,
                }}
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => send()}
                aria-label="Send"
                style={{
                  background: C.terra,
                  border: 'none',
                  borderRadius: 10,
                  width: 36,
                  height: 36,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Send size={15} color="white" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
