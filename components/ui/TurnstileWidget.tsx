'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string
          callback?: (token: string) => void
          'expired-callback'?: () => void
          'error-callback'?: () => void
          theme?: 'light' | 'dark' | 'auto'
          size?: 'normal' | 'compact'
          appearance?: 'always' | 'execute' | 'interaction-only'
        }
      ) => string
      remove: (widgetId: string) => void
      reset: (widgetId?: string) => void
    }
    onloadTurnstileCallback?: () => void
  }
}

interface TurnstileWidgetProps {
  onToken: (token: string) => void
  onExpire?: () => void
  className?: string
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

/**
 * Cloudflare Turnstile widget. Renders nothing if NEXT_PUBLIC_TURNSTILE_SITE_KEY
 * is not set. Production startup validation reports that misconfiguration and
 * protected APIs fail closed server-side.
 */
export default function TurnstileWidget({ onToken, onExpire, className }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!siteKey) return
    const node = containerRef.current
    if (!node) return

    let cancelled = false

    const render = () => {
      if (cancelled || !window.turnstile || !node) return
      try {
        widgetIdRef.current = window.turnstile.render(node, {
          sitekey: siteKey,
          theme: 'light',
          size: 'normal',
          callback: (token) => onToken(token),
          'expired-callback': () => onExpire?.(),
          'error-callback': () => onExpire?.(),
        })
      } catch {
        /* render races during HMR are harmless */
      }
    }

    if (window.turnstile) {
      render()
    } else {
      const existing = document.querySelector<HTMLScriptElement>(`script[src^="${SCRIPT_SRC}"]`)
      if (!existing) {
        const script = document.createElement('script')
        script.src = SCRIPT_SRC
        script.async = true
        script.defer = true
        script.onload = render
        document.head.appendChild(script)
      } else {
        existing.addEventListener('load', render, { once: true })
      }
    }

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          /* widget may already be gone */
        }
      }
    }
  }, [onExpire, onToken, siteKey])

  if (!siteKey) return null

  return <div ref={containerRef} className={className} aria-label="Bot challenge" />
}
