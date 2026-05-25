import { describe, expect, it, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import CookieConsent from '@/components/ui/CookieConsent'
import { CONSENT_STORAGE_KEY } from '@/lib/consent'

describe('CookieConsent accessibility', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('uses native keyboard-accessible switch controls', () => {
    render(<CookieConsent initialOpen />)

    const marketing = screen.getByRole('switch', { name: /marketing preference/i })
    expect(marketing).toBeInstanceOf(HTMLInputElement)
    expect(marketing).not.toBeChecked()

    fireEvent.click(marketing)
    expect(marketing).toBeChecked()

    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    const stored = JSON.parse(window.localStorage.getItem(CONSENT_STORAGE_KEY) ?? '{}')
    expect(stored.marketing).toBe(true)
  })

  it('traps focus, closes on Escape, and restores focus', async () => {
    const opener = document.createElement('button')
    opener.type = 'button'
    opener.textContent = 'Open preferences'
    document.body.appendChild(opener)
    opener.focus()

    render(<CookieConsent initialOpen />)

    const close = screen.getByRole('button', { name: /reject optional and close/i })
    close.focus()
    expect(document.activeElement).toBe(close)

    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /accept all/i }))

    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: /privacy overview/i })).not.toBeInTheDocument()
    )
    await waitFor(() => expect(document.activeElement).toBe(opener))
    opener.remove()
  })

  it('opens the cookie policy as a modal dialog without breaking Escape handling', async () => {
    render(<CookieConsent initialOpen />)

    fireEvent.click(screen.getByRole('button', { name: /cookie policy/i }))
    expect(screen.getByRole('dialog', { name: /cookie policy/i })).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: /cookie policy/i })).not.toBeInTheDocument()
    )
  })
})
