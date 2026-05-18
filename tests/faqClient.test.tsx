import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import FAQClient from '@/app/faq/FAQClient'

const FAQ_ITEMS = [
  {
    q: 'Are VerdeBliss products certified organic?',
    a: 'Yes, every formula contains certified organic ingredients.',
  },
  {
    q: 'Do you ship across India?',
    a: 'Yes, we ship to serviceable PIN codes across India.',
  },
]

describe('FAQClient', () => {
  it('keeps every FAQ answer in the DOM while visually collapsing closed items', () => {
    const { container } = render(<FAQClient items={FAQ_ITEMS} />)

    expect(screen.getByText(FAQ_ITEMS[0].a)).toBeInTheDocument()
    expect(screen.getByText(FAQ_ITEMS[1].a)).toBeInTheDocument()
    expect(container.querySelector('#faq-0')).not.toHaveAttribute('hidden')
    expect(container.querySelector('#faq-1')).toHaveAttribute('hidden')
  })
})
