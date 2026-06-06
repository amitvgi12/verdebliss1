'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useCompareStore } from '@/store/compareStore'

const CompareBar = dynamic(() => import('@/components/features/compare/CompareBar'), {
  ssr: false,
  loading: () => null,
})

const CompareModal = dynamic(() => import('@/components/features/compare/CompareModal'), {
  ssr: false,
  loading: () => null,
})

export default function CompareLoader() {
  const selectedCount = useCompareStore((state) => state.products.length)
  const isOpen = useCompareStore((state) => state.isOpen)
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    if (selectedCount > 0 || isOpen) setShouldLoad(true)
  }, [selectedCount, isOpen])

  return shouldLoad ? (
    <>
      <CompareBar />
      <CompareModal />
    </>
  ) : null
}
