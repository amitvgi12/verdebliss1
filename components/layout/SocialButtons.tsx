'use client'

import { Instagram, Pin, Youtube } from 'lucide-react'
import { useToastStore } from '@/store/toastStore'

const SOCIALS = [
  { label: 'Instagram', Icon: Instagram },
  { label: 'Pinterest', Icon: Pin },
  { label: 'YouTube', Icon: Youtube },
] as const

export default function SocialButtons() {
  const toast = useToastStore((s) => s.push)
  return (
    <div className="footer-socials">
      {SOCIALS.map(({ label, Icon }) => (
        <button
          key={label}
          type="button"
          onClick={() => toast(`${label} — coming soon!`, 'info')}
          className="footer-social-button"
        >
          <Icon size={13} aria-hidden />
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}
