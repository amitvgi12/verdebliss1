import { create } from 'zustand'

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
