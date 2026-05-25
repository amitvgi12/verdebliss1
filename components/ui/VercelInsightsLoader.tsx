'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const VercelInsights = dynamic(() => import('@/components/ui/VercelInsights'), {
  ssr: false,
  loading: () => null,
})

export default function VercelInsightsLoader() {
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(() => setShouldLoad(true), { timeout: 3000 })
      return () => window.cancelIdleCallback(id)
    }

    const timeout = globalThis.setTimeout(() => setShouldLoad(true), 1800)
    return () => globalThis.clearTimeout(timeout)
  }, [])

  return shouldLoad ? <VercelInsights /> : null
}
