'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, PackageCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { C, FONT } from '@/constants/theme'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'

interface RefundRow {
  id: string
  order_id?: string | null
  reason?: string | null
  status?: string | null
  created_at?: string | null
}

interface EligibleOrderItem {
  id?: string
  name?: string
  qty?: number
  price?: number
}

interface EligibleOrder {
  id: string
  status?: string | null
  payment_status?: string | null
  created_at?: string | null
  total?: number | null
  items?: EligibleOrderItem[] | null
}

export default function RefundClient() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const authLoading = useAuthStore((s) => s.loading)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersLoaded, setOrdersLoaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [refunds, setRefunds] = useState<RefundRow[]>([])
  const [eligibleOrders, setEligibleOrders] = useState<EligibleOrder[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setRefunds([])
      setEligibleOrders([])
      setSelectedOrderId('')
      setOrdersLoaded(false)
      return
    }

    void fetchRefunds()
    void fetchEligibleOrders()
  }, [authLoading, user])

  async function fetchRefunds() {
    if (!user) return
    setHistoryLoading(true)
    setHistoryError(null)
    try {
      const { data, error } = await supabase
        .from('refunds')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        setRefunds([])
        setHistoryError(error.message)
      } else {
        setRefunds((data ?? []) as RefundRow[])
      }
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : String(error))
    } finally {
      setHistoryLoading(false)
    }
  }

  async function fetchEligibleOrders() {
    if (!user) return
    setOrdersLoading(true)
    setOrdersLoaded(false)
    setRequestError(null)
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) throw new Error('Please sign in again to load eligible orders.')

      const response = await fetch('/api/refunds/eligible-orders', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = (await response.json().catch(() => ({}))) as {
        orders?: EligibleOrder[]
        error?: string
      }
      if (!response.ok) throw new Error(payload.error ?? 'Could not load eligible orders')

      const orders = payload.orders ?? []
      setEligibleOrders(orders)
      setSelectedOrderId((current) =>
        orders.some((order) => order.id === current) ? current : (orders[0]?.id ?? '')
      )
    } catch (error) {
      setEligibleOrders([])
      setSelectedOrderId('')
      setRequestError(error instanceof Error ? error.message : String(error))
    } finally {
      setOrdersLoading(false)
      setOrdersLoaded(true)
    }
  }

  async function requestRefund() {
    if (!user) {
      router.push('/account')
      return
    }
    if (!selectedOrderId) {
      setRequestError('Please select an order for the refund request.')
      return
    }
    if (!reason.trim()) {
      setRequestError('Please provide a reason for the refund request.')
      return
    }

    setSubmitting(true)
    setRequestError(null)
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      const response = await fetch('/api/refunds/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vb-client': 'web',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ orderId: selectedOrderId, reason }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error ?? 'Could not submit refund request')
      setReason('')
      await Promise.all([fetchRefunds(), fetchEligibleOrders()])
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : String(error))
    } finally {
      setSubmitting(false)
    }
  }

  const requestFormReady =
    Boolean(user) && ordersLoaded && !ordersLoading && eligibleOrders.length > 0

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 16px 80px' }}>
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'none',
            border: 'none',
            color: C.muted,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'inherit',
            cursor: 'pointer',
            marginBottom: 24,
          }}
        >
          <ArrowLeft size={14} /> Back
        </button>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontFamily: FONT.serif, fontSize: 36, color: C.text, fontWeight: 400 }}>
            Returns & Refunds
          </h1>
          <p style={{ fontSize: 15, color: C.muted, marginTop: 12, maxWidth: 760 }}>
            View your refund requests and history. Submit a new refund request below and our team
            will get back to you within 24 hours.
          </p>

          <section style={{ marginTop: 28 }}>
            <h2 style={{ fontSize: 18, color: C.text, marginBottom: 8, fontWeight: 700 }}>
              Your Refund Requests
            </h2>

            {authLoading && <RefundAccountGuidance loading />}
            {historyLoading && <div style={{ color: C.muted }}>Loading refund history...</div>}
            {historyError && (
              <div style={{ color: '#A32D2D', marginBottom: 12 }}>
                Could not load refund history. {historyError}
              </div>
            )}

            {!authLoading && !user && (
              <RefundAccountGuidance />
            )}

            {user && refunds.length === 0 && !historyLoading && (
              <div style={{ color: C.muted, marginBottom: 12 }}>No refund requests yet.</div>
            )}

            {user && refunds.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                {refunds.map((refund) => (
                  <div
                    key={refund.id}
                    style={{
                      background: C.card,
                      padding: 12,
                      borderRadius: 10,
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    <div
                      style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                        {refund.reason}
                      </div>
                      <div style={{ fontSize: 12, color: C.muted }}>
                        {refund.created_at ? new Date(refund.created_at).toLocaleString() : ''}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: C.muted }}>Status: {refund.status}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {!authLoading && user && (
            <section style={{ marginTop: 28 }}>
              <h2 style={{ fontSize: 18, color: C.text, marginBottom: 8, fontWeight: 700 }}>
                Request a Refund
              </h2>

              {(!ordersLoaded || ordersLoading) && (
                <div style={{ color: C.muted }}>Loading eligible orders...</div>
              )}

              {ordersLoaded && !ordersLoading && eligibleOrders.length === 0 && (
                <div
                  style={{
                    maxWidth: 620,
                    border: `1px solid ${C.border}`,
                    borderRadius: 14,
                    background: C.card,
                    color: C.muted,
                    padding: '16px 18px',
                  }}
                >
                  No eligible orders are available for a new refund request.
                </div>
              )}

              {requestFormReady && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 620 }}>
                  <fieldset
                    style={{
                      border: `1px solid ${C.border}`,
                      borderRadius: 14,
                      background: C.card,
                      display: 'grid',
                      gap: 10,
                      padding: 16,
                    }}
                  >
                    <legend
                      style={{
                        color: C.text,
                        fontSize: 12,
                        fontWeight: 700,
                        paddingInline: 6,
                      }}
                    >
                      Select an eligible order
                    </legend>
                    {eligibleOrders.map((order) => (
                      <label
                        key={order.id}
                        style={{
                          border:
                            selectedOrderId === order.id
                              ? `1px solid ${C.forest}`
                              : `1px solid ${C.border}`,
                          borderRadius: 12,
                          background:
                            selectedOrderId === order.id ? C.sagePale : C.bg,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                          padding: '13px 14px',
                        }}
                      >
                        <input
                          type="radio"
                          name="refund-order"
                          value={order.id}
                          checked={selectedOrderId === order.id}
                          onChange={() => setSelectedOrderId(order.id)}
                          style={{ marginTop: 3 }}
                        />
                        <span style={{ display: 'grid', gap: 4 }}>
                          <strong style={{ color: C.text, fontSize: 14 }}>
                            Order #{order.id.slice(0, 8).toUpperCase()}
                          </strong>
                          <span style={{ color: C.muted, fontSize: 13 }}>
                            {formatOrderDate(order.created_at)} · ₹
                            {Number(order.total ?? 0).toLocaleString()}
                          </span>
                          <span style={{ color: C.muted, fontSize: 12 }}>
                            {summariseOrderItems(order.items)}
                          </span>
                        </span>
                      </label>
                    ))}
                  </fieldset>

                  <label
                    htmlFor="refund-reason"
                    style={{ display: 'grid', gap: 8, fontSize: 12, fontWeight: 600, color: C.text }}
                  >
                    Refund reason
                    <textarea
                      id="refund-reason"
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="Tell us what happened with this order"
                      rows={4}
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        border: `1px solid ${C.border}`,
                        fontFamily: 'inherit',
                      }}
                    />
                  </label>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={requestRefund}
                      disabled={submitting}
                      style={{
                        background: C.forest,
                        color: 'white',
                        border: 'none',
                        borderRadius: 10,
                        padding: '10px 16px',
                        cursor: submitting ? 'wait' : 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {submitting ? 'Submitting...' : 'Submit Refund Request'}
                    </button>
                    <button
                      onClick={() => setReason('')}
                      disabled={submitting}
                      style={{
                        background: 'none',
                        border: '1px solid ' + C.border,
                        borderRadius: 10,
                        padding: '10px 16px',
                        cursor: submitting ? 'wait' : 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {requestError && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#A32D2D',
                    marginTop: 12,
                  }}
                >
                  <PackageCheck size={15} />
                  {requestError}
                </div>
              )}
            </section>
          )}
        </motion.div>
      </div>
    </div>
  )
}

