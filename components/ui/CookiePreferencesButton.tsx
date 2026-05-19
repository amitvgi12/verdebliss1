'use client'

import { openCookiePreferences } from '@/lib/consent'

export default function CookiePreferencesButton() {
  return (
    <button
      type="button"
      onClick={openCookiePreferences}
      className="cursor-pointer border-none bg-transparent p-0 text-[11px] text-white underline decoration-white/45 underline-offset-4 transition hover:text-gold hover:decoration-gold"
    >
      Cookie preferences
    </button>
  )
}
