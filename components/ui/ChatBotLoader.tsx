'use client'
import dynamic from 'next/dynamic'

const ChatBot = dynamic(() => import('@/components/features/chat/ChatBot'), { ssr: false })

export default function ChatBotLoader() {
  return <ChatBot />
}
