'use client'
/**
 * Contact.jsx — Contact & support page
 * Route: /contact
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import TurnstileWidget from '@/components/ui/TurnstileWidget'

const TOPICS = [
  'Product question',
  'Order issue',
  'Returns & refunds',
  'Press enquiry',
  'Partnership',
  'Other',
]

const CHANNELS = [
  { Icon: Mail, title: 'Email us', value: 'hello@verdebliss.com', sub: 'Response within 24 hours' },
  { Icon: Phone, title: 'Call us', value: '+91 20 6789 0123', sub: 'Mon–Sat, 9 AM–6 PM IST' },
  {
    Icon: MessageCircle,
    title: 'Live Chat',
    value: 'Via the chat bubble',
    sub: 'Available 9 AM–9 PM IST',
  },
  {
    Icon: MapPin,
    title: 'Our lab',
    value: 'Kharadi, Pune 411014',
    sub: 'Visits by appointment only',
  },
]

export default function ContactClient() {
  const [form, setForm] = useState({ name: '', email: '', topic: '', message: '' })
  const [submitted, setSubmit] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)

  const handleSubmit = async () => {
    setError('')
    if (!form.name || !form.email || !form.message) {
      setError('Please enter your name, email, and message.')
      return
    }
    if (turnstileRequired && !turnstileToken) {
      setError('Please complete the bot check before sending.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-vb-client': 'web' },
        body: JSON.stringify({ ...form, turnstileToken }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error ?? 'Could not send message')
      setSubmit(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-bg">
      {/* Hero */}
      <section className="editorial-hero">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="editorial-hero__inner"
        >
          <div className="editorial-hero__kicker">WE&apos;D LOVE TO HEAR FROM YOU</div>
          <h1 className="editorial-hero__title">Get in Touch</h1>
          <p className="editorial-hero__copy max-w-[480px]">
            Our botanists, formulators, and customer experience team are here to help.
          </p>
        </motion.div>
      </section>

      <section className="site-container editorial-section contact-layout">
        {/* Contact channels */}
        <div>
          <div className="label-eyebrow mb-5">CONTACT CHANNELS</div>
          <div className="contact-stack">
            {CHANNELS.map(({ Icon, ...ch }, index) => (
              <motion.article
                key={ch.title}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06, duration: 0.35 }}
                className="contact-channel soft-card soft-card-hover"
              >
                <div className="contact-channel__icon">
                  <Icon size={18} />
                </div>
                <div>
                  <div className="mb-0.5 text-xs font-bold text-text">{ch.title}</div>
                  <div className="mb-0.5 text-sm font-semibold text-forest">{ch.value}</div>
                  <div className="text-[11px] text-muted">{ch.sub}</div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>

        {/* Form */}
        <div>
          <div className="label-eyebrow mb-5">SEND A MESSAGE</div>
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="contact-success rounded-[18px] bg-sagePale"
            >
              <div className="contact-success__icon">
                <Check size={26} />
              </div>
              <div className="mb-2 font-serif text-[28px] text-text">Message sent!</div>
              <div className="text-sm text-muted">We&apos;ll get back to you within 24 hours.</div>
            </motion.div>
          ) : (
            <div className="contact-form-shell soft-card">
              <div className="contact-form">
                <label htmlFor="contact-name" className="text-xs font-semibold text-text">
                  Name *
                </label>
                <input
                  id="contact-name"
                  name="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name *"
                  className="input-base"
                />
                <label htmlFor="contact-email" className="text-xs font-semibold text-text">
                  Email *
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Email address *"
                  className="input-base"
                />
                <label htmlFor="contact-topic" className="text-xs font-semibold text-text">
                  Topic
                </label>
                <select
                  id="contact-topic"
                  name="topic"
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  className="input-base"
                >
                  <option value="">Select topic</option>
                  {TOPICS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <label htmlFor="contact-message" className="text-xs font-semibold text-text">
                  Message *
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Your message *"
                  rows={5}
                  className="input-base resize-y"
                />
                {error && (
                  <div role="alert" className="text-xs text-[#A32D2D]">
                    {error}
                  </div>
                )}
                <TurnstileWidget
                  onToken={setTurnstileToken}
                  onExpire={() => setTurnstileToken(null)}
                />
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn-primary mt-1 w-full disabled:bg-sage"
                >
                  {loading ? 'Sending…' : 'Send Message'}
                </motion.button>
                <div className="text-center text-[11px] text-muted">
                  We never share your data with third parties.
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
