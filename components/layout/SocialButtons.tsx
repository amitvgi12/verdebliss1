'use client'

import { useToastStore } from '@/store/toastStore'

const SOCIALS = ['Instagram', 'Pinterest', 'YouTube'] as const

export default function SocialButtons() {
  const toast = useToastStore((s) => s.push)
  return (
    <div className="flex flex-wrap gap-2">
      {SOCIALS.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => toast(`${s} — coming soon!`, 'info')}
          className="cursor-pointer rounded-full border border-white/10 bg-transparent px-2.5 py-1 text-[11px] text-white/50 transition hover:text-white/80"
        >
          {s}
        </button>
      ))}
    </div>
  )
}
