'use client'
import { useEffect, useState } from 'react'
import { Printer, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

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
  payment_method: string
  payment_id: string
  subtotal: number
  shipping: number
  total: number
  created_at: string
  items: OrderItem[]
  address: OrderAddress
}

export default function InvoiceClient({ orderId }: { orderId: string }) {
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)
  const [order, setOrder] = useState<FullOrder | null>(null)
  const [fetching, setFetching] = useState(true)

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
      .then(({ data }) => {
        setOrder(data as FullOrder)
        setFetching(false)
      })
  }, [orderId, user, loading])

  if (fetching || loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontFamily: 'DM Sans, system-ui, sans-serif',
          color: '#5C6C4D',
          fontSize: 14,
        }}
      >
        Loading invoice…
      </div>
    )
  }

  if (!order) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontFamily: 'DM Sans, system-ui, sans-serif',
          color: '#5C6C4D',
          fontSize: 14,
        }}
      >
        Invoice not found.
      </div>
    )
  }

  const date = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const invoiceNo = `VB-${order.id.slice(0, 8).toUpperCase()}`

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .invoice-sheet { box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f5f5; font-family: 'DM Sans', system-ui, sans-serif; }
      `}</style>

      {/* Toolbar */}
      <div
        className="no-print"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: '#2D4A32',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 24px',
        }}
      >
        <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>Invoice — {invoiceNo}</span>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => window.print()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#BFA06A',
              color: '#fff',
              border: 'none',
              borderRadius: 7,
              padding: '7px 16px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Printer size={14} /> Print / Save PDF
          </button>
          <button
            onClick={() => window.close()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
              border: 'none',
              borderRadius: 7,
              padding: '7px 12px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <X size={14} /> Close
          </button>
        </div>
      </div>

      {/* Invoice sheet */}
      <div style={{ paddingTop: 52, paddingBottom: 40, minHeight: '100vh' }}>
        <div
          className="invoice-sheet"
          style={{
            maxWidth: 740,
            margin: '24px auto',
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
            overflow: 'hidden',
          }}
        >
          {/* Header band */}
          <div
            style={{
              background: '#2D4A32',
              padding: '28px 36px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  fontSize: 28,
                  fontWeight: 700,
                  color: '#fff',
                  letterSpacing: '0.01em',
                }}
              >
                VerdeBliss
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  color: 'rgba(255,255,255,0.55)',
                  marginTop: 2,
                }}
              >
                COSMETICS
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{ fontSize: 18, fontWeight: 800, color: '#BFA06A', letterSpacing: '0.05em' }}
              >
                TAX INVOICE
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                {invoiceNo}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                {date}
              </div>
            </div>
          </div>

          {/* Address section */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 0,
              borderBottom: '1px solid #E8E0D6',
            }}
          >
            <div style={{ padding: '20px 36px', borderRight: '1px solid #E8E0D6' }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: '#C07A5A',
                  marginBottom: 8,
                }}
              >
                SOLD BY
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1C221E' }}>
                VerdeBliss Cosmetics
              </div>
              <div style={{ fontSize: 12, color: '#5C6C4D', lineHeight: 1.6, marginTop: 3 }}>
                Pune, Maharashtra, India
                <br />
                support@verdebliss.com
              </div>
            </div>
            <div style={{ padding: '20px 36px' }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: '#C07A5A',
                  marginBottom: 8,
                }}
              >
                BILL TO
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1C221E' }}>
                {order.address?.name}
              </div>
              <div style={{ fontSize: 12, color: '#5C6C4D', lineHeight: 1.6, marginTop: 3 }}>
                {order.address?.line1}
                {order.address?.line2 ? `, ${order.address.line2}` : ''}
                <br />
                {order.address?.city}, {order.address?.state} — {order.address?.pincode}
                <br />
                {order.address?.phone}
              </div>
              <div style={{ fontSize: 12, color: '#A8BAA9', marginTop: 3 }}>
                {order.address?.email}
              </div>
            </div>
          </div>

          {/* Items table */}
          <div style={{ padding: '0 36px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 0 }}>
              <thead>
                <tr style={{ background: '#FAF7F2' }}>
                  <th
                    style={{
                      padding: '11px 0',
                      textAlign: 'left',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      color: '#C07A5A',
                      borderBottom: '1px solid #E8E0D6',
                    }}
                  >
                    #
                  </th>
                  <th
                    style={{
                      padding: '11px 12px',
                      textAlign: 'left',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      color: '#C07A5A',
                      borderBottom: '1px solid #E8E0D6',
                    }}
                  >
                    PRODUCT
                  </th>
                  <th
                    style={{
                      padding: '11px 12px',
                      textAlign: 'right',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      color: '#C07A5A',
                      borderBottom: '1px solid #E8E0D6',
                    }}
                  >
                    QTY
                  </th>
                  <th
                    style={{
                      padding: '11px 12px',
                      textAlign: 'right',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      color: '#C07A5A',
                      borderBottom: '1px solid #E8E0D6',
                    }}
                  >
                    UNIT PRICE
                  </th>
                  <th
                    style={{
                      padding: '11px 0 11px 12px',
                      textAlign: 'right',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      color: '#C07A5A',
                      borderBottom: '1px solid #E8E0D6',
                    }}
                  >
                    TOTAL
                  </th>
                </tr>
              </thead>
              <tbody>
                {(order.items ?? []).map((item, i) => (
                  <tr key={item.id ?? i} style={{ borderBottom: '1px solid #F0EAE0' }}>
                    <td style={{ padding: '13px 0', fontSize: 12, color: '#A8BAA9' }}>{i + 1}</td>
                    <td
                      style={{
                        padding: '13px 12px',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#1C221E',
                      }}
                    >
                      {item.name}
                    </td>
                    <td
                      style={{
                        padding: '13px 12px',
                        fontSize: 13,
                        color: '#5C6C4D',
                        textAlign: 'right',
                      }}
                    >
                      {item.qty}
                    </td>
                    <td
                      style={{
                        padding: '13px 12px',
                        fontSize: 13,
                        color: '#5C6C4D',
                        textAlign: 'right',
                      }}
                    >
                      ₹{item.price.toLocaleString()}
                    </td>
                    <td
                      style={{
                        padding: '13px 0 13px 12px',
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#1C221E',
                        textAlign: 'right',
                      }}
                    >
                      ₹{(item.price * item.qty).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 36px 20px' }}>
            <div style={{ width: 240 }}>
              <TotalRow label="Subtotal" value={`₹${order.subtotal?.toLocaleString()}`} />
              <TotalRow
                label="Shipping"
                value={order.shipping === 0 ? 'Free' : `₹${order.shipping?.toLocaleString()}`}
              />
              <div
                style={{
                  borderTop: '2px solid #2D4A32',
                  marginTop: 8,
                  paddingTop: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 800, color: '#1C221E' }}>Grand Total</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#2D4A32' }}>
                  ₹{order.total?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Payment & footer */}
          <div
            style={{
              background: '#FAF7F2',
              borderTop: '1px solid #E8E0D6',
              padding: '16px 36px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: '#C07A5A',
                  marginBottom: 4,
                }}
              >
                PAYMENT
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1C221E' }}>
                {order.payment_method}
              </div>
              <div style={{ fontSize: 11, color: '#A8BAA9', marginTop: 2, wordBreak: 'break-all' }}>
                Ref: {order.payment_id}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#2D4A32' }}>
                Thank you for your order ✦
              </div>
              <div style={{ fontSize: 11, color: '#A8BAA9', marginTop: 2 }}>
                Questions? support@verdebliss.com
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
      <span style={{ fontSize: 12, color: '#5C6C4D' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#1C221E' }}>{value}</span>
    </div>
  )
}
