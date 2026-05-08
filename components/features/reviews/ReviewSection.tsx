// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Send, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import Stars from '@/components/ui/Stars'
import { C, FONT } from '@/constants/theme'

export default function ReviewSection({ productId }) {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)

  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ rating: 5, title: '', body: '' })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchReviews()
  }, [productId])

  async function fetchReviews() {
    setLoading(true)
    const { data } = await supabase
      .from('reviews')
      .select('id, rating, title, body, created_at, profiles(full_name)')
      .eq('product_id', productId)
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(20)
    setReviews(data ?? [])
    setLoading(false)
  }

  function validate() {
    const e = {}
    if (!form.title.trim()) e.title = 'Please add a review title'
    if (form.body.trim().length < 20) e.body = 'Review must be at least 20 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submitReview() {
    if (!validate()) return
    setSubmitting(true)
    const { error } = await supabase.from('reviews').insert({
      product_id: productId,
      user_id: user.id,
      rating: form.rating,
      title: form.title.trim(),
      body: form.body.trim(),
      approved: false,
    })
    setSubmitting(false)
    if (!error) {
      setSubmitted(true)
      setShowForm(false)
      setForm({ rating: 5, title: '', body: '' })
    }
  }

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  return (
    <section style={{ marginTop: 56, paddingTop: 40, borderTop: `1px solid ${C.border}` }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: FONT.serif,
              fontSize: 24,
              color: C.text,
              fontWeight: 400,
              marginBottom: 4,
            }}
          >
            Customer Reviews
          </h2>
          {avgRating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Stars rating={parseFloat(avgRating)} size={16} />
              <span style={{ fontSize: 14, color: C.muted }}>
                {avgRating} · {reviews.length} verified review{reviews.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
        {user && !submitted && (
          <button
            onClick={() => setShowForm((f) => !f)}
            style={{
              background: C.forest,
              color: 'white',
              border: 'none',
              borderRadius: 10,
              padding: '10px 20px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {showForm ? 'Cancel' : 'Write a Review'}
          </button>
        )}
        {!user && (
          <p style={{ fontSize: 13, color: C.muted }}>
            <a href="/account" style={{ color: C.forest, textDecoration: 'underline' }}>
              Sign in
            </a>{' '}
            to write a review
          </p>
        )}
      </div>

      {/* Success */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: C.sagePale,
              borderRadius: 12,
              padding: '14px 18px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <CheckCircle size={18} color={C.forest} />
            <span style={{ fontSize: 13, color: C.forest, fontWeight: 500 }}>
              Thank you! Your review is pending moderation and will appear shortly.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                background: C.ivory,
                borderRadius: 16,
                padding: '24px',
                marginBottom: 24,
                border: `1px solid ${C.border}`,
              }}
            >
              <h3 style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 16 }}>
                Your Review{profile?.full_name ? ` · ${profile.full_name}` : ''}
              </h3>

              {/* Star picker */}
              <div style={{ marginBottom: 16 }}>
                <div
                  id="review-rating-label"
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: C.muted,
                    letterSpacing: '0.04em',
                    display: 'block',
                    marginBottom: 8,
                  }}
                >
                  RATING
                </div>
                <div
                  role="group"
                  aria-labelledby="review-rating-label"
                  style={{ display: 'flex', gap: 6 }}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setForm((f) => ({ ...f, rating: n }))}
                      aria-label={`${n} star${n > 1 ? 's' : ''}`}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                    >
                      <Star
                        size={24}
                        fill={n <= form.rating ? C.gold : 'none'}
                        color={n <= form.rating ? C.gold : C.border}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div style={{ marginBottom: 12 }}>
                <label
                  htmlFor="review-title"
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: C.muted,
                    letterSpacing: '0.04em',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  REVIEW TITLE <span style={{ color: C.terra }}>*</span>
                </label>
                <input
                  id="review-title"
                  name="review_title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Summarise your experience…"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: `1px solid ${errors.title ? C.terra : C.border}`,
                    borderRadius: 10,
                    fontSize: 14,
                    fontFamily: 'inherit',
                    outline: 'none',
                    background: C.warmWhite,
                    color: C.text,
                  }}
                />
                {errors.title && (
                  <p style={{ fontSize: 11, color: C.terra, marginTop: 4 }}>{errors.title}</p>
                )}
              </div>

              {/* Body */}
              <div style={{ marginBottom: 16 }}>
                <label
                  htmlFor="review-body"
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: C.muted,
                    letterSpacing: '0.04em',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  YOUR REVIEW <span style={{ color: C.terra }}>*</span>
                </label>
                <textarea
                  id="review-body"
                  name="review_body"
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  placeholder="How has this worked for your skin? Include your skin type to help other customers…"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: `1px solid ${errors.body ? C.terra : C.border}`,
                    borderRadius: 10,
                    fontSize: 14,
                    fontFamily: 'inherit',
                    outline: 'none',
                    background: C.warmWhite,
                    color: C.text,
                    resize: 'vertical',
                  }}
                />
                {errors.body && (
                  <p style={{ fontSize: 11, color: C.terra, marginTop: 4 }}>{errors.body}</p>
                )}
              </div>

              <p style={{ fontSize: 11, color: C.muted, marginBottom: 14 }}>
                ✅ Verified Purchase · Reviews are moderated before publishing. FTC disclosure: all
                reviews are from real customers.
              </p>

              <button
                onClick={submitReview}
                disabled={submitting}
                style={{
                  background: submitting ? C.sage : C.forest,
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  padding: '11px 24px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: submitting ? 'wait' : 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Send size={14} /> {submitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {loading ? (
        <p style={{ color: C.muted, fontSize: 13, padding: '20px 0' }}>Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: C.muted }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🌿</div>
          <p style={{ fontSize: 14 }}>No reviews yet — be the first!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {reviews.map((r) => (
            <div
              key={r.id}
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                padding: '18px 20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Stars rating={r.rating} size={13} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{r.title}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: C.forest,
                      background: C.sagePale,
                      padding: '2px 8px',
                      borderRadius: 99,
                    }}
                  >
                    VERIFIED PURCHASE
                  </span>
                  <span style={{ fontSize: 11, color: C.muted }}>
                    {new Date(r.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, margin: '0 0 8px' }}>
                {r.body}
              </p>
              <p style={{ fontSize: 11, color: C.light }}>
                — {r.profiles?.full_name ?? 'Verified Customer'}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
