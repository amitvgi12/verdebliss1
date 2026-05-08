'use client'
import { create } from 'zustand'
import type { ToastMessage, ToastState } from '@/types'

export const useToastStore = create<ToastState>((set) => {
  const add = (msg: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now()
    set((s) => ({ toasts: [...s.toasts, { id, msg, type }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3200)
  }
  return {
    toasts: [],
    show: add,
    push: add,
    remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  }
})
