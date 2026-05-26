import { act, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import TurnstileWidget from '@/components/ui/TurnstileWidget'

describe('TurnstileWidget', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    window.turnstile = undefined
  })

  it('does not recreate the widget after token state updates', () => {
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'site-key')

    let issueToken: ((token: string) => void) | undefined
    const renderTurnstile = vi.fn((_container, options) => {
      issueToken = options.callback
      return 'widget-1'
    })
    const removeTurnstile = vi.fn()
    window.turnstile = {
      render: renderTurnstile,
      remove: removeTurnstile,
      reset: vi.fn(),
    }

    function Harness() {
      const [, setToken] = useState<string | null>(null)
      return <TurnstileWidget onToken={setToken} onExpire={() => setToken(null)} />
    }

    render(<Harness />)

    expect(renderTurnstile).toHaveBeenCalledTimes(1)

    act(() => {
      issueToken?.('fresh-token')
    })

    expect(renderTurnstile).toHaveBeenCalledTimes(1)
    expect(removeTurnstile).not.toHaveBeenCalled()
  })
})
