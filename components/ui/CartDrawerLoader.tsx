'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useCartStore } from '@/store/cartStore'

const CartDrawer = dynamic(() => import('@/components/features/cart/CartDrawer'), {
  ssr: false,
  loading: () => null,
})

export default function CartDrawerLoader() {
  const isOpen = useCartStore((state) => state.isOpen)
  const itemCount = useCartStore((state) => state.items.length)
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    if (isOpen || itemCount > 0) setShouldLoad(true)
  }, [isOpen, itemCount])

  return shouldLoad ? <CartDrawer /> : null
}
