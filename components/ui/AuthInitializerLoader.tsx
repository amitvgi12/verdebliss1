'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const AuthInitializer = dynamic(() => import('@/components/ui/AuthInitializer'), {
  ssr: false,
  loading: () => null,
})

const EAGER_AUTH_PREFIXES = ['/account', '/checkout', '/refund']

function needsEagerAuth(pathname: string | null): boolean {
  if (!pathname) return false
  return EAGER_AUTH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export default function AuthInitializerLoader() {
  const pathname = usePathname()
  const eager = needsEagerAuth(pathname)
  const [shouldLoad, setShouldLoad] = useState(eager)

  useEffect(() => {
    if (eager) {
      setShouldLoad(true)
      return
    }

    const load = () => setShouldLoad(true)
    const fallback = window.setTimeout(load, 1800)
    let idleId: number | undefined

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(load, { timeout: 2200 })
    }

    return () => {
      window.clearTimeout(fallback)
      if (idleId !== undefined) window.cancelIdleCallback?.(idleId)
    }
  }, [eager])

  return shouldLoad ? <AuthInitializer /> : null
}
