/**
 * LegalModal.jsx
 *
 * Reusable modal for Privacy Policy, Terms of Service, and Cookie Policy.
 * Triggered from footer links instead of showing a "coming soon" toast.
 *
 * Usage:
 *   <LegalModal type="privacy" onClose={() => setOpen(false)} />
 *
 * Architecture note: content lives client-side for now.
 * For production, fetch from a CMS (Strapi / Contentful) so legal
 * can be updated without a code deployment.
 */

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { C, FONT } from '@/constants/theme'

/* ── Legal content ──────────────────────────────────────────────────── */
const CONTENT = {
  privacy: {
    title: 'Privacy Policy',
    updated: 'Last updated: 1 April 2026',
    sections: [
      {
        heading: '1. Information We Collect',
        body: 'We collect information you provide directly to us, including name, email address, shipping address, and skin type when you create an account or make a purchase. We also collect payment information, though we never store raw card details — all payment data is handled by Razorpay and Stripe under their respective PCI-DSS compliance frameworks. We collect usage data including pages visited, products viewed, and interactions with our AI advisor (Verde), which is used solely to improve your experience.',
      },
      {
        heading: '2. How We Use Your Information',
        body: 'We use your information to: (a) process and fulfil orders; (b) send transactional emails regarding your purchases; (c) personalise product recommendations based on your skin type; (d) administer our loyalty points programme; (e) send marketing communications if you have opted in. We do not sell, rent, or share your personal data with third parties for their own marketing purposes.',
      },
      {
        heading: '3. Cookies',
        body: 'We use essential cookies to maintain your session and cart. We use analytical cookies (first-party only) to understand how customers use our website. We do not use third-party advertising or tracking cookies. You can manage your cookie preferences at any time via the Cookie Policy section below.',
      },
      {
        heading: '4. Data Retention',
        body: 'We retain your personal data for as long as your account is active. If you request account deletion, we will delete your personal data within 30 days, except where we are legally required to retain it (e.g. financial records for 7 years under Indian tax law).',
      },
      {
        heading: '5. Your Rights',
        body: 'Under applicable privacy laws, you have the right to: access the personal data we hold about you; correct inaccurate data; request deletion of your data; port your data to another service; withdraw consent for marketing at any time. To exercise these rights, contact privacy@verdebliss.in.',
      },
      {
        heading: '6. Data Security',
        body: 'We implement industry-standard security measures including TLS 1.3 encryption in transit, AES-256 encryption at rest in Supabase, and regular third-party security audits. We require our service providers to maintain equivalent security standards.',
      },
      {
        heading: '7. Contact',
        body: 'For privacy-related queries, contact our Data Protection Officer at privacy@verdebliss.in or write to VerdeBliss Cosmetics Private Limited, Kharadi, Pune 411014, Maharashtra, India.',
      },
    ],
  },

  terms: {
    title: 'Terms of Service',
    updated: 'Last updated: 1 April 2026',
    sections: [
      {
        heading: '1. Acceptance of Terms',
        body: 'By accessing or using the VerdeBliss website and purchasing our products, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.',
      },
      {
        heading: '2. Product Information',
        body: 'We strive to display product descriptions, ingredients, and images accurately. However, we cannot guarantee that colours displayed on your screen exactly match the physical product. Product formulations may be updated — the ingredient list on the physical packaging is authoritative.',
      },
      {
        heading: '3. Ordering & Payment',
        body: 'Orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order. Prices are in Indian Rupees (INR) and are inclusive of applicable GST. Payment is processed securely via Razorpay or Stripe — we do not store card details.',
      },
      {
        heading: '4. Shipping & Delivery',
        body: 'We ship across India within 3–5 business days and internationally within 7–14 business days. Risk of loss and title pass to you upon delivery to the carrier. We are not responsible for delays caused by customs authorities.',
      },
      {
        heading: '5. Returns & Refunds',
        body: 'If you are not satisfied, contact us within 14 days of delivery. Unopened products in original packaging can be returned for a full refund. Opened products are eligible for exchange if you experience an adverse reaction — we will request a short skin assessment from our dermatologist partner.',
      },
      {
        heading: '6. Loyalty Points Programme',
        body: 'Loyalty points have no monetary value and cannot be transferred, sold, or exchanged for cash. Points expire 24 months after the last account activity. VerdeBliss reserves the right to modify the loyalty programme with 30 days\' notice.',
      },
      {
        heading: '7. Intellectual Property',
        body: 'All content on verdebliss.in, including text, images, formulas, and branding, is owned by VerdeBliss Cosmetics Private Limited and protected under Indian and international IP law. Unauthorised reproduction is prohibited.',
      },
      {
        heading: '8. Limitation of Liability',
        body: 'Our liability is limited to the value of the products purchased. We are not liable for indirect, incidental, or consequential damages. Nothing in these terms limits liability for death, personal injury caused by negligence, or fraudulent misrepresentation.',
      },
      {
        heading: '9. Governing Law',
        body: 'These terms are governed by the laws of India. Disputes shall be resolved in the courts of Pune, Maharashtra. For consumer disputes, the Consumer Protection Act 2019 applies.',
      },
    ],
  },

  cookie: {
    title: 'Cookie Policy',
    updated: 'Last updated: 1 April 2026',
    sections: [
      {
        heading: 'What are cookies?',
        body: 'Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences, keep you logged in, and understand how you use the site.',
      },
      {
        heading: 'Cookies we use',
        body: 'Essential cookies: Required for the website to function. These maintain your cart, your login session, and security tokens. You cannot opt out of these.\n\nAnalytical cookies (first-party): We use privacy-friendly analytics (no third-party data sharing) to understand which pages are most visited and how customers navigate our product catalogue. This data is anonymised.\n\nPreference cookies: Remember your skin type selection and display preferences.',
      },
      {
        heading: 'Cookies we do NOT use',
        body: 'VerdeBliss does not use: third-party advertising cookies; social media tracking pixels; cross-site tracking cookies; or any cookies that share your data with advertisers.',
      },
      {
        heading: 'Managing cookies',
        body: 'You can manage or delete cookies through your browser settings. Note that disabling essential cookies will prevent you from logging in or maintaining your cart. For Chrome: Settings → Privacy and Security → Cookies. For Safari: Preferences → Privacy.',
      },
      {
        heading: 'Cookie retention',
        body: 'Session cookies expire when you close your browser. Preference cookies are retained for 12 months. Analytical cookies are retained for 90 days before being automatically deleted.',
      },
      {
        heading: 'Contact',
        body: 'For questions about our cookie practices, contact privacy@verdebliss.in.',
      },
    ],
  },
}

