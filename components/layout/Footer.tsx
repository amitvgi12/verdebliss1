import Image from 'next/image'
import Link from 'next/link'
import LegalLinks from '@/components/layout/LegalLinks'
import SocialButtons from '@/components/layout/SocialButtons'
import CookiePreferencesButton from '@/components/ui/CookiePreferencesButton'
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

const SUPPORT_LINKS: Array<[string, string]> = [
  ['Skin Quiz', '/quiz'],
  ['FAQ', '/faq'],
  ['My Account', '/account'],
  ['Orders', '/account'],
  ['Request a Refund', '/refund'],
  ['Contact', '/contact'],
]

function LinkColumn({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div>
      <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-white/85">
        {title}
      </h3>
      <ul className="space-y-0.5">
        {links.map(([label, path]) => (
          <li key={label}>
            <Link
              href={path}
              className="block py-[3px] text-[13px] text-white underline decoration-white/45 underline-offset-4 transition hover:text-gold hover:decoration-gold"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Footer() {
  const cinLabel = hasVerifiedCin() ? BUSINESS_COMPLIANCE.cin : 'Pending verified CIN'
  const gstinLabel = hasVerifiedGstin() ? BUSINESS_COMPLIANCE.gstin : 'Pending verified GSTIN'
  const hasPhone = hasVerifiedPhone() && BUSINESS_COMPLIANCE.helpline.href

  return (
    <footer className="site-footer bg-forest px-4 text-white/75">
      <div className="site-container site-footer__grid">
        {/* Brand column */}
        <div className="site-footer__brand">
          <Link
            href="/"
            aria-label="VerdeBliss home"
            className="mb-3.5 inline-flex items-center rounded-[10px] bg-white px-2 py-1"
          >
            <Image
              src="/images/logo.webp"
              alt="VerdeBliss"
              width={102}
              height={34}
              className="block object-contain"
            />
          </Link>

          <p className="mb-3 max-w-[240px] text-[13px] leading-relaxed text-white/80">
            Where nature becomes luxury. Botanical skincare rituals for your most radiant skin.
          </p>
          <a
            href={`mailto:${BUSINESS_COMPLIANCE.supportEmail}`}
            className="mb-3 block text-[11px] font-semibold text-white underline decoration-white/45 underline-offset-4 transition hover:text-gold hover:decoration-gold"
          >
            <span aria-hidden="true">📩</span> {BUSINESS_COMPLIANCE.supportEmail}
          </a>
          <SocialButtons />
        </div>

        <div className="site-footer__links">
          <LinkColumn title="SHOP" links={SHOP_LINKS} />
          <LinkColumn title="COMPANY" links={COMPANY_LINKS} />
          <LinkColumn title="SUPPORT" links={SUPPORT_LINKS} />
        </div>
      </div>

      <div className="site-container site-footer__compliance">
        <p>
          <strong>{BUSINESS_COMPLIANCE.legalName}</strong> CIN: {cinLabel} | GSTIN: {gstinLabel}
        </p>
        <p>Registered office: {formatPostalAddress()}</p>
        <p>Principal place of business: {BUSINESS_COMPLIANCE.principalPlaceOfBusiness}</p>
        <p>
          Helpline:{' '}
          {hasPhone ? (
            <a href={`tel:${BUSINESS_COMPLIANCE.helpline.href}`}>
              {BUSINESS_COMPLIANCE.helpline.display}
            </a>
          ) : (
            <span>{BUSINESS_COMPLIANCE.helpline.display}</span>
          )}{' '}
          ({BUSINESS_COMPLIANCE.helpline.hours})
        </p>
        <p>
          Grievance Officer: <strong>{BUSINESS_COMPLIANCE.grievanceOfficer.name}</strong>,{' '}
          {BUSINESS_COMPLIANCE.grievanceOfficer.designation} -{' '}
          <a href={`mailto:${BUSINESS_COMPLIANCE.grievanceOfficer.email}`}>
            {BUSINESS_COMPLIANCE.grievanceOfficer.email}
          </a>
          . Grievances acknowledged within{' '}
          {BUSINESS_COMPLIANCE.grievanceOfficer.acknowledgementWindow} and resolved within{' '}
          {BUSINESS_COMPLIANCE.grievanceOfficer.resolutionWindow}.
        </p>
        <p>Return, refund, and cancellation timelines are published in the policy link below.</p>
      </div>

      <div className="site-container site-footer__meta mt-6 flex flex-wrap justify-between gap-2 border-t border-white/10 pt-4 text-[11px]">
        <span>© 2026 {BUSINESS_COMPLIANCE.legalName}.</span>
        <div className="flex flex-wrap items-center gap-5">
          <LegalLinks />
          <CookiePreferencesButton />
        </div>
      </div>
    </footer>
  )
}
