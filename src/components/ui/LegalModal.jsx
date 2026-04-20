/**
 * LegalModal.jsx — Privacy, Terms, Cookies + Returns & Refund Policy
 */

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { C, FONT } from '@/constants/theme'

const CONTENT = {
  privacy: {
    title: 'Privacy Policy',
    updated: 'Last updated: 1 April 2026',
    sections: [
      { heading: '1. Information We Collect', body: 'We collect information you provide directly to us, including name, email address, shipping address, and skin type when you create an account or make a purchase. We also collect payment information, though we never store raw card details — all payment data is handled by Razorpay under its PCI-DSS compliance framework. We collect usage data including pages visited, products viewed, and interactions with our AI advisor (Verde), used solely to improve your experience.' },
      { heading: '2. How We Use Your Information', body: 'We use your information to: (a) process and fulfil orders; (b) send transactional emails regarding your purchases; (c) personalise product recommendations based on your skin type; (d) administer our loyalty points programme; (e) send marketing communications if you have opted in. We do not sell, rent, or share your personal data with third parties for their own marketing purposes.' },
      { heading: '3. Cookies', body: 'We use essential cookies to maintain your session and cart. We use analytical cookies (first-party only) to understand how customers use our website. We do not use third-party advertising or tracking cookies.' },
      { heading: '4. Data Retention', body: 'We retain your personal data for as long as your account is active. If you request account deletion, we will delete your personal data within 30 days, except where we are legally required to retain it (e.g. financial records for 7 years under Indian tax law).' },
      { heading: '5. Your Rights', body: 'You have the right to access, correct, delete, or port your personal data. To exercise these rights, contact privacy@verdebliss.in.' },
      { heading: '6. Data Security', body: 'We implement TLS 1.3 encryption in transit, AES-256 encryption at rest in Supabase, and regular third-party security audits.' },
      { heading: '7. Contact', body: 'For privacy-related queries, contact privacy@verdebliss.in or write to VerdeBliss Cosmetics Private Limited, Kharadi, Pune 411014, Maharashtra, India.' },
    ],
  },

  terms: {
    title: 'Terms of Service',
    updated: 'Last updated: 1 April 2026',
    sections: [
      { heading: '1. Acceptance of Terms', body: 'By accessing or using the VerdeBliss website and purchasing our products, you agree to be bound by these Terms of Service.' },
      { heading: '2. Product Information', body: 'We strive to display product descriptions, ingredients, and images accurately. The ingredient list on the physical packaging is authoritative.' },
      { heading: '3. Ordering & Payment', body: 'Orders are subject to acceptance and availability. Prices are in Indian Rupees (INR) inclusive of applicable GST. Payment is processed securely via Razorpay.' },
      { heading: '4. Shipping & Delivery', body: 'We ship across India within 3–5 business days and internationally within 7–14 business days. Risk of loss passes to you upon delivery to the carrier.' },
      { heading: '5. Returns & Refunds', body: 'Please see our full Returns & Refund Policy for details. In summary: unopened products can be returned within 14 days; opened products are eligible for exchange if you experience an adverse reaction.' },
      { heading: '6. Loyalty Points', body: 'Loyalty points have no monetary value and cannot be transferred or exchanged for cash. Points expire 24 months after the last account activity.' },
      { heading: '7. Intellectual Property', body: 'All content on verdebliss.in is owned by VerdeBliss Cosmetics Private Limited and protected under Indian and international IP law.' },
      { heading: '8. Limitation of Liability', body: 'Our liability is limited to the value of the products purchased. Nothing limits liability for death or personal injury caused by our negligence.' },
      { heading: '9. Governing Law', body: 'These terms are governed by Indian law. Disputes shall be resolved in the courts of Pune, Maharashtra.' },
    ],
  },

  cookie: {
    title: 'Cookie Policy',
    updated: 'Last updated: 1 April 2026',
    sections: [
      { heading: 'What are cookies?', body: 'Cookies are small text files stored on your device that help websites remember your preferences, keep you logged in, and understand usage patterns.' },
      { heading: 'Cookies we use', body: 'Essential cookies: Required for cart and login sessions.\n\nAnalytical cookies (first-party): Anonymous data about which pages are visited — no third-party data sharing.\n\nPreference cookies: Remember your skin type and display preferences.' },
      { heading: 'Cookies we do NOT use', body: 'VerdeBliss does not use third-party advertising cookies, social media tracking pixels, or cross-site tracking cookies.' },
      { heading: 'Managing cookies', body: 'Manage cookies via your browser settings. Disabling essential cookies will prevent you from logging in or maintaining your cart.' },
      { heading: 'Contact', body: 'For questions about cookies, contact privacy@verdebliss.in.' },
    ],
  },

  refund: {
    title: 'Returns & Refund Policy',
    updated: 'Last updated: 1 April 2026',
    sections: [
      {
        heading: '1. Our Promise',
        body: 'We want you to love every VerdeBliss product. If you are not completely satisfied, we are here to make it right. Our policy applies to all orders placed on verdebliss.vercel.app and verdebliss.in.',
      },
      {
        heading: '2. Eligibility for Returns',
        body: 'You may return a product if:\n\n• The product is unused, unopened, and in its original packaging.\n• The return request is raised within 14 days of the delivery date.\n• The product was purchased directly from VerdeBliss (not a third-party retailer).\n\nThe following are non-returnable: opened or used products (except for adverse reactions — see Section 4); items marked as "Final Sale"; gift cards.',
      },
      {
        heading: '3. How to Initiate a Return',
        body: 'Step 1: Email returns@verdebliss.in within 14 days of delivery with your order number, the product(s) you wish to return, and the reason for return.\n\nStep 2: Our team will respond within 2 business days with a Return Merchandise Authorisation (RMA) number and a prepaid return shipping label.\n\nStep 3: Pack the product securely in its original packaging. Write your RMA number on the outside of the parcel.\n\nStep 4: Drop the parcel at the nearest courier partner location. Do not send returns without an RMA number — they will not be accepted.',
      },
      {
        heading: '4. Adverse Skin Reactions',
        body: 'All VerdeBliss products are dermatologist tested. However, if you experience an unexpected adverse reaction, we will offer a full exchange or store credit even if the product has been opened.\n\nTo claim: email reactions@verdebliss.in with your order number, the product name, a brief description of the reaction, and (optionally) a photo. We may refer you to our dermatologist partner for a complimentary skin assessment.',
      },
      {
        heading: '5. Damaged or Incorrect Items',
        body: 'If your order arrives damaged or you receive an incorrect item, contact us within 48 hours of delivery at support@verdebliss.in. Attach a photo of the damage or incorrect item. We will ship a replacement at no cost within 3–5 business days, or issue a full refund — your choice.',
      },
      {
        heading: '6. Refund Processing',
        body: 'Once we receive and inspect your returned item, we will notify you by email within 2 business days.\n\nApproved refunds are credited to your original payment method:\n• UPI / Net Banking: 3–5 business days\n• Credit / Debit card: 5–7 business days (depending on your bank)\n• VerdeBliss Store Credit: credited within 24 hours\n\nShipping charges are non-refundable unless the return is due to our error.',
      },
      {
        heading: '7. Exchange Policy',
        body: 'We offer exchanges for products of equal or lesser value. If you wish to exchange for a higher-value item, you will be charged the difference. Exchanges are subject to product availability. To request an exchange, follow the return process in Section 3 and specify the replacement product in your email.',
      },
      {
        heading: '8. Loyalty Points',
        body: 'Loyalty points earned on the original purchase will be deducted upon a successful return. If you used loyalty points towards a purchase, the points value will be refunded as store credit.',
      },
      {
        heading: '9. Contact Us',
        body: 'Returns: returns@verdebliss.in\nAdverse reactions: reactions@verdebliss.in\nDamaged / incorrect items: support@verdebliss.in\nGeneral: hello@verdebliss.in\n\nVerdeBliss Cosmetics Private Limited\nKharadi, Pune 411014, Maharashtra, India',
      },
    ],
  },
}

