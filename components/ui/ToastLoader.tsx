'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useToastStore } from '@/store/toastStore'

const Toaster = dynamic(() => import('@/components/ui/Toast').then((module) => module.Toaster), {
  ssr: false,
  loading: () => null,
})

export default function ToastLoader() {
  const toastCount = useToastStore((state) => state.toasts.length)
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    if (toastCount > 0) setShouldLoad(true)
  }, [toastCount])

  return shouldLoad ? <Toaster /> : null
}
