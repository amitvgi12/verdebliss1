import { cleanup, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Footer from '@/components/layout/Footer'

describe('footer treatment', () => {
  it('keeps the same footer markup in home-like and PDP-like route contexts', () => {
    const home = render(
      <>
        <main className="home-page" />
        <Footer />
      </>
    )
    const homeFooter = home.container.querySelector('footer')
    expect(homeFooter).toBeTruthy()
    const homeMarkup = homeFooter?.outerHTML
    cleanup()

    const pdp = render(
      <>
        <main className="min-h-screen bg-bg" />
        <Footer />
      </>
    )
    const pdpFooter = pdp.container.querySelector('footer')
    expect(pdpFooter).toBeTruthy()

    expect(pdpFooter?.outerHTML).toBe(homeMarkup)
    expect(pdpFooter).toHaveAttribute('data-footer-treatment', 'unified')
    expect(pdpFooter?.querySelectorAll('.footer-bottom__preferences')).toHaveLength(1)
    expect(pdpFooter?.querySelector('.footer-bottom')?.textContent).not.toMatch(
      /\b(?:UPI|Visa|Mastercard|Maestro|RuPay|Net Banking|EMI|COD)\b/i
    )
  })
})