export default function LegalModal({ type, onClose }) {
  const doc = CONTENT[type]

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
        style={{ position: 'fixed', inset: 0, background: 'rgba(28,34,30,0.6)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        role="dialog" aria-modal="true" aria-label={doc.title}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          onClick={(e) => e.stopPropagation()}
          style={{ background: '#FFFEF9', borderRadius: 20, width: '100%', maxWidth: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
        >
          {/* Header */}
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div>
              <h2 style={{ fontFamily: FONT.serif, fontSize: 24, color: C.text, margin: 0, fontWeight: 400 }}>{doc.title}</h2>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{doc.updated}</div>
            </div>
            <button onClick={onClose} aria-label="Close"
              style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <X size={15} color={C.muted} />
            </button>
          </div>

          {/* Scrollable content */}
          <div style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>
            {doc.sections.map((s) => (
              <div key={s.heading} style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 8, fontFamily: FONT.serif }}>{s.heading}</h3>
                {s.body.split('\n\n').map((para, i) => (
                  <p key={i} style={{ fontSize: 13, color: C.muted, lineHeight: 1.8, marginBottom: 8, whiteSpace: 'pre-wrap' }}>{para}</p>
                ))}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ padding: '14px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
            <button onClick={onClose}
              style={{ background: C.forest, color: 'white', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              I understand
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
