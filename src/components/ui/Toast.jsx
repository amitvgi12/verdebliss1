import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { create } from 'zustand'
import { Check, X, Info, Award } from 'lucide-react'
import { C } from '@/constants/theme'

// ── Toast store ───────────────────────────────────────
let _id = 0
export const useToastStore = create((set) => ({
  toasts: [],
  push: (msg, type = 'success') => {
    const id = ++_id
    set((s) => ({ toasts: [...s.toasts, { id, msg, type }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3200)
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

const ICONS = { success: Check, error: X, info: Info, points: Award }
const BG    = { success: C.forest, error: '#A32D2D', info: '#185FA5', points: C.gold }

// ── Toast renderer (mount once in App) ───────────────
export function Toaster() {
  const { toasts, remove } = useToastStore()
  return (
    <div style={{ position: 'fixed', bottom: 96, right: 28, zIndex: 300, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICONS[t.type] ?? Check
          return (
            <motion.div key={t.id}
              initial={{ opacity: 0, x: 60, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              style={{ background: BG[t.type] ?? C.forest, color: 'white', borderRadius: 12, padding: '11px 16px', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 9, minWidth: 220, maxWidth: 300, boxShadow: '0 4px 20px rgba(0,0,0,0.18)', cursor: 'pointer' }}
              onClick={() => remove(t.id)}
            >
              <Icon size={14} style={{ flexShrink: 0 }} />
              {t.msg}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
