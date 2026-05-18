export interface LegalSection {
  heading: string
  body: string
}

export interface LegalDocument {
  slug: string
  title: string
  description: string
  updated: string
  sections: readonly LegalSection[]
}

export const LEGAL_DOCUMENTS = {
  privacy: {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    description:
      'How VerdeBliss collects, uses, protects, and retains customer information for orders, accounts, loyalty, support, AI-assisted help, and optional marketing.',
    updated: '1 April 2026',
    sections: [
      {
        heading: 'Information we collect',
        body: 'We collect information required to operate the storefront: name, email, phone number, delivery address, account profile, skin-type preferences, cart and order details, support requests, AI chat messages, and consent choices. Payment card, UPI, wallet, and net-banking details are processed by Razorpay; VerdeBliss does not store raw card data.',
      },
      {
        heading: 'How we use information',
        body: 'We use customer data to fulfil orders, prevent checkout abuse, provide account and loyalty features, respond to support requests, provide AI-assisted help when customers use Verde, improve product recommendations, and send marketing only where consent has been provided.',
      },
      {
        heading: 'Sharing and processors',
        body: 'We share the minimum data needed with operational processors such as payment, hosting, analytics, logistics, support, and AI service providers. When a customer uses Verde, chat messages may be processed by our AI provider; for order-related questions, we may also provide limited recent-order context needed to answer the request, such as order status, payment status, total, date, and item names. We do not sell customer data or share it with third parties for their own advertising databases.',
      },
      {
        heading: 'Retention and rights',
        body: 'Account and order data is retained while necessary for customer service, fraud prevention, legal, accounting, and tax obligations. Customers may request access, correction, deletion, or portability by contacting privacy@verdebliss.com.',
      },
    ],
  },
  terms: {
    slug: 'terms',
    title: 'Terms of Service',
    description:
      'The commercial terms that govern use of the VerdeBliss website, product purchases, accounts, loyalty points, and support.',
    updated: '1 April 2026',
    sections: [
      {
        heading: 'Using this website',
        body: 'By using verdebliss.com, creating an account, or placing an order, you agree to these terms. You are responsible for ensuring that account, delivery, and contact information is accurate.',
      },
      {
        heading: 'Product information',
        body: 'We aim to keep product descriptions, imagery, prices, INCI lists, warnings, and availability accurate. The product packaging and batch label remain the authoritative source for ingredient and usage information.',
      },
      {
        heading: 'Orders and payment',
        body: 'Orders are subject to acceptance, stock availability, address validation, payment verification, and fraud checks. Prices are listed in Indian Rupees and may include applicable taxes unless otherwise stated.',
      },
      {
        heading: 'Cosmetic-use disclaimer',
        body: 'VerdeBliss products are cosmetics and are not intended to diagnose, treat, cure, or prevent medical conditions. Patch testing is recommended, especially for sensitive or reactive skin.',
      },
    ],
  },
  returns: {
    slug: 'returns-refunds',
    title: 'Returns & Refunds Policy',
    description:
      'Return eligibility, refund timing, damaged-item handling, adverse reaction support, and refund request process for VerdeBliss orders.',
    updated: '1 April 2026',
    sections: [
      {
        heading: 'Return window',
        body: 'Unopened, unused products purchased from verdebliss.com may be returned within 14 days of delivery. Final-sale items and used products are not returnable except where required for adverse reaction review or damaged/incorrect item resolution.',
      },
      {
        heading: 'How to request a return',
        body: 'Email returns@verdebliss.com or use the refund request page with your order ID, contact email, product details, and reason. Our team will review eligibility before issuing return instructions.',
      },
      {
        heading: 'Refund timing',
        body: 'Approved refunds are processed to the original payment method where possible. UPI and net-banking refunds typically take 3–5 business days; card refunds may take 5–7 business days depending on the issuing bank.',
      },
      {
        heading: 'Damaged, incorrect, or reaction cases',
        body: 'For damaged or incorrect items, contact support within 48 hours with photos. For adverse skin reactions, stop use immediately and email reactions@verdebliss.com with the order ID and product name.',
      },
    ],
  },
  shipping: {
    slug: 'shipping-policy',
    title: 'Shipping Policy',
    description:
      'Shipping charges, dispatch timelines, free shipping threshold, COD restrictions, and delivery support for VerdeBliss orders.',
    updated: '1 April 2026',
    sections: [
      {
        heading: 'Service area',
        body: 'We ship to serviceable PIN codes across India. Certain remote, restricted, or high-risk service areas may be unavailable for Cash on Delivery or may require prepaid payment.',
      },
      {
        heading: 'Dispatch and delivery',
        body: 'Orders are normally dispatched within 1 business day after confirmation. Standard delivery is usually 2–3 business days after dispatch, subject to courier availability, public holidays, weather, and local restrictions.',
      },
      {
        heading: 'Shipping charges',
        body: 'Standard shipping is ₹79. Orders above ₹499 receive free shipping. Shipping charges are calculated server-side during checkout and may be updated if cart contents change.',
      },
      {
        heading: 'Cash on Delivery',
        body: 'COD is available only below the configured order-value cap and only for eligible addresses. COD orders may be manually reviewed, cancelled, or converted to prepaid where fraud, repeated non-delivery, or address-quality risk is detected.',
      },
    ],
  },
  cookie: {
    slug: 'cookie-policy',
    title: 'Cookie Policy',
    description:
      'How VerdeBliss uses essential, analytics, and preference cookies while avoiding third-party advertising trackers.',
    updated: '1 April 2026',
    sections: [
      {
        heading: 'Essential cookies',
        body: 'Essential cookies keep the cart, checkout, login, security controls, and consent record working. These cookies are required for core site functionality.',
      },
      {
        heading: 'Optional cookies',
        body: 'Optional analytics and preference cookies help us understand website performance and remember choices. They are disabled unless the customer accepts or saves preferences.',
      },
      {
        heading: 'What we do not use',
        body: 'We do not use third-party advertising pixels, cross-site behavioural ad cookies, or data-sharing cookies for external advertising networks in the default storefront implementation.',
      },
      {
        heading: 'Managing cookies',
        body: 'You can manage cookie consent through the banner or browser settings. Blocking essential cookies may prevent login, cart, and checkout features from working correctly.',
      },
    ],
  },
} as const satisfies Record<string, LegalDocument>
