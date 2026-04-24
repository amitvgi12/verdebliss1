/**
 * App.jsx — Root router and global layout
 *
 * Routes added:
 *   /our-story     — Brand story page
 *   /ingredients   — Full ingredient showcase
 *   /sustainability — Environmental commitment
 *   /press          — Media coverage & awards
 *   /contact        — Contact form & channels
 *
 * Legal (Privacy, Terms, Cookies) are modals triggered from the Footer,
 * not separate routes, so the footer never unmounts while they're open.
 */
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

import Nav        from '@/components/layout/Nav'
import Footer     from '@/components/layout/Footer'
import CartDrawer from '@/components/features/cart/CartDrawer'
import ChatBot    from '@/components/features/chat/ChatBot'
import { Toaster } from '@/components/ui/Toast'

import Home          from '@/pages/Home'
import Products      from '@/pages/Products'
import ProductDetail from '@/pages/ProductDetail'
import Account       from '@/pages/Account'
import OurStory      from '@/pages/company/OurStory'
import IngredientsPage from '@/pages/company/IngredientsPage'
import Sustainability  from '@/pages/company/Sustainability'
import Press           from '@/pages/company/Press'
import Contact         from '@/pages/company/Contact'
import Checkout        from '@/pages/Checkout'
import BlogIndex       from '@/pages/blog/BlogIndex'
import BlogPost        from '@/pages/blog/BlogPost'

import { useAuthStore }     from '@/store/authStore'
import CookieConsent from '@/components/ui/CookieConsent'
import { useWishlistStore } from '@/store/wishlistStore'

export default function App() {
  const initAuth     = useAuthStore((s) => s.init)
  const user         = useAuthStore((s) => s.user)
  const syncWishlist = useWishlistStore((s) => s.syncFromServer)

  useEffect(() => { initAuth() }, [initAuth])
  useEffect(() => { if (user?.id) syncWishlist(user.id) }, [user?.id, syncWishlist])

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

        <main id="main-content">
          <AnimatePresence mode="wait">
            <Routes>
              {/* Core pages */}
              <Route path="/"             element={<Home />} />
              <Route path="/products"     element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/account"      element={<Account />} />

              {/* Company pages (linked from footer & nav) */}
              <Route path="/our-story"      element={<OurStory />} />
              <Route path="/ingredients"    element={<IngredientsPage />} />
              <Route path="/sustainability" element={<Sustainability />} />
              <Route path="/press"          element={<Press />} />
              <Route path="/contact"        element={<Contact />} />

              {/* 404 fallback — redirects home */}
              {/* Blog / Journal */}
              <Route path="/checkout"    element={<Checkout />} />
              <Route path="/blog"        element={<BlogIndex />} />
              <Route path="/blog/:slug" element={<BlogPost />} />

              {/* 404 fallback */}
              <Route path="*" element={<Home />} />
            </Routes>
          </AnimatePresence>
        </main>

        <Footer />
        <CartDrawer />
        <ChatBot />
        <Toaster />
        <CookieConsent />
      </div>
    </BrowserRouter>
  )
}
