import { useEffect, useRef } from 'react'

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Traps Tab focus within `containerRef` while `active` is true.
 * Moves focus into the container on activation, restores it on deactivation.
 * Calls `onEscape` when the Escape key is pressed (if provided).
 *
 * Usage:
 *   const ref = useFocusTrap<HTMLDivElement>(isOpen, closeModal)
 *   <div ref={ref} role="dialog" aria-modal="true">…</div>
 */
export function useFocusTrap<T extends HTMLElement>(active: boolean, onEscape?: () => void) {
  const containerRef = useRef<T | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Move focus in on open; restore previous focus on close
  useEffect(() => {
    if (!active) return
    previousFocusRef.current = document.activeElement as HTMLElement | null
    requestAnimationFrame(() => {
      containerRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()
    })
    return () => {
      previousFocusRef.current?.focus?.()
    }
  }, [active])

  // Trap Tab; optionally close on Escape
  useEffect(() => {
    if (!active) return
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscape?.()
        return
      }
      if (e.key !== 'Tab') return
      const focusable = Array.from(
        containerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []
      )
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last?.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [active, onEscape])

  return containerRef
}
