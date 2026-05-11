'use client'
/**
 * LegalModal — Privacy, Terms, Cookies, Returns & Refund.
 *
 * Focus-trapped, scroll-locked, ESC closes, click-outside closes. WCAG dialog.
 */

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export type LegalModalType = 'privacy' | 'terms' | 'cookie' | 'refund'

interface Section {
  heading: string
  body: string
}

interface Doc {
  title: string
  updated: string
  sections: Section[]
}

const CONTENT: Record<LegalModalType, Doc> = {
  privacy: {
    title: 'Privacy Policy',
    updated: 'Last updated: 1 April 2026',
    sections: [
      {
        heading: '1. Information We Collect',
        body: 'We collect information you provide directly to us, including name, email address, shipping address, and skin type when you create an account or make a purchase. We also collect payment information, though we never store raw card details — all payment data is handled by Razorpay under its PCI-DSS compliance framework. We collect usage data including pages visited, products viewed, and interactions with our AI advisor (Verde), used solely to improve your experience.',
      },
      {
        heading: '2. How We Use Your Information',
        body: 'We use your information to: (a) process and fulfil orders; (b) send transactional emails regarding your purchases; (c) personalise product recommendations based on your skin type; (d) administer our loyalty points programme; (e) send marketing communications if you have opted in. We do not sell, rent, or share your personal data with third parties for their own marketing purposes.',
      },
      {
        heading: '3. Cookies',
        body: 'We use essential cookies to maintain your session and cart. We use analytical cookies (first-party only) to understand how customers use our website. We do not use third-party advertising or tracking cookies.',
      },
      {
        heading: '4. Data Retention',
        body: 'We retain your personal data for as long as your account is active. If you request account deletion, we will delete your personal data within 30 days, except where we are legally required to retain it (e.g. financial records for 7 years under Indian tax law).',
      },
      {
        heading: '5. Your Rights',
        body: 'You have the right to access, correct, delete, or port your personal data. To exercise these rights, contact privacy@verdebliss.com.',
      },
      {
        heading: '6. Data Security',
        body: 'We implement TLS 1.3 encryption in transit, AES-256 encryption at rest in Supabase, and regular third-party security audits.',
      },
      {
        heading: '7. Contact',
        body: 'For privacy-related queries, contact privacy@verdebliss.com or write to VerdeBliss Cosmetics Private Limited, Kharadi, Pune 411014, Maharashtra, India.',
      },
    ],
  },
  terms: {
    title: 'Terms of Service',
    updated: 'Last updated: 1 April 2026',
    sections: [
      {
        heading: '1. Acceptance of Terms',
        body: 'By accessing or using the VerdeBliss website and purchasing our products, you agree to be bound by these Terms of Service.',
      },
      {
        heading: '2. Product Information',
        body: 'We strive to display product descriptions, ingredients, and images accurately. The ingredient list on the physical packaging is authoritative.',
      },
      {
        heading: '3. Ordering & Payment',
        body: 'Orders are subject to acceptance and availability. Prices are in Indian Rupees (INR) inclusive of applicable GST. Payment is processed securely via Razorpay.',
      },
      {
        heading: '4. Shipping & Delivery',
        body: 'We ship across India within 3–5 business days and internationally within 7–14 business days. Risk of loss passes to you upon delivery to the carrier.',
      },
      {
        heading: '5. Returns & Refunds',
        body: 'Please see our full Returns & Refund Policy for details. In summary: unopened products can be returned within 14 days; opened products are eligible for exchange if you experience an adverse reaction.',
      },
      {
        heading: '6. Loyalty Points',
        body: 'Loyalty points have no monetary value and cannot be transferred or exchanged for cash. Points expire 24 months after the last account activity.',
      },
      {
        heading: '7. Intellectual Property',
        body: 'All content on verdebliss.com is owned by VerdeBliss Cosmetics Private Limited and protected under Indian and international IP law.',
      },
      {
        heading: '8. Limitation of Liability',
        body: 'Our liability is limited to the value of the products purchased. Nothing limits liability for death or personal injury caused by our negligence.',
      },
      {
        heading: '9. Governing Law',
        body: 'These terms are governed by Indian law. Disputes shall be resolved in the courts of Pune, Maharashtra.',
      },
    ],
  },
  cookie: {
    title: 'Cookie Policy',
    updated: 'Last updated: 1 April 2026',
    sections: [
      {
        heading: 'What are cookies?',
        body: 'Cookies are small text files stored on your device that help websites remember your preferences, keep you logged in, and understand usage patterns.',
      },
      {
        heading: 'Cookies we use',
        body: 'Essential cookies: Required for cart and login sessions.\n\nAnalytical cookies (first-party): Anonymous data about which pages are visited — no third-party data sharing.\n\nPreference cookies: Remember your skin type and display preferences.',
      },
      {
        heading: 'Cookies we do NOT use',
        body: 'VerdeBliss does not use third-party advertising cookies, social media tracking pixels, or cross-site tracking cookies.',
      },
      {
        heading: 'Managing cookies',
        body: 'Manage cookies via your browser settings. Disabling essential cookies will prevent you from logging in or maintaining your cart.',
      },
      { heading: 'Contact', body: 'For questions about cookies, contact privacy@verdebliss.com.' },
    ],
  },
  refund: {
    title: 'Returns & Refund Policy',
    updated: 'Last updated: 1 April 2026',
    sections: [
      {
        heading: '1. Our Promise',
        body: 'We want you to love every VerdeBliss product. If you are not completely satisfied, we are here to make it right. Our policy applies to all orders placed on verdebliss.com.',
      },
      {
        heading: '2. Eligibility for Returns',
        body: 'You may return a product if:\n\n• The product is unused, unopened, and in its original packaging.\n• The return request is raised within 14 days of the delivery date.\n• The product was purchased directly from VerdeBliss (not a third-party retailer).\n\nThe following are non-returnable: opened or used products (except for adverse reactions — see Section 4); items marked as "Final Sale"; gift cards.',
      },
      {
        heading: '3. How to Initiate a Return',
        body: 'Step 1: Email returns@verdebliss.com within 14 days of delivery with your order number, the product(s) you wish to return, and the reason for return.\n\nStep 2: Our team will respond within 2 business days with a Return Merchandise Authorisation (RMA) number and a prepaid return shipping label.\n\nStep 3: Pack the product securely in its original packaging. Write your RMA number on the outside of the parcel.\n\nStep 4: Drop the parcel at the nearest courier partner location. Do not send returns without an RMA number — they will not be accepted.',
      },
      {
        heading: '4. Adverse Skin Reactions',
        body: 'All VerdeBliss products are dermatologist tested. However, if you experience an unexpected adverse reaction, we will offer a full exchange or store credit even if the product has been opened.\n\nTo claim: email reactions@verdebliss.com with your order number, the product name, a brief description of the reaction, and (optionally) a photo. We may refer you to our dermatologist partner for a complimentary skin assessment.',
      },
      {
        heading: '5. Damaged or Incorrect Items',
        body: 'If your order arrives damaged or you receive an incorrect item, contact us within 48 hours of delivery at support@verdebliss.com. Attach a photo of the damage or incorrect item. We will ship a replacement at no cost within 3–5 business days, or issue a full refund — your choice.',
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
        body: 'Returns: returns@verdebliss.com\nAdverse reactions: reactions@verdebliss.com\nDamaged / incorrect items: support@verdebliss.com\nGeneral: hello@verdebliss.com\n\nVerdeBliss Cosmetics Private Limited\nKharadi, Pune 411014, Maharashtra, India',
      },
    ],
  },
}

