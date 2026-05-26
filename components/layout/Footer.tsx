import Link from 'next/link'
import CookiePreferencesButton from '@/components/ui/CookiePreferencesButton'
import SocialButtons from '@/components/layout/SocialButtons'
import {
  BUSINESS_COMPLIANCE,
  formatPostalAddress,
  hasVerifiedCin,
  hasVerifiedGstin,
  hasVerifiedPhone,
} from '@/constants/businessCompliance'

const SHOP_LINKS: Array<[string, string]> = [
  ['Serums', '/products?cat=Serum'],
  ['Moisturisers', '/products?cat=Moisturiser'],
  ['Toners', '/products?cat=Toner'],
  ['Cleansers', '/products?cat=Cleanser'],
  ['SPF', '/products?cat=SPF'],
  ['Lip Care', '/products?cat=Lip+Care'],
]

const COMPANY_LINKS: Array<[string, string]> = [
  ['Our Story', '/our-story'],
  ['Ingredients', '/ingredients'],
  ['Sustainability', '/sustainability'],
  ['Certifications', '/certifications'],
  ['Press', '/press'],
  ['Journal', '/blog'],
]

const HELP_LINKS: Array<[string, string]> = [
  ['Skin Quiz', '/quiz'],
  ['FAQ', '/faq'],
  ['My Account', '/account'],
  ['Orders', '/account'],
  ['Request a Refund', '/refund'],
  ['Contact Us', '/contact'],
]

const POLICY_LINKS: Array<[string, string]> = [
  ['Privacy Policy', '/privacy-policy'],
  ['Terms of Service', '/terms'],
  ['Returns & Refunds', '/returns-refunds'],
  ['Shipping Policy', '/shipping-policy'],
  ['Cookie Policy', '/cookie-policy'],
  ['Grievance Redressal', '/contact'],
]

const PAYMENT_METHODS = [
  'UPI',
  'Visa',
  'Mastercard',
  'Maestro',
  'RuPay',
  'Net Banking',
  'EMI',
  'COD',
]

const BOTTOM_LEGAL: Array<[string, string]> = [
  ['Privacy', '/privacy-policy'],
  ['Terms', '/terms'],
  ['Returns', '/returns-refunds'],
  ['Shipping', '/shipping-policy'],
  ['Cookies', '/cookie-policy'],
]

function ColHead({ children }: { children: React.ReactNode }) {
  return <h3 className="footer-col-head">{children}</h3>
}

function LinkColumn({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div>
      <ColHead>{title}</ColHead>
      <ul className="footer-link-list">
        {links.map(([label, path]) => (
          <li key={label}>
            <Link href={path} className="footer-link">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Footer() {
  const cinLabel = hasVerifiedCin() ? BUSINESS_COMPLIANCE.cin : null
  const gstinLabel = hasVerifiedGstin() ? BUSINESS_COMPLIANCE.gstin : null
  const hasPhone = hasVerifiedPhone() && BUSINESS_COMPLIANCE.helpline.href

  return (
    <footer className="site-footer">
      {/* ── Main: link columns + contact info ─────────────────── */}
      <div className="footer-main site-container">
        {/* Left: 4 link columns */}
        <div className="footer-links-section">
          <LinkColumn title="SHOP" links={SHOP_LINKS} />
          <LinkColumn title="COMPANY" links={COMPANY_LINKS} />
          <LinkColumn title="HELP" links={HELP_LINKS} />
          <LinkColumn title="POLICIES" links={POLICY_LINKS} />
        </div>

        {/* Vertical divider */}
        <div className="footer-vdivider" aria-hidden />

        {/* Right: contact + registered office */}
        <div className="footer-info-section">
          {/* Contact Us */}
          <div>
            <ColHead>Contact Us:</ColHead>
            <address className="footer-address">
              <a
                href={`mailto:${BUSINESS_COMPLIANCE.emails.support}`}
                className="footer-address-link"
              >
                {BUSINESS_COMPLIANCE.emails.support}
              </a>
              {hasPhone && (
                <a
                  href={`tel:${BUSINESS_COMPLIANCE.helpline.href}`}
                  className="footer-address-link"
                >
                  {BUSINESS_COMPLIANCE.helpline.display}
                  <span className="footer-address-sub">
                    {' '}
                    ({BUSINESS_COMPLIANCE.helpline.hours})
                  </span>
                </a>
              )}
              <span className="footer-address-block">
                <span className="footer-address-label">Grievance Officer</span>
                <strong className="footer-address-name">
                  {BUSINESS_COMPLIANCE.grievanceOfficer.name}
                </strong>
                <a
                  href={`mailto:${BUSINESS_COMPLIANCE.grievanceOfficer.email}`}
                  className="footer-address-link"
                >
                  {BUSINESS_COMPLIANCE.grievanceOfficer.email}
                </a>
              </span>
            </address>
            <div className="footer-socials-wrap">
              <SocialButtons />
            </div>
          </div>

          {/* Registered Office */}
          <div>
            <ColHead>Registered Office:</ColHead>
            <address className="footer-address">
              <strong className="footer-address-name">{BUSINESS_COMPLIANCE.legalName},</strong>
              <span>{formatPostalAddress()}</span>
              {cinLabel && <span className="footer-address-id">CIN: {cinLabel}</span>}
              {gstinLabel && <span className="footer-address-id">GSTIN: {gstinLabel}</span>}
              {BUSINESS_COMPLIANCE.fulfilmentCity && (
                <span className="footer-address-sub">
                  Orders fulfilled from our {BUSINESS_COMPLIANCE.fulfilmentCity} centre
                </span>
              )}
            </address>
          </div>
        </div>
      </div>

      {/* ── Bottom strip ────────────────────────────────────────── */}
      <div className="footer-bottom">
        <div className="footer-bottom__inner site-container">
          <span className="footer-bottom__copy">
            © {new Date().getFullYear()} {BUSINESS_COMPLIANCE.legalName}
          </span>

          <div className="footer-bottom__legal">
            {BOTTOM_LEGAL.map(([label, href]) => (
              <Link key={href} href={href} className="footer-bottom__legal-link">
                {label}
              </Link>
            ))}
            <CookiePreferencesButton />
          </div>

          <div className="footer-bottom__payments" aria-label="Accepted payment methods">
            {PAYMENT_METHODS.map((method) => (
              <span key={method} className="footer-payment-badge">
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
