import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { User, ShoppingBag, Leaf } from 'lucide-react'
import SearchBar from '@/components/features/search/SearchBar'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { C, FONT } from '@/constants/theme'

export default function Nav() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const openCart  = useCartStore((s) => s.openCart)
  const itemCount = useCartStore((s) => s.itemCount)
  const user      = useAuthStore((s) => s.user)

  const links = [
    { path: '/',         label: 'Home' },
    { path: '/products', label: 'Shop' },
  ]

  return (
    <nav style={{ background: 'rgba(250,247,242,0.96)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 100, padding: '0 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16, height: 64 }}>

        {/* Logo */}
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, padding: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.forest, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Leaf size={14} color="white" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.forest, letterSpacing: '0.05em', fontFamily: FONT.serif, lineHeight: 1 }}>VerdeBliss</div>
            <div style={{ fontSize: 7, color: C.muted, letterSpacing: '0.13em', lineHeight: 1.2 }}>WHERE BEAUTY BECOMES LUXURY</div>
          </div>
        </button>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: 20, marginLeft: 16 }}>
          {links.map(({ path, label }) => {
            const active = location.pathname === path || (path === '/products' && location.pathname.startsWith('/products'))
            return (
              <button key={path} onClick={() => navigate(path)}
                style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: active ? 600 : 400, color: active ? C.forest : C.muted, cursor: 'pointer', fontFamily: 'inherit', padding: '4px 0', borderBottom: active ? `2px solid ${C.forest}` : '2px solid transparent', transition: 'all 0.2s' }}>
                {label}
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div style={{ flex: 1 }}>
          <SearchBar />
        </div>

        {/* Icon actions */}
        <div style={{ display: 'flex', gap: 2, alignItems: 'center', flexShrink: 0 }}>
          <button onClick={() => navigate('/account')} aria-label="Account"
            style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer', borderRadius: 8, display: 'flex', alignItems: 'center' }}>
            <User size={18} color={user ? C.forest : C.text} />
          </button>

          <button onClick={openCart} aria-label={`Cart (${itemCount} items)`}
            style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer', borderRadius: 8, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <ShoppingBag size={18} color={C.text} />
            <AnimatePresence>
              {itemCount > 0 && (
                <motion.span key="badge" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  style={{ position: 'absolute', top: 3, right: 3, background: C.terra, color: 'white', borderRadius: '50%', width: 16, height: 16, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {itemCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </nav>
  )
}
