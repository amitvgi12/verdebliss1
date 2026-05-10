'use client'

import { useState } from 'react'
import LegalModal, { type LegalModalType } from '@/components/ui/LegalModal'

const LEGAL_LINKS: LegalModalType[] = ['privacy', 'terms', 'cookie', 'refund']
const LEGAL_LABELS: Record<LegalModalType, string> = {
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
  cookie: 'Cookie Policy',
  refund: 'Returns & Refund Policy',
}

export default function LegalLinks() {
  const [modal, setModal] = useState<LegalModalType | null>(null)

  return (
    <>
      {modal && <LegalModal type={modal} onClose={() => setModal(null)} />}
      <div className="flex flex-wrap gap-5">
        {LEGAL_LINKS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setModal(key)}
            className="border-none bg-transparent text-[11px] text-white/55 transition hover:text-white/90"
          >
            {LEGAL_LABELS[key]}
          </button>
        ))}
      </div>
    </>
  )
}
