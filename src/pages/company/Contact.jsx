/**
 * Contact.jsx — Contact & support page
 * Route: /contact
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { C, FONT } from '@/constants/theme'

const TOPICS = ['Product question', 'Order issue', 'Returns & refunds', 'Press enquiry', 'Partnership', 'Other']

const CHANNELS = [
  { icon: '📩', title: 'Email us',    value: 'hello@verdebliss.in',  sub: 'Response within 24 hours' },
  { icon: '📞', title: 'Call us',     value: '+91 20 6789 0123',      sub: 'Mon–Sat, 9 AM–6 PM IST' },
  { icon: '💬', title: 'Live Chat',   value: 'Via the chat bubble',   sub: 'Available 9 AM–9 PM IST' },
  { icon: '📍', title: 'Our lab',     value: 'Kharadi, Pune 411014',  sub: 'Visits by appointment only' },
]

export default function Contact() {
  const [form, setForm]       = useState({ name: '', email: '', topic: '', message: '' })
  const [submitted, setSubmit] = useState(false)
  const [loading, setLoading]  = useState(false)

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.message) return
    setLoading(true)
    /* Simulate form submission — wire to Supabase or Resend in production */
    setTimeout(() => { setLoading(false); setSubmit(true) }, 1200)
  }

  return (
    <div style={{ background: C.bg }}>

      {/* Hero */}
      <section style={{ background: `linear-gradient(150deg, ${C.forest} 0%, #1A2E1E 100%)`, padding: '100px 24px 80px', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ fontSize: 10, color: C.sage, letterSpacing: '0.16em', marginBottom: 16, fontWeight: 600 }}>WE&apos;D LOVE TO HEAR FROM YOU</div>
          <h1 style={{ fontFamily: FONT.serif, fontSize: 'clamp(40px,6vw,80px)', color: 'white', fontWeight: 400, margin: '0 0 24px' }}>Get in Touch</h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', maxWidth: 500, margin: '0 auto', lineHeight: 1.8 }}>
            Our botanists, formulators, and customer experience team are here to help.
          </p>
        </motion.div>
      </section>

      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '72px 24px 80px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 56, alignItems: 'start' }}>

        {/* Contact channels */}
        <div>
          <div style={{ fontSize: 10, color: C.terra, letterSpacing: '0.14em', marginBottom: 24, fontWeight: 600 }}>CONTACT CHANNELS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {CHANNELS.map((ch) => (
              <div key={ch.title} style={{ background: 'white', borderRadius: 14, padding: '18px 20px', border: `1px solid ${C.border}`, display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ fontSize: 28, flexShrink: 0 }}>{ch.icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>{ch.title}</div>
                  <div style={{ fontSize: 14, color: C.forest, fontWeight: 500, marginBottom: 2 }}>{ch.value}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{ch.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div>
          <div style={{ fontSize: 10, color: C.terra, letterSpacing: '0.14em', marginBottom: 24, fontWeight: 600 }}>SEND A MESSAGE</div>
          {submitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              style={{ background: '#EBF0E9', borderRadius: 16, padding: '48px', textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: C.forest, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Check size={28} color="white" />
              </div>
              <div style={{ fontFamily: FONT.serif, fontSize: 28, color: C.text, marginBottom: 10 }}>Message sent!</div>
              <div style={{ fontSize: 15, color: C.muted }}>We&apos;ll get back to you within 24 hours.</div>
            </motion.div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name *"
                style={{ padding: '12px 16px', border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: 'white', color: C.text }} />
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email address *"
                style={{ padding: '12px 16px', border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: 'white', color: C.text }} />
              <select value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}
                style={{ padding: '12px 16px', border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: 'white', color: C.text }}>
                <option value="">Select topic</option>
                {TOPICS.map((t) => <option key={t}>{t}</option>)}
              </select>
              <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Your message *" rows={5}
                style={{ padding: '12px 16px', border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: 'white', color: C.text, resize: 'vertical' }} />
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={loading}
                style={{ background: loading ? C.sage : C.forest, color: 'white', border: 'none', borderRadius: 10, padding: '13px', fontSize: 15, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                {loading ? 'Sending…' : 'Send Message'}
              </motion.button>
              <div style={{ fontSize: 11, color: C.muted, textAlign: 'center' }}>We never share your data with third parties.</div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
