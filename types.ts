import type { User } from '@supabase/supabase-js'

export type ProductCategory = 'Serum' | 'Moisturiser' | 'Toner' | 'Cleanser' | 'SPF' | 'Lip Care'
export type SkinType = 'Dry' | 'Oily' | 'Combination' | 'Sensitive' | 'All Types'

export interface Product {
  id: string
  name: string
  slug?: string
  category?: ProductCategory | string
  price: number
  mrp?: number | null
  price_valid_until?: string | null
  compliance_flags?: string[] | null
  rating?: number | null
  review_count?: number
  skin_types?: SkinType[] | string[]
  badges?: string[]
  description?: string
  ingredient?: string
  bg_color?: string
  emoji?: string
  image_url?: string | null
  stock?: number | null
  active?: boolean
  created_at?: string
}

export interface CartItem extends Product {
  qty: number
}

export interface CustomerProfile {
  id: string
  full_name?: string | null
  email?: string | null
  points?: number | null
  skin_type?: string | null
  tier?: string | null
  created_at?: string
}

export interface AuthState {
  user: User | null
  profile: CustomerProfile | null
  loading: boolean
  initializationError: string | null
  recoveryMode: boolean
  init: () => Promise<void>
  fetchProfile: (id: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<unknown>
  signUp: (
    email: string,
    password: string,
    fullName?: string,
    skinType?: string
  ) => Promise<unknown>
  resetPassword: (email: string) => Promise<unknown>
  updatePassword: (password: string) => Promise<unknown>
  clearRecoveryMode: () => void
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export interface CartState {
  items: CartItem[]
  isOpen: boolean
  addItem: (product: Product) => void
  removeItem: (id: string) => void
  updateQty: (id: string, delta: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
}

export interface ToastMessage {
  id: number
  msg: string
  type: 'info' | 'success' | 'error' | 'warning'
}

export interface ToastState {
  toasts: ToastMessage[]
  show: (msg: string, type?: ToastMessage['type']) => void
  push: (msg: string, type?: ToastMessage['type']) => void
  remove: (id: number) => void
}

export interface WishlistState {
  ids: string[]
  toggle: (productId: string, userId?: string | null) => Promise<void>
  load: (userId?: string | null) => Promise<void>
  has: (id: string) => boolean
}
