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
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => setShouldLoad(true))
    } else {
      const t = setTimeout(() => setShouldLoad(true), 1500)
      return () => clearTimeout(t)
    }
  }, [])

  return shouldLoad ? <ChatBot /> : null
}
