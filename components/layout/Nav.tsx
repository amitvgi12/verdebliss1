'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
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
import { useFocusTrap } from '@/hooks/useFocusTrap'
import type { Product } from '@/types'

const LINKS = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/products', label: 'Shop', icon: Store },
  { path: '/quiz', label: 'Skin Quiz', icon: Sparkles },
  { path: '/blog', label: 'Journal', icon: BookOpen },
  { path: '/faq', label: 'FAQ', icon: CircleHelp },
  { path: '/account', label: 'Account', icon: UserRound },
]

export default function Nav({ products }: { products: Product[] }) {
  const pathname = usePathname()
  const openCart = useCartStore((s) => s.openCart)
  const itemCount = useCartStore(selectItemCount)

  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const isActive = (path: string) =>
    pathname === path || (path === '/products' && pathname?.startsWith('/products'))

  function closeMobileMenu() {
    menuRef.current?.hidePopover?.()
    setMenuOpen(false)
  }

  const closeMenus = () => {
    closeMobileMenu()
    setSearchOpen(false)
  }

  // WCAG 2.1 SC 2.1.2 + dialog pattern for the overlay mobile menu:
  // trap focus within the menu while open, restore it to the burger on close.
  const menuRef = useFocusTrap<HTMLElement>(menuOpen, closeMobileMenu)

  useEffect(() => {
    const menu = menuRef.current
    if (!menu) return

    const syncMenuState = (event: Event) => {
      const { newState } = event as Event & { newState?: string }
      setMenuOpen(newState === 'open')
    }

    menu.addEventListener('toggle', syncMenuState)
    return () => menu.removeEventListener('toggle', syncMenuState)
  }, [menuRef])

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
            <SearchBar products={products} />
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
                closeMobileMenu()
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
              <User size={18} className="text-text" />
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
              onClick={() => setSearchOpen(false)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen ? 'true' : 'false'}
              aria-haspopup="dialog"
              popoverTarget="mobile-navigation-menu"
              popoverTargetAction="toggle"
              data-testid="mobile-menu-toggle"
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
                <SearchBar products={products} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Mobile menu */}
      <aside
        ref={menuRef}
        id="mobile-navigation-menu"
        popover="auto"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        data-testid="mobile-navigation-menu"
        style={{ padding: 10 }}
        className="fixed left-auto right-4 top-[68px] z-[99] m-0 w-[84vw] max-w-[300px] max-h-[calc(100dvh-88px)] overflow-y-auto rounded-[26px] border border-white/25 bg-white/12 shadow-[0_20px_60px_rgba(20,30,22,0.38)] backdrop-blur-2xl md:hidden"
      >
        {/* Padding/margins are set inline because the global `*{padding:0;margin:0}`
            reset is un-layered and overrides Tailwind's layered p-/m- utilities, so
            px-5/py-4/mb-3/mt-2 collapse to 0 and the eyebrow clips against the top. */}
        <div
          style={{ padding: '12px 16px', marginBottom: 10 }}
          className="flex items-start justify-between rounded-[18px] bg-[#2a5638] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
        >
          <div>
            {/* Gold stays AA (~4.5:1) on this only-slightly-lighter pill (#2a5638). */}
            <p className="text-[10px] font-black uppercase leading-none tracking-[0.2em] text-[#d7b978]">
              Pages
            </p>
            <p
              style={{ marginTop: 5 }}
              className="text-[15px] font-semibold leading-tight text-[#fffaf4]"
            >
              Explore VerdeBliss
            </p>
          </div>
          {/* Explicit close button — keyboard users can close without navigating */}
          <button
            type="button"
            onClick={closeMobileMenu}
            popoverTarget="mobile-navigation-menu"
            popoverTargetAction="hide"
            aria-label="Close navigation menu"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/70 hover:bg-white/20"
          >
            <X size={14} />
          </button>
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
                style={{ padding: '7px 12px' }}
                className={`group flex w-full items-center gap-2.5 rounded-2xl border text-left text-[13px] backdrop-blur-md transition ${
                  active
                    ? 'border-[#2a5638] bg-[#2a5638] font-semibold text-[#fffaf4] shadow-sm'
                    : 'border-white/55 bg-[#fdf7ef]/80 font-semibold text-text hover:border-sage hover:bg-sagePale/90 hover:text-forest'
                }`}
              >
                <span
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                    active ? 'bg-white/20 text-[#fffaf4]' : 'bg-sagePale text-forest'
                  }`}
                >
                  <Icon size={15} />
                </span>
                <span className={`flex-1 ${active ? 'text-[#fffaf4]' : 'text-text'}`}>{label}</span>
                <ArrowRight
                  size={13}
                  className={
                    active ? 'text-[#fffaf4] opacity-85' : 'text-muted group-hover:text-forest'
                  }
                />
              </Link>
            )
          })}
        </div>
      </aside>
    </>
  )
}
