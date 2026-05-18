'use client'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import {
  CONSENT_UPDATED_EVENT,
  hasFunctionalThirdPartyConsent,
  type StoredConsent,
} from '@/lib/consent'

const ChatBot = dynamic(() => import('@/components/features/chat/ChatBot'), { ssr: false })

export default function ChatBotLoader() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    setEnabled(hasFunctionalThirdPartyConsent())

    const handleConsentUpdate = (event: Event) => {
      const consent = (event as CustomEvent<StoredConsent>).detail
      setEnabled(consent?.functional_third_party === true)
    }

    window.addEventListener(CONSENT_UPDATED_EVENT, handleConsentUpdate)
    return () => window.removeEventListener(CONSENT_UPDATED_EVENT, handleConsentUpdate)
  }, [])

  return enabled ? <ChatBot /> : null
}
