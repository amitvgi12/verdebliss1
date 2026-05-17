'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { User, ShoppingBag, Menu, X, Search } from 'lucide-react'
import SearchBar from '@/components/features/search/SearchBar'
import { useCartStore, selectItemCount } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'

const LINKS = [
  { path: '/', label: 'Home' },
  { path: '/products', label: 'Shop' },
  { path: '/quiz', label: 'Skin Quiz' },
  { path: '/blog', label: 'Journal' },
  { path: '/faq', label: 'FAQ' },
  { path: '/account', label: 'Account' },
]

export default function Nav() {
  const pathname = usePathname()
  const openCart = useCartStore((s) => s.openCart)
  const itemCount = useCartStore(selectItemCount)
  const user = useAuthStore((s) => s.user)

  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const isActive = (path: string) =>
    pathname === path || (path === '/products' && pathname?.startsWith('/products'))

  const closeMenus = () => {
    setMenuOpen(false)
    setSearchOpen(false)
  }

  return (
    <>
      <nav className="sticky top-0 z-[100] border-b border-border bg-bg/95 px-4 backdrop-blur-md">
        <div className="site-container flex h-[60px] items-center gap-3">
          {/* Logo */}
          <Link
            href="/"
            aria-label="VerdeBliss home"
            onClick={closeMenus}
            className="flex flex-shrink-0 items-center"
          >
            <Image
              src="/images/logo.webp"
              alt="VerdeBliss"
              width={120}
              height={40}
              priority
              className="object-contain"
            />
          </Link>

          {/* Desktop nav links — md+ only via Tailwind, CSS-driven (no JS hydration mismatch) */}
          <div className="ml-2 hidden flex-shrink-0 gap-5 md:flex">
            {LINKS.map(({ path, label }) => (
              <Link
                key={path}
                href={path}
                onClick={closeMenus}
                className={`whitespace-nowrap py-1 text-[13px] transition ${
                  isActive(path)
                    ? 'border-b-2 border-gold font-semibold text-forest'
                    : 'border-b-2 border-transparent font-normal text-muted hover:text-forest'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Desktop search */}
          <div className="hidden min-w-0 flex-1 md:block">
            <SearchBar />
          </div>
          {/* Mobile spacer */}
          <div className="flex-1 md:hidden" />

          {/* Icon row */}
          <div className="flex flex-shrink-0 items-center">
            {/* Mobile-only search toggle */}
            <button
              type="button"
              onClick={() => setSearchOpen((o) => !o)}
              aria-label="Search"
              className="flex cursor-pointer items-center border-none bg-transparent p-2 md:hidden"
            >
              <Search size={18} className="text-text" />
            </button>
            <Link href="/account" aria-label="Account" className="flex items-center rounded-lg p-2">
              <User size={18} className={user ? 'text-forest' : 'text-text'} />
            </Link>
            <button
              type="button"
              onClick={openCart}
              aria-label={`Cart, ${itemCount} items`}
              className="relative flex cursor-pointer items-center rounded-lg border-none bg-transparent p-2"
            >
              <ShoppingBag size={18} className="text-text" />
              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute right-[3px] top-[3px] flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[9px] font-bold text-white"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            {/* Mobile-only burger */}
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className="flex cursor-pointer items-center border-none bg-transparent p-2 md:hidden"
            >
              {menuOpen ? (
                <X size={18} className="text-text" />
              ) : (
                <Menu size={18} className="text-text" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile search drawer */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border md:hidden"
            >
              <div className="px-4 py-2.5">
                <SearchBar />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-[98] bg-black/30 md:hidden"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26 }}
              className="fixed bottom-0 right-0 top-0 z-[99] flex w-60 flex-col gap-1 bg-card px-5 pb-5 pt-20 md:hidden"
            >
              {LINKS.map(({ path, label }) => (
                <Link
                  key={path}
                  href={path}
                  onClick={closeMenus}
                  className={`block w-full rounded-[10px] px-4 py-3 text-left font-serif text-base ${
                    isActive(path)
                      ? 'bg-sagePale font-semibold text-forest'
                      : 'font-normal text-text'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