interface LegalModalProps {
  type: LegalModalType
  onClose: () => void
}

export default function LegalModal({ type, onClose }: LegalModalProps) {
  const doc = CONTENT[type]
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!doc) return
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => {
      const first = dialogRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      first?.focus()
    })
    return () => {
      document.body.style.overflow = ''
      previouslyFocusedRef.current?.focus?.()
    }
  }, [doc])

  useEffect(() => {
    if (!doc) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key !== 'Tab') return
      const focusable = dialogRef.current
        ? Array.from(
            dialogRef.current.querySelectorAll<HTMLElement>(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
          ).filter((el) => !el.hasAttribute('disabled'))
        : []
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [doc, onClose])

  if (!doc) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[400] flex items-center justify-center bg-text/60 p-4"
      >
        <motion.div
          ref={dialogRef}
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          onClick={(e) => e.stopPropagation()}
          className="flex max-h-[90vh] w-full max-w-[680px] flex-col rounded-[20px] bg-warmWhite shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-modal-title"
        >
          <header className="flex flex-shrink-0 items-center justify-between border-b border-border px-6 py-5">
            <div>
              <h2 id="legal-modal-title" className="m-0 font-serif text-2xl font-normal text-text">
                {doc.title}
              </h2>
              <p className="mt-1 text-xs text-muted">{doc.updated}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-[34px] w-[34px] flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-transparent"
            >
              <X size={15} className="text-muted" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {doc.sections.map((s) => (
              <section key={s.heading} className="mb-6">
                <h3 className="mb-2 font-serif text-sm font-semibold text-text">{s.heading}</h3>
                {s.body.split('\n\n').map((para, i) => (
                  <p
                    key={i}
                    className="mb-2 whitespace-pre-wrap text-[13px] leading-relaxed text-muted"
                  >
                    {para}
                  </p>
                ))}
              </section>
            ))}
          </div>

          <footer className="flex flex-shrink-0 justify-end border-t border-border px-6 py-3.5">
            <button type="button" onClick={onClose} className="btn-primary px-6 py-2.5">
              I understand
            </button>
          </footer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
