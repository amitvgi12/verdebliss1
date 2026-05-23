'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, FileText, MapPin, CreditCard, Package } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { C, FONT } from '@/constants/theme'

interface OrderAddress {
  name: string
  email: string
  phone: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
}

interface OrderItem {
  id: string
  name: string
  qty: number
  price: number
}

interface FullOrder {
  id: string
  status: string
  payment_status: string
  payment_method: string
  payment_id: string
  subtotal: number
  shipping: number
  total: number
  points_earned: number
  created_at: string
  items: OrderItem[]
  address: OrderAddress
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  Delivered: { bg: '#EBF0E9', color: '#1E5C28' },
  Processing: { bg: '#FFF5E4', color: '#664A08' },
  'COD Pending': { bg: '#FFF5E4', color: '#664A08' },
  'COD Verification Required': { bg: '#FFF0ED', color: '#8B3A24' },
  Cancelled: { bg: '#F5F5F5', color: '#666' },
  Refunded: { bg: '#EDF4FB', color: '#1A5276' },
}

function statusStyle(status: string) {
  return STATUS_STYLE[status] ?? { bg: '#F5F5F5', color: '#555' }
}

export default function OrderDetailClient({ orderId }: { orderId: string }) {
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)
  const [order, setOrder] = useState<FullOrder | null>(null)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (loading) return
    if (!user) {
      setFetching(false)
      return
    }

    supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single()
      .then(({ data, error: err }) => {
        if (err || !data) {
          setError('Order not found.')
        } else {
          setOrder(data as FullOrder)
        }
        setFetching(false)
      })
  }, [orderId, user, loading])

  if (fetching || loading) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT.sans,
          color: C.muted,
          fontSize: 14,
        }}
      >
        Loading order…
      </div>
    )
  }

  if (!user) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          fontFamily: FONT.sans,
        }}
      >
        <p style={{ color: C.muted, fontSize: 14 }}>Sign in to view your orders.</p>
        <Link href="/account" style={{ color: C.forest, fontWeight: 700, fontSize: 13 }}>
          Go to Account
        </Link>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          fontFamily: FONT.sans,
        }}
      >
        <p style={{ color: C.muted, fontSize: 14 }}>{error ?? 'Order not found.'}</p>
        <Link href="/account" style={{ color: C.forest, fontWeight: 700, fontSize: 13 }}>
          ← Back to Account
        </Link>
      </div>
    )
  }

  const date = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const ss = statusStyle(order.status)

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: FONT.sans }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px 64px' }}>
        {/* Back + header */}
        <Link
          href="/account"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: C.muted,
            fontSize: 13,
            textDecoration: 'none',
            marginBottom: 24,
          }}
        >
          <ArrowLeft size={14} /> Back to Account
        </Link>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 28,
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: FONT.serif,
                fontSize: 26,
                fontWeight: 600,
                color: C.text,
                margin: 0,
                marginBottom: 4,
              }}
            >
              Order #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>{date}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 12,
                padding: '5px 12px',
                borderRadius: 99,
                fontWeight: 700,
                background: ss.bg,
                color: ss.color,
              }}
            >
              {order.status}
            </span>
            <Link
              href={`/account/orders/${order.id}/invoice`}
              target="_blank"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: C.forest,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              <FileText size={14} />
              Download Invoice
            </Link>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1fr) 300px',
            gap: 20,
            alignItems: 'start',
          }}
        >
          {/* Left: items */}
          <div>
            <div
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                padding: 24,
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <Package size={16} color={C.sage} />
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Items Ordered</span>
              </div>
              {(order.items ?? []).map((item, i) => (
                <div
                  key={item.id ?? i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom:
                      i < (order.items?.length ?? 0) - 1 ? `1px solid ${C.border}` : 'none',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                      Qty: {item.qty}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                      ₹{(item.price * item.qty).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                      ₹{item.price.toLocaleString()} each
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                padding: 24,
              }}
            >
              <Row label="Subtotal" value={`₹${order.subtotal?.toLocaleString()}`} />
              <Row
                label="Shipping"
                value={order.shipping === 0 ? 'Free' : `₹${order.shipping?.toLocaleString()}`}
              />
              <div
                style={{
                  borderTop: `1px solid ${C.border}`,
                  marginTop: 10,
                  paddingTop: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Total</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                  ₹{order.total?.toLocaleString()}
                </span>
              </div>
              {(order.points_earned ?? 0) > 0 && (
                <div style={{ marginTop: 10, fontSize: 12, color: C.sage, fontWeight: 600 }}>
                  +{order.points_earned} Verde points earned
                </div>
              )}
            </div>
          </div>

          {/* Right: address + payment */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                padding: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                <MapPin size={15} color={C.sage} />
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                  Delivery Address
                </span>
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: '0 0 4px' }}>
                {order.address?.name}
              </p>
              <p style={{ fontSize: 13, color: C.muted, margin: '0 0 2px', lineHeight: 1.5 }}>
                {order.address?.line1}
                {order.address?.line2 ? `, ${order.address.line2}` : ''}
              </p>
              <p style={{ fontSize: 13, color: C.muted, margin: '0 0 2px' }}>
                {order.address?.city}, {order.address?.state} {order.address?.pincode}
              </p>
              <p style={{ fontSize: 12, color: C.light, margin: '8px 0 0' }}>
                {order.address?.phone}
              </p>
              <p style={{ fontSize: 12, color: C.light, margin: '2px 0 0' }}>
                {order.address?.email}
              </p>
            </div>

            <div
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                padding: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                <CreditCard size={15} color={C.sage} />
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Payment</span>
              </div>
              <p style={{ fontSize: 13, color: C.text, fontWeight: 600, margin: '0 0 6px' }}>
                {order.payment_method}
              </p>
              <p style={{ fontSize: 11, color: C.muted, margin: 0, wordBreak: 'break-all' }}>
                Ref: {order.payment_id}
              </p>
              <div
                style={{
                  marginTop: 10,
                  display: 'inline-block',
                  fontSize: 11,
                  padding: '3px 8px',
                  borderRadius: 99,
                  fontWeight: 700,
                  background: order.payment_status === 'paid' ? '#EBF0E9' : '#FFF5E4',
                  color: order.payment_status === 'paid' ? '#1E5C28' : '#664A08',
                }}
              >
                {order.payment_status === 'paid'
                  ? 'Paid'
                  : order.payment_status?.replace(/_/g, ' ')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
      <span style={{ fontSize: 13, color: C.muted }}>{label}</span>
      <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{value}</span>
    </div>
  )
}
