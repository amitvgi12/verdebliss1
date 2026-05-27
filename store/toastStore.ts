'use client'
import { create } from 'zustand'
import type { ToastMessage, ToastState } from '@/types'

let nextToastId = 1

export const useToastStore = create<ToastState>((set) => {
  const add = (msg: string, type: ToastMessage['type'] = 'info') => {
    const id = nextToastId++
    set((s) => ({ toasts: [...s.toasts, { id, msg, type }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3200)
  }
  return {
    toasts: [],
    push: add,
    remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  }
})
