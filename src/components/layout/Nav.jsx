/**
 * Nav.jsx — Sticky navigation bar
 * Responsive: full bar ≥768px, hamburger + icons only <768px
 * Logo: /public/images/logo.png (logo.png uploaded by user)
 */
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { User, ShoppingBag, Menu, X, Search } from 'lucide-react'
import SearchBar from '@/components/features/search/SearchBar'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { useWindowWidth, BP } from '@/hooks/useWindowWidth'
import { C, FONT } from '@/constants/theme'

export default function Nav() {
  const navigate   = useNavigate()
  const location   = useLocation()
  const openCart   = useCartStore((s) => s.openCart)
  const itemCount  = useCartStore((s) => s.itemCount)
  const user       = useAuthStore((s) => s.user)
  const width      = useWindowWidth()
  const isMobile   = width < BP.tablet

  const [menuOpen,   setMenuOpen]   = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const links = [
    { path: '/',         label: 'Home'    },
    { path: '/products', label: 'Shop'    },
    { path: '/account',  label: 'Account' },
    { path: '/blog',     label: 'Journal' },
  ]

  const isActive = (path) =>
    location.pathname === path ||
    (path === '/products' && location.pathname.startsWith('/products'))

  const goTo = (path) => { navigate(path); setMenuOpen(false); setSearchOpen(false) }

  return (
    <>
      <nav style={{ background: 'rgba(250,247,242,0.96)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 100, padding: '0 16px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12, height: 60 }}>

          {/* Logo — /public/images/logo.png */}
          <button onClick={() => goTo('/')} aria-label="VerdeBliss home" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            <img
              src="/images/logo.png"
              alt="VerdeBliss"
              style={{ height: 40, width: 'auto', objectFit: 'contain' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextElementSibling.style.display = 'block'
              }}
            />
            {/* Text fallback shown only if image 404s */}
            <span style={{ display: 'none', fontSize: 16, fontWeight: 600, color: C.forest, fontFamily: FONT.serif }}>VerdeBliss</span>
          </button>

          {/* Desktop nav links */}
          {!isMobile && (
            <div style={{ display: 'flex', gap: 20, marginLeft: 8, flexShrink: 0 }}>
              {links.map(({ path, label }) => (
                <button key={path} onClick={() => goTo(path)} style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: isActive(path) ? 600 : 400, color: isActive(path) ? C.forest : C.muted, cursor: 'pointer', fontFamily: 'inherit', padding: '4px 0', borderBottom: isActive(path) ? `2px solid ${C.forest}` : '2px solid transparent', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Desktop search */}
          {!isMobile && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <SearchBar />
            </div>
          )}

          {/* Push icons right on mobile */}
          {isMobile && <div style={{ flex: 1 }} />}

          {/* Icon row */}
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {isMobile && (
              <button onClick={() => setSearchOpen((o) => !o)} aria-label="Search" style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Search size={18} color={C.text} />
              </button>
            )}
            <button onClick={() => goTo('/account')} aria-label="Account" style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer', borderRadius: 8, display: 'flex', alignItems: 'center' }}>
              <User size={18} color={user ? C.forest : C.text} />
            </button>
            <button onClick={openCart} aria-label={`Cart, ${itemCount} items`} style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer', borderRadius: 8, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <ShoppingBag size={18} color={C.text} />
              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.span key="badge" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} style={{ position: 'absolute', top: 3, right: 3, background: C.terra, color: 'white', borderRadius: '50%', width: 16, height: 16, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            {isMobile && (
              <button onClick={() => setMenuOpen((o) => !o)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                {menuOpen ? <X size={18} color={C.text} /> : <Menu size={18} color={C.text} />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile search slide-down */}
        <AnimatePresence>
          {isMobile && searchOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', borderTop: `1px solid ${C.border}` }}>
              <div style={{ padding: '10px 16px' }}><SearchBar /></div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Mobile slide-out menu */}
      <AnimatePresence>
        {isMobile && menuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 98 }} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 26 }} style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 240, background: C.card, zIndex: 99, padding: '80px 20px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {links.map(({ path, label }) => (
                <button key={path} onClick={() => goTo(path)} style={{ background: isActive(path) ? C.sagePale : 'none', border: 'none', textAlign: 'left', padding: '12px 16px', borderRadius: 10, fontSize: 16, fontWeight: isActive(path) ? 600 : 400, color: isActive(path) ? C.forest : C.text, cursor: 'pointer', fontFamily: FONT.serif, width: '100%' }}>
                  {label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
