/**
 * ChatBot.jsx
 * SECURITY FIX: No longer calls Anthropic directly from the browser.
 * All requests go through /api/chat (Vercel serverless function) which
 * holds the API key server-side — key never appears in the client bundle.
 */
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send } from 'lucide-react'
import { C } from '@/constants/theme'

const QUICK_REPLIES = [
  'Best serum for dry skin?',
  'What is Bakuchiol?',
  'Routine for oily skin?',
  'Do you have SPF options?',
]

export default function ChatBot() {
  const [open,    setOpen]    = useState(false)
  const [msgs,    setMsgs]    = useState([
    { role:'assistant', content:'Hello! I\'m Verde, your botanical beauty advisor 🌿 How can I help you find your perfect skincare match today?' },
  ])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }) }, [msgs, loading])

  const send = async (text) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')
    const next = [...msgs, { role:'user', content: msg }]
    setMsgs(next)
    setLoading(true)
    try {
      /* Secure proxy — key never leaves the server */
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setMsgs([...next, { role:'assistant', content: data.content?.[0]?.text ?? 'Let me help you find the perfect match! 🌿' }])
    } catch {
      setMsgs([...next, { role:'assistant', content:'I\'m having a moment — please try again! 🌿' }])
    }
    setLoading(false)
  }

  return (
    <>
      <motion.button whileHover={{ scale:1.06 }} whileTap={{ scale:0.94 }} onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close chat' : 'Chat with Verde'}
        style={{ position:'fixed', bottom:28, right:28, width:54, height:54, borderRadius:'50%', background:C.forest, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 20px rgba(45,74,50,0.4)', zIndex:150 }}>
        <AnimatePresence mode="wait">
          {open
            ? <motion.span key="x" initial={{ rotate:-90, opacity:0 }} animate={{ rotate:0, opacity:1 }} exit={{ rotate:90, opacity:0 }}><X size={20} color="white"/></motion.span>
            : <motion.span key="m" initial={{ rotate:90, opacity:0 }} animate={{ rotate:0, opacity:1 }} exit={{ rotate:-90, opacity:0 }}><MessageCircle size={20} color="white"/></motion.span>
          }
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity:0, y:16, scale:0.94 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:16, scale:0.94 }}
            transition={{ type:'spring', damping:26 }} role="dialog" aria-label="Verde — botanical beauty advisor"
            style={{ position:'fixed', bottom:94, right:28, width:'min(340px, calc(100vw - 40px))', height:500, background:C.card, borderRadius:20, border:`1px solid ${C.border}`, boxShadow:'0 8px 48px rgba(0,0,0,0.14)', zIndex:150, display:'flex', flexDirection:'column', overflow:'hidden' }}>

            {/* Header */}
            <div style={{ background:`linear-gradient(135deg, ${C.forest}, #3D6344)`, padding:'16px 20px', display:'flex', alignItems:'center', gap:12 }}>
              <img src="/images/logo.png" alt="" aria-hidden="true" style={{ height:36, width:36, objectFit:'contain', borderRadius:'50%', background:'rgba(255,255,255,0.1)', padding:4 }} onError={(e) => { e.currentTarget.style.display='none' }}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color:'white' }}>Verde</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.58)' }}>Botanical Beauty Advisor</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'#4ADE80' }}/>
                <span style={{ fontSize:10, color:'rgba(255,255,255,0.55)' }}>Online</span>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex:1, overflowY:'auto', padding:'14px 16px', display:'flex', flexDirection:'column', gap:10, background:'#F8F5F0' }}>
              {msgs.map((m, i) => (
                <motion.div key={i} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} style={{ display:'flex', justifyContent: m.role==='user' ? 'flex-end' : 'flex-start', alignItems:'flex-end', gap:6 }}>
                  {m.role==='assistant' && <div style={{ width:26, height:26, borderRadius:'50%', background:'#EAF0E8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0 }}>🌿</div>}
                  <div style={{ maxWidth:'78%', padding:'10px 13px', borderRadius: m.role==='user' ? '14px 14px 3px 14px' : '14px 14px 14px 3px', background: m.role==='user' ? C.forest : 'white', color: m.role==='user' ? 'white' : C.text, fontSize:13, lineHeight:1.55, border: m.role==='assistant' ? `1px solid ${C.border}` : 'none' }}>
                    {m.content}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div style={{ display:'flex', gap:4, padding:'10px 13px', background:'white', border:`1px solid ${C.border}`, borderRadius:'14px 14px 14px 3px', width:'fit-content' }}>
                  {[0,1,2].map((i) => (
                    <motion.div key={i} animate={{ y:[0,-5,0] }} transition={{ duration:0.6, repeat:Infinity, delay: i*0.15 }} style={{ width:6, height:6, borderRadius:'50%', background:C.sage }}/>
                  ))}
                </div>
              )}
              <div ref={endRef}/>
            </div>

            {/* Quick replies */}
            {msgs.length < 3 && (
              <div style={{ padding:'8px 12px', display:'flex', gap:6, overflowX:'auto', borderTop:`1px solid ${C.border}`, background:'white' }}>
                {QUICK_REPLIES.map((r) => (
                  <button key={r} onClick={() => send(r)} style={{ flexShrink:0, background:'#EAF0E8', border:'none', borderRadius:99, padding:'5px 12px', fontSize:11, color:C.forest, cursor:'pointer', fontFamily:'inherit', fontWeight:500, whiteSpace:'nowrap' }}>{r}</button>
                ))}
              </div>
            )}

            {/* Input */}
            <div style={{ padding:'10px 14px', borderTop:`1px solid ${C.border}`, display:'flex', gap:8, background:'white' }}>
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key==='Enter' && send()} placeholder="Ask about your skin…"
                aria-label="Chat message"
                style={{ flex:1, border:`1px solid ${C.border}`, borderRadius:10, padding:'8px 12px', fontSize:13, outline:'none', fontFamily:'inherit', background:'#F8F5F0', color:C.text }}/>
              <motion.button whileTap={{ scale:0.9 }} onClick={() => send()} aria-label="Send message" style={{ background:C.terra, border:'none', borderRadius:10, width:36, height:36, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Send size={14} color="white"/>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
