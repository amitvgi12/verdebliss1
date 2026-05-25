'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  CircleHelp,
  Home,
  Menu,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  User,
  UserRound,
  X,
} from 'lucide-react'
import SearchBar from '@/components/features/search/SearchBar'
import { useCartStore, selectItemCount } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'

const LINKS = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/products', label: 'Shop', icon: Store },
  { path: '/quiz', label: 'Skin Quiz', icon: Sparkles },
  { path: '/blog', label: 'Journal', icon: BookOpen },
  { path: '/faq', label: 'FAQ', icon: CircleHelp },
  { path: '/account', label: 'Account', icon: UserRound },
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
        <div className="site-container flex h-[52px] items-center gap-2 sm:gap-3">
          {/* Logo */}
          <Link
            href="/"
            aria-label="VerdeBliss home"
            onClick={closeMenus}
            className="group flex h-full flex-shrink-0 items-center gap-2.5 text-text transition hover:text-forest"
          >
            <span aria-hidden className="relative flex h-9 w-11 items-center justify-center">
              <Image
                src="/images/logo-mark.png"
                alt=""
                width={52}
                height={42}
                priority
                className="h-9 w-auto object-contain"
              />
            </span>
            <span className="min-w-0 leading-none">
              <span className="block font-serif text-[14px] font-semibold tracking-[0.01em] sm:text-[16px]">
                VerdeBliss
              </span>
              <span className="mt-0.5 block text-[6px] font-bold uppercase tracking-[0.14em] text-muted max-[360px]:hidden sm:text-[7px]">
                Cosmetics
              </span>
            </span>
          </Link>

          {/* Desktop nav links — md+ only via Tailwind, CSS-driven (no JS hydration mismatch) */}
          <div className="ml-1 hidden flex-shrink-0 gap-5 md:flex">
            {LINKS.map(({ path, label }) => {
              const active = isActive(path)
              return (
                <Link
                  key={path}
                  href={path}
                  aria-current={active ? 'page' : undefined}
                  onClick={closeMenus}
                  className={`whitespace-nowrap py-1 text-[13px] transition ${
                    active
                      ? 'border-b-2 border-gold font-semibold text-forest'
                      : 'border-b-2 border-transparent font-normal text-muted hover:text-forest'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </div>

          {/* Desktop search */}
          <div className="hidden min-w-0 flex-1 md:block">
            <SearchBar />
          </div>
          {/* Mobile spacer */}
          <div className="flex-1 md:hidden" />

          {/* Icon row */}
          <div className="flex flex-shrink-0 items-center gap-2.5 max-[360px]:gap-2 md:gap-3">
            {/* Mobile-only search toggle */}
            <button
              type="button"
              onClick={() => {
                setSearchOpen((o) => !o)
                setMenuOpen(false)
              }}
              aria-label="Search"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border-none bg-transparent md:hidden"
            >
              <Search size={18} className="text-text" />
            </button>
            <Link
              href="/account"
              aria-label="Account"
              onClick={closeMenus}
              className="flex h-9 w-9 items-center justify-center rounded-xl"
            >
              <User size={18} className={user ? 'text-forest' : 'text-text'} />
            </Link>
            <button
              type="button"
              onClick={() => {
                closeMenus()
                openCart()
              }}
              aria-label={`Cart, ${itemCount} items`}
              title="Cart"
              className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border-none bg-transparent"
            >
              <ShoppingBag size={18} className="text-text" />
              <span className="sr-only">Cart</span>
              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute right-[-2px] top-[-2px] flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[9px] font-bold text-white shadow-sm"
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
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border-none bg-transparent md:hidden"
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
              className="fixed inset-0 z-[98] bg-[#17241b]/38 backdrop-blur-[2px] md:hidden"
            />
            <motion.aside
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-4 top-[68px] z-[99] max-h-[calc(100dvh-88px)] overflow-y-auto rounded-[26px] border border-[#d7c7b6] bg-[#fffaf4] p-3 shadow-[0_26px_80px_rgba(23,36,27,0.32)] backdrop-blur-xl md:hidden"
              aria-label="Pages menu"
            >
              <div className="mb-2.5 rounded-[20px] bg-forest px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gold">Pages</p>
                <p className="mt-1 text-base font-semibold text-white">Explore VerdeBliss</p>
              </div>
              <div className="grid gap-2">
                {LINKS.map(({ path, label, icon: Icon }) => {
                  const active = isActive(path)
                  return (
                    <Link
                      key={path}
                      href={path}
                      aria-current={active ? 'page' : undefined}
                      onClick={closeMenus}
                      className={`group flex min-h-12 w-full items-center gap-3 rounded-[18px] border px-3.5 py-2.5 text-left text-sm transition ${
                        active
                          ? 'border-forest bg-forest font-semibold text-white shadow-sm'
                          : 'border-[#eadfd4] bg-[#fdf7ef] font-semibold text-text hover:border-sage hover:bg-sagePale hover:text-forest'
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                          active ? 'bg-white/20 text-white' : 'bg-sagePale text-forest'
                        }`}
                      >
                        <Icon size={16} />
                      </span>
                      <span className="flex-1">{label}</span>
                      <ArrowRight
                        size={14}
                        className={active ? 'text-white/72' : 'text-muted group-hover:text-forest'}
                      />
                    </Link>
                  )
                })}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
