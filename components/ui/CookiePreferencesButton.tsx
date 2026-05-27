'use client'

import { openCookiePreferences } from '@/lib/consent'

const DEFAULT_CLASS_NAME =
  'inline-flex min-h-6 cursor-pointer items-center border-none bg-transparent p-0 text-[11px] text-white underline decoration-white/45 underline-offset-4 transition hover:text-gold hover:decoration-gold'

export default function CookiePreferencesButton({
  className = DEFAULT_CLASS_NAME,
}: {
  className?: string
}) {
  return (
    <button type="button" onClick={openCookiePreferences} className={className}>
      Cookie preferences
    </button>
  )
}
