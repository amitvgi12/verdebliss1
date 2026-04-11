import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

import Nav from '@/components/layout/Nav'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/features/cart/CartDrawer'
import ChatBot from '@/components/features/chat/ChatBot'
import { Toaster } from '@/components/ui/Toast'

import Home from '@/pages/Home'
import Products from '@/pages/Products'
import ProductDetail from '@/pages/ProductDetail'
import Account from '@/pages/Account'

import { useAuthStore } from '@/store/authStore'
import { useWishlistStore } from '@/store/wishlistStore'

export default function App() {
  const initAuth    = useAuthStore((s) => s.init)
  const user        = useAuthStore((s) => s.user)
  const syncWishlist = useWishlistStore((s) => s.syncFromServer)

  // Bootstrap auth on mount
  useEffect(() => { initAuth() }, [])

  // Sync wishlist when user logs in
  useEffect(() => {
    if (user?.id) syncWishlist(user.id)
  }, [user?.id])

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', background: '#FAF7F2', fontFamily: "'DM Sans', system-ui, sans-serif", color: '#1C221E' }}>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          ::-webkit-scrollbar { width: 4px; }
          ::-webkit-scrollbar-thumb { background: #D4C8BC; border-radius: 99px; }
          button, input, select, textarea { font-family: inherit; }
          a { text-decoration: none; color: inherit; }
        `}</style>

        <Nav />

        <main>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/"            element={<Home />} />
              <Route path="/products"    element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/account"     element={<Account />} />
            </Routes>
          </AnimatePresence>
        </main>

        <Footer />
        <CartDrawer />
        <ChatBot />
        <Toaster />
      </div>
    </BrowserRouter>
  )
}
