'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { C, FONT } from '@/constants/theme'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'

export default function RefundClient() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(false)
  const [refunds, setRefunds] = useState([])
  const [error, setError] = useState(null)
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (!user) return
    fetchRefunds()
  }, [user])

  async function fetchRefunds() {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('refunds')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (err) {
        // Table might not exist yet — handle gracefully
        setRefunds([])
        setError(err.message)
      } else {
        setRefunds(data || [])
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  async function requestRefund() {
    if (!user) {
      router.push('/account')
      return
    }
    if (!reason.trim()) {
      setError('Please provide a reason for the refund request.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      const res = await fetch('/api/refunds/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reason }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload?.error ?? 'Could not submit refund request')
      setReason('')
      fetchRefunds()
    } catch (e) {
      setError(e.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }

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

            {loading && <div style={{ color: C.muted }}>Loading…</div>}
            {error && (
              <div style={{ color: '#A32D2D', marginBottom: 12 }}>
                Couldn't load refund history. {error}
              </div>
            )}

            {!user && (
              <div style={{ color: C.muted, marginBottom: 12 }}>
                Please{' '}
                <a href="/account" style={{ color: C.forest }}>
                  sign in
                </a>{' '}
                to view or request refunds.
              </div>
            )}

            {user && refunds.length === 0 && !loading && (
              <div style={{ color: C.muted, marginBottom: 12 }}>No refund requests yet.</div>
            )}

            {user && refunds.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                {refunds.map((r) => (
                  <div
                    key={r.id}
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
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{r.reason}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>
                        {new Date(r.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: C.muted }}>Status: {r.status}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section style={{ marginTop: 20 }}>
            <h2 style={{ fontSize: 18, color: C.text, marginBottom: 8, fontWeight: 700 }}>
              Request a Refund
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 560 }}>
              <label
                htmlFor="refund-reason"
                style={{ fontSize: 12, fontWeight: 600, color: C.text }}
              >
                Refund reason
              </label>
              <textarea
                id="refund-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for refund (order number, item, issue)"
                rows={4}
                style={{
                  padding: 12,
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  fontFamily: 'inherit',
                }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={requestRefund}
                  disabled={loading || !user}
                  style={{
                    background: C.forest,
                    color: 'white',
                    border: 'none',
                    borderRadius: 10,
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {loading ? 'Submitting…' : 'Submit Refund Request'}
                </button>
                <button
                  onClick={() => {
                    setReason('')
                  }}
                  style={{
                    background: 'none',
                    border: '1px solid ' + C.border,
                    borderRadius: 10,
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Clear
                </button>
              </div>
              {error && <div style={{ color: '#A32D2D' }}>{error}</div>}
            </div>
          </section>
        </motion.div>
      </div>
    </div>
  )
}
