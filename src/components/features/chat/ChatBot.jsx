/**
 * ChatBot.jsx — Mobile-safe floating chat button
 *
 * Mobile fixes applied:
 *  1. Removed whileHover on the FAB button — hover states on mobile
 *     create a persistent highlight/outline that never dismisses.
 *  2. Chat panel: `right: 16` (not 28) on mobile so it doesn't clip.
 *  3. Chat panel width uses `calc(100vw - 32px)` on mobile
 *     to fit within the screen without horizontal overflow.
 *  4. FAB shadow is now smaller on mobile to reduce the glow bleed.
 */
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send } from 'lucide-react'
import { C } from '@/constants/theme'
import { useWindowWidth, BP } from '@/hooks/useWindowWidth'

const QUICK_REPLIES = [
  'Best serum for dry skin?',
  'What is Bakuchiol?',
  'Routine for oily skin?',
  'Do you have SPF options?',
]

export default function ChatBot() {
  const [open,    setOpen]    = useState(false)
  const [msgs,    setMsgs]    = useState([
    { role: 'assistant', content: "Hello! I'm Verde, your botanical beauty advisor 🌿 How can I help you find your perfect skincare match today?" },
  ])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)
  const width  = useWindowWidth()
  const isMobile = width < BP.tablet

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, loading])

  const send = async (text) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')
    const next = [...msgs, { role: 'user', content: msg }]
    setMsgs(next)
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setMsgs([...next, { role: 'assistant', content: data.content?.[0]?.text ?? 'Let me help you find the perfect match! 🌿' }])
    } catch {
      setMsgs([...next, { role: 'assistant', content: "I'm having a moment — please try again! 🌿" }])
    }
    setLoading(false)
  }

  /* Responsive values */
  const fabRight   = isMobile ? 16 : 28
  const fabBottom  = isMobile ? 20 : 28
  const panelRight = isMobile ? 16 : 28
  const panelWidth = isMobile ? `calc(100vw - 32px)` : 'min(340px, calc(100vw - 56px))'
  const panelHeight = isMobile ? 420 : 500
  const panelBottom = isMobile ? 80 : 94

  return (
    <>
      {/*
       * FAB button — no whileHover on mobile.
       * whileHover creates a persistent hover state on touch devices
       * that visually bleeds into the right edge as a green highlight.
       */}
      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close chat' : 'Chat with Verde'}
        style={{
          position: 'fixed',
          bottom: fabBottom,
          right: fabRight,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: C.forest,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          /* Smaller, focused shadow — no wide glow on mobile */
          boxShadow: isMobile
            ? '0 2px 12px rgba(45,74,50,0.35)'
            : '0 4px 20px rgba(45,74,50,0.4)',
          zIndex: 150,
        }}
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                <X size={20} color="white" />
              </motion.span>
            : <motion.span key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                <MessageCircle size={20} color="white" />
              </motion.span>
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
            aria-label="Verde — botanical beauty advisor"
            style={{
              position: 'fixed',
              bottom: panelBottom,
              right: panelRight,
              width: panelWidth,
              height: panelHeight,
              background: C.card,
              borderRadius: 20,
              border: `1px solid ${C.border}`,
              boxShadow: '0 8px 48px rgba(0,0,0,0.14)',
              zIndex: 150,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ background: `linear-gradient(135deg, ${C.forest}, #3D6344)`, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src="/images/logo.png" alt="" aria-hidden="true"
                style={{ height: 32, width: 32, objectFit: 'contain', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', padding: 3 }}
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>Verde</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.58)' }}>Botanical Beauty Advisor</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80' }} />
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>Online</span>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {msgs.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
                  {m.role === 'assistant' && (
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#EAF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>
                      🌿
                    </div>
                  )}
                  <div style={{
                    fontSize: 13, lineHeight: 1.55, padding: '8px 12px', borderRadius: m.role === 'user' ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                    background: m.role === 'user' ? C.forest : C.ivory,
                    color: m.role === 'user' ? 'white' : C.text,
                    border: m.role === 'user' ? 'none' : `1px solid ${C.border}`,
                    maxWidth: '78%',
                  }}>
                    {m.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#EAF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>🌿</div>
                  <div style={{ display: 'flex', gap: 4, padding: '10px 12px', background: C.ivory, border: `1px solid ${C.border}`, borderRadius: '14px 14px 14px 3px', width: 'fit-content' }}>
                    {[0, 1, 2].map((i) => (
                      <motion.div key={i} animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        style={{ width: 6, height: 6, borderRadius: '50%', background: C.sage }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Quick replies */}
            {msgs.length <= 1 && (
              <div style={{ padding: '0 14px 10px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {QUICK_REPLIES.map((q) => (
                  <button key={q} onClick={() => send(q)}
                    style={{ fontSize: 11, color: C.forest, border: `1px solid ${C.sage}`, borderRadius: 20, padding: '4px 10px', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div style={{ padding: '10px 14px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Ask about ingredients, routines…"
                style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#FAFAF8', color: C.text }}
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => send()}
                aria-label="Send message"
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