function formatOrderDate(value?: string | null) {
  if (!value) return 'Date unavailable'
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function summariseOrderItems(items?: EligibleOrderItem[] | null) {
  if (!Array.isArray(items) || items.length === 0) return 'Order items available in history'
  const names = items.map((item) => item.name).filter(Boolean)
  if (!names.length) return `${items.length} item${items.length === 1 ? '' : 's'}`
  if (names.length <= 2) return names.join(', ')
  return `${names.slice(0, 2).join(', ')} +${names.length - 2} more`
}

function RefundAccountGuidance({ loading = false }: { loading?: boolean }) {
  return (
    <div
      style={{
        maxWidth: 640,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        background: C.card,
        padding: '18px 20px',
        color: C.muted,
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <span
          aria-hidden
          style={{
            display: 'inline-flex',
            width: 34,
            height: 34,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            background: C.sagePale,
            color: C.forest,
            flexShrink: 0,
          }}
        >
          <PackageCheck size={17} />
        </span>
        <div>
          <h3 style={{ margin: 0, color: C.text, fontSize: 15, fontWeight: 700 }}>
            {loading ? 'Checking your account' : 'Sign in to request a refund'}
          </h3>
          <p style={{ margin: '7px 0 0', fontSize: 13, lineHeight: 1.7 }}>
            {loading
              ? 'If you are signed in, we will load refund history and eligible orders automatically. Signed-out customers can sign in to start a request or review the policy first.'
              : 'Refund requests are linked to verified orders. Sign in to see eligible orders, open requests, and status updates. Use the same email you used at checkout.'}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
            <a
              href="/account"
              style={{
                background: C.forest,
                color: 'white',
                borderRadius: 10,
                padding: '9px 14px',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Sign in
            </a>
            <a
              href="/returns-refunds"
              style={{
                color: C.forest,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: '9px 14px',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Return and Refund Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
