import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  reportError,
  reportException,
  reportMetric,
  setErrorReporter,
  type ErrorReporter,
} from '@/lib/observability'

describe('observability shim', () => {
  afterEach(() => {
    // Reset reporter between tests so they don't bleed into each other.
    setErrorReporter({ captureException: () => {}, captureMessage: () => {} })
    vi.restoreAllMocks()
  })

  describe('stdout signals (always active)', () => {
    it('reportError emits [ALERT] prefix to stderr', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      reportError('payment_reconciliation_failed', { orderId: 'ord_1' })
      expect(spy).toHaveBeenCalledWith(
        '[ALERT] payment_reconciliation_failed',
        expect.stringContaining('orderId')
      )
    })

    it('reportException emits [EXCEPTION] prefix with message + stack', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const err = new Error('DB write failed')
      reportException(err, { route: '/api/checkout' })
      expect(spy).toHaveBeenCalledWith(
        '[EXCEPTION] DB write failed',
        expect.stringContaining('route')
      )
    })

    it('reportException handles non-Error values', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      reportException('plain string error')
      expect(spy).toHaveBeenCalledWith('[EXCEPTION] plain string error', expect.any(String))
    })

    it('reportMetric emits [METRIC] prefix to stdout', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      reportMetric('checkout_duration_ms', 450)
      expect(spy).toHaveBeenCalledWith('[METRIC] checkout_duration_ms=450', expect.any(String))
    })
  })

  describe('no-op when no reporter registered', () => {
    it('reportError does not throw when reporter is absent', () => {
      // Reset to null-like state by providing a no-op.
      setErrorReporter({ captureException: () => {}, captureMessage: () => {} })
      vi.spyOn(console, 'error').mockImplementation(() => {})
      expect(() => reportError('test_event')).not.toThrow()
    })

    it('reportException does not throw when reporter is absent', () => {
      setErrorReporter({ captureException: () => {}, captureMessage: () => {} })
      vi.spyOn(console, 'error').mockImplementation(() => {})
      expect(() => reportException(new Error('test'))).not.toThrow()
    })
  })

  describe('reporter hook (e.g. Sentry)', () => {
    it('forwards reportError to registered captureMessage', () => {
      const reporter: ErrorReporter = {
        captureException: vi.fn(),
        captureMessage: vi.fn(),
      }
      setErrorReporter(reporter)
      vi.spyOn(console, 'error').mockImplementation(() => {})

      reportError('checkout_failed', { orderId: 'ord_abc' })

      expect(reporter.captureMessage).toHaveBeenCalledWith(
        '[ALERT] checkout_failed',
        expect.objectContaining({ orderId: 'ord_abc' })
      )
      expect(reporter.captureException).not.toHaveBeenCalled()
    })

    it('forwards reportException to registered captureException', () => {
      const reporter: ErrorReporter = {
        captureException: vi.fn(),
        captureMessage: vi.fn(),
      }
      setErrorReporter(reporter)
      vi.spyOn(console, 'error').mockImplementation(() => {})

      const err = new Error('webhook failed')
      reportException(err, { provider: 'razorpay' })

      expect(reporter.captureException).toHaveBeenCalledWith(
        err,
        expect.objectContaining({ provider: 'razorpay' })
      )
    })

    it('stdout signal is still emitted alongside reporter call', () => {
      const reporter: ErrorReporter = {
        captureException: vi.fn(),
        captureMessage: vi.fn(),
      }
      setErrorReporter(reporter)
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      reportError('dual_path_test')

      // Both paths must fire so log-drain alerting survives an SDK outage.
      expect(errSpy).toHaveBeenCalled()
      expect(reporter.captureMessage).toHaveBeenCalled()
    })

    it('reportMetric does not forward to reporter (metrics outside SDK scope)', () => {
      const reporter: ErrorReporter = {
        captureException: vi.fn(),
        captureMessage: vi.fn(),
      }
      setErrorReporter(reporter)
      vi.spyOn(console, 'log').mockImplementation(() => {})

      reportMetric('api_latency_ms', 120)

      expect(reporter.captureException).not.toHaveBeenCalled()
      expect(reporter.captureMessage).not.toHaveBeenCalled()
    })
  })
})
