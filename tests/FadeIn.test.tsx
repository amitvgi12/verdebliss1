import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import FadeIn from '@/components/ui/FadeIn'

const { mockUseReducedMotion } = vi.hoisted(() => ({
  mockUseReducedMotion: vi.fn(() => false as boolean | null),
}))

vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>()
  return { ...actual, useReducedMotion: () => mockUseReducedMotion() }
})

beforeEach(() => {
  mockUseReducedMotion.mockReturnValue(false)
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('FadeIn — reduced-motion', () => {
  it('renders children in full-motion mode', () => {
    render(<FadeIn>content</FadeIn>)
    expect(screen.getByText('content')).toBeInTheDocument()
  })

  it('renders children in reduced-motion mode', () => {
    mockUseReducedMotion.mockReturnValue(true)
    render(<FadeIn>visible</FadeIn>)
    expect(screen.getByText('visible')).toBeInTheDocument()
  })

  it('wrapper has no opacity-0 initial style in reduced-motion mode', () => {
    mockUseReducedMotion.mockReturnValue(true)
    const { container } = render(<FadeIn>visible</FadeIn>)
    expect((container.firstChild as HTMLElement).style.opacity).not.toBe('0')
  })

  it('forwards className in reduced-motion mode', () => {
    mockUseReducedMotion.mockReturnValue(true)
    const { container } = render(<FadeIn className="test-cls">content</FadeIn>)
    expect(container.firstChild).toHaveClass('test-cls')
  })

  it('forwards className in full-motion mode', () => {
    const { container } = render(<FadeIn className="test-cls">content</FadeIn>)
    expect(container.firstChild).toHaveClass('test-cls')
  })
})