/* ── Modal component ─────────────────────────────────────────────────── */
export default function LegalModal({ type, onClose }) {
  const doc = CONTENT[type]

  /* Hooks must run unconditionally — guard the side-effects inside */
  useEffect(() => {
    if (!doc) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [doc])

  useEffect(() => {
    if (!doc) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [doc, onClose])

  if (!doc) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(28,34,30,0.6)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
        role="dialog"
        aria-modal="true"
        aria-label={doc.title}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          onClick={(e) => e.stopPropagation()}  /* Prevent overlay click from bubbling */
          style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 680, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
        >
          {/* Header */}
          <div style={{ padding: '24px 28px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div>
              <h2 style={{ fontFamily: FONT.serif, fontSize: 26, color: C.text, margin: 0, fontWeight: 400 }}>{doc.title}</h2>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{doc.updated}</div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <X size={15} color={C.muted} />
            </button>
          </div>

          {/* Scrollable content */}
          <div style={{ overflowY: 'auto', padding: '24px 28px', flex: 1 }}>
            {doc.sections.map((s) => (
              <div key={s.heading} style={{ marginBottom: 28 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 10, fontFamily: FONT.serif }}>{s.heading}</h3>
                {s.body.split('\n\n').map((para, i) => (
                  <p key={i} style={{ fontSize: 14, color: C.muted, lineHeight: 1.8, marginBottom: 10 }}>{para}</p>
                ))}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ padding: '16px 28px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
            <button
              onClick={onClose}
              style={{ background: C.forest, color: 'white', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              I understand
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
