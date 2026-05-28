'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const ChatBot = dynamic(() => import('@/components/features/chat/ChatBot'), {
  ssr: false,
  loading: () => null,
})

export default function ChatBotLoader() {
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    let loaded = false
    const load = () => {
      if (loaded) return
      loaded = true
      setShouldLoad(true)
    }

    const fallback = window.setTimeout(load, 1500)
    let idleId: number | undefined

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(load, { timeout: 1500 })
    } else {
      load()
    }

    return () => {
      window.clearTimeout(fallback)
      if (idleId !== undefined) window.cancelIdleCallback?.(idleId)
    }
  }, [])

  return shouldLoad ? <ChatBot /> : null
}
