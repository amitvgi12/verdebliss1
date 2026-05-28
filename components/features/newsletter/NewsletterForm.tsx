'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { apiPost } from '@/lib/api-client'
import TurnstileWidget from '@/components/ui/TurnstileWidget'

interface NewsletterFormProps {
  source?: string
}

export default function NewsletterForm({ source = 'homepage_newsletter' }: NewsletterFormProps) {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const requiresTurnstile = Boolean(turnstileSiteKey)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (requiresTurnstile && !turnstileToken) {
      setError('Please complete the bot check first.')
      return
    }
    setLoading(true)
    try {
      await apiPost('/api/newsletter', { email, source, turnstileToken })
      setSubscribed(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not subscribe. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (subscribed) {
    return (
      <div className="inline-flex items-center gap-2 rounded-[10px] bg-sagePale px-6 py-3 font-medium text-forest">
        <Check size={16} aria-hidden /> Check your inbox to confirm your subscription.
      </div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      className="vb-newsletter-form flex flex-col items-center gap-3"
      noValidate
    >
      <div className="vb-newsletter-row">
        <label htmlFor="newsletter-email" className="sr-only">
          Newsletter signup email
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="input-base vb-newsletter-input"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'newsletter-error' : undefined}
        />
        {/* Honeypot — bots fill this; real users never see it */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-label="Leave this field blank"
          aria-hidden
        />
        <button
          type="submit"
          disabled={loading || (requiresTurnstile && !turnstileToken)}
          className="btn-gold whitespace-nowrap"
        >
          {loading ? 'Subscribing…' : 'Subscribe'}
        </button>
      </div>

      <TurnstileWidget onToken={setTurnstileToken} onExpire={() => setTurnstileToken(null)} />

      {error && (
        <div
          id="newsletter-error"
          role="alert"
          className="w-full text-center text-xs text-[#A32D2D]"
        >
          {error}
        </div>
      )}
    </form>
  )
}
