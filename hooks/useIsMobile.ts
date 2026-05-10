'use client'

import { useSyncExternalStore } from 'react'

/**
 * Hydration-safe responsive hook.
 *
 * Why not `useWindowWidth`:
 *   - Reading `window.innerWidth` returns 1200 on server, real value on
 *     hydration. The mismatch causes a layout shift on every page that
 *     branches on the boolean.
 *
 * Why `useSyncExternalStore`:
 *   - Built for exactly this pattern (subscribe to a browser-only signal
 *     that is undefined on the server).
 *   - The server snapshot returns `false` deliberately. We render the
 *     desktop layout on the server, then if the client is actually mobile,
 *     the next render flips. Use a CSS `md:` breakpoint as the *primary*
 *     responsive mechanism wherever possible — only fall back to this hook
 *     when CSS cannot express the difference (e.g. choosing different
 *     React subtrees, attaching event handlers conditionally).
 */
const MOBILE_QUERY = '(max-width: 767px)'

function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const mql = window.matchMedia(MOBILE_QUERY)
  // Older Safari uses addListener / removeListener.
  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', callback)
    return () => mql.removeEventListener('change', callback)
  }
  mql.addListener(callback)
  return () => mql.removeListener(callback)
}

function getSnapshot(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(MOBILE_QUERY).matches
}

function getServerSnapshot(): boolean {
  return false
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
