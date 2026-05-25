'use client'
import { useEffect, useState } from 'react'
import { Printer, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { BUSINESS_COMPLIANCE, formatPostalAddress } from '@/constants/businessCompliance'

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

interface TaxLine {
  type: 'CGST' | 'SGST' | 'IGST'
  rate: number
  amount: number
}

interface Invoice {
  invoice_number: string
  invoice_date: string
  subtotal: number
  tax_amount: number
  shipping: number
  total: number
  tax_lines: TaxLine[]
  seller_gstin: string | null
  buyer_gstin: string | null
  supply_type: string
  place_of_supply: string | null
  status: string
}

export default function InvoiceClient({ orderId }: { orderId: string }) {
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)
  const [order, setOrder] = useState<FullOrder | null>(null)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (loading) return
    if (!user) {
      setFetching(false)
      return
    }
    Promise.all([
      supabase.from('orders').select('*').eq('id', orderId).eq('user_id', user.id).single(),
      supabase.from('invoices').select('*').eq('order_id', orderId).single(),
    ]).then(([{ data: orderData }, { data: invData }]) => {
      if (orderData) setOrder(orderData as FullOrder)
      if (invData) setInvoice(invData as Invoice)
      setFetching(false)
    })
  }, [orderId, user, loading])

  const handlePrint = () => {
    void supabase.rpc('record_invoice_download', { p_order_id: orderId })
    window.print()
  }

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

  const invoiceNumber = invoice?.invoice_number ?? `VB-${order.id.slice(0, 8).toUpperCase()}`
  const invoiceDate = new Date(invoice?.invoice_date ?? order.created_at).toLocaleDateString(
    'en-IN',
    { day: 'numeric', month: 'long', year: 'numeric' }
  )
  const taxLines: TaxLine[] = invoice?.tax_lines ?? []
  // Taxable base = subtotal minus embedded GST
  const taxableAmount = invoice
    ? round2(invoice.subtotal - invoice.tax_amount)
    : round2((order.subtotal * 100) / 118)
  const addr = order.address

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
        <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>
          Invoice — {invoiceNumber}
        </span>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handlePrint}
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
          {/* Header */}
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
              {invoice?.seller_gstin && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>
                  GSTIN: {invoice.seller_gstin}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{ fontSize: 18, fontWeight: 800, color: '#BFA06A', letterSpacing: '0.05em' }}
              >
                TAX INVOICE
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.9)',
                  marginTop: 6,
                  fontWeight: 700,
                }}
              >
                {invoiceNumber}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>
                {invoiceDate}
              </div>
              {invoice?.status === 'cancelled' && (
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#F87171',
                    letterSpacing: '0.1em',
                  }}
                >
                  CANCELLED
                </div>
              )}
            </div>
          </div>

          {/* Seller / Buyer */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              borderBottom: '1px solid #E8E0D6',
            }}
          >
            <div style={{ padding: '20px 36px', borderRight: '1px solid #E8E0D6' }}>
              <div style={eyebrow}>SOLD BY</div>
              <div style={boldLine}>{BUSINESS_COMPLIANCE.legalName}</div>
              <div style={mutedLine}>
                {formatPostalAddress()}
                <br />
                {BUSINESS_COMPLIANCE.emails.support}
              </div>
              {invoice?.place_of_supply && (
                <div style={{ ...mutedLine, marginTop: 4 }}>
                  State of supply: {invoice.place_of_supply}
                </div>
              )}
            </div>
            <div style={{ padding: '20px 36px' }}>
              <div style={eyebrow}>BILL TO</div>
              <div style={boldLine}>{addr?.name}</div>
              <div style={mutedLine}>
                {addr?.line1}
                {addr?.line2 ? `, ${addr.line2}` : ''}
                <br />
                {addr?.city}, {addr?.state} — {addr?.pincode}
                <br />
                {addr?.phone}
              </div>
              <div style={{ fontSize: 12, color: '#A8BAA9', marginTop: 3 }}>{addr?.email}</div>
              {invoice?.buyer_gstin && (
                <div style={{ fontSize: 11, color: '#5C6C4D', marginTop: 4 }}>
                  GSTIN: {invoice.buyer_gstin}
                </div>
              )}
            </div>
          </div>

          {/* Items table */}
          <div style={{ padding: '0 36px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FAF7F2' }}>
                  {['#', 'PRODUCT', 'QTY', 'UNIT PRICE', 'TOTAL'].map((h, i) => (
                    <th
                      key={h}
                      style={{
                        padding: '11px 0',
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: '#C07A5A',
                        borderBottom: '1px solid #E8E0D6',
                        textAlign: i === 0 ? 'left' : i === 1 ? 'left' : 'right',
                        paddingLeft: i > 0 && i < 4 ? 12 : 0,
                        paddingRight: i === 4 ? 0 : undefined,
                      }}
                    >
                      {h}
                    </th>
                  ))}
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
                      ₹{item.price.toLocaleString('en-IN')}
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
                      ₹{(item.price * item.qty).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals + GST breakdown */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '0 32px',
              padding: '16px 36px 20px',
              alignItems: 'start',
            }}
          >
            {/* GST breakdown (left) */}
            {taxLines.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color: '#C07A5A',
                    marginBottom: 8,
                  }}
                >
                  TAX BREAKDOWN
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Tax Type', 'Rate', 'Taxable Amt', 'Tax Amt'].map((h) => (
                        <th
                          key={h}
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#A8BAA9',
                            textAlign: 'left',
                            paddingBottom: 4,
                            paddingRight: 16,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {taxLines.map((tl) => (
                      <tr key={tl.type}>
                        <td style={taxCell}>{tl.type}</td>
                        <td style={taxCell}>{tl.rate}%</td>
                        <td style={taxCell}>₹{taxableAmount.toLocaleString('en-IN')}</td>
                        <td style={taxCell}>₹{tl.amount.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ fontSize: 10, color: '#A8BAA9', marginTop: 6 }}>
                  All prices are inclusive of GST
                </div>
              </div>
            )}
            {taxLines.length === 0 && <div />}

            {/* Amount summary (right) */}
            <div style={{ minWidth: 220 }}>
              <TotalRow
                label="Subtotal (incl. tax)"
                value={`₹${order.subtotal?.toLocaleString('en-IN')}`}
              />
              {invoice && invoice.tax_amount > 0 && (
                <TotalRow
                  label={`GST (${taxLines.map((t) => `${t.type} ${t.rate}%`).join(' + ')})`}
                  value={`₹${invoice.tax_amount.toLocaleString('en-IN')}`}
                  muted
                />
              )}
              <TotalRow
                label="Shipping"
                value={
                  order.shipping === 0 ? 'Free' : `₹${order.shipping?.toLocaleString('en-IN')}`
                }
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
                  ₹{order.total?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
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
              <div style={eyebrow}>PAYMENT</div>
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
                Questions? {BUSINESS_COMPLIANCE.emails.support}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Shared micro-styles ────────────────────────────────────────────────────────

const eyebrow: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.1em',
  color: '#C07A5A',
  marginBottom: 8,
}

const boldLine: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: '#1C221E',
  marginBottom: 3,
}

const mutedLine: React.CSSProperties = {
  fontSize: 12,
  color: '#5C6C4D',
  lineHeight: 1.6,
}

const taxCell: React.CSSProperties = {
  fontSize: 11,
  color: '#5C6C4D',
  paddingTop: 3,
  paddingRight: 16,
}

function TotalRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
      <span style={{ fontSize: 12, color: muted ? '#A8BAA9' : '#5C6C4D' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: muted ? '#A8BAA9' : '#1C221E' }}>
        {value}
      </span>
    </div>
  )
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
