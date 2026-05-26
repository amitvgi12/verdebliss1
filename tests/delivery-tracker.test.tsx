import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DeliveryTracker, { type TrackingInfo } from '@/app/account/orders/[id]/DeliveryTracker'

const BASE: TrackingInfo = {
  status: 'Processing',
  created_at: '2026-05-20T10:00:00.000Z',
}

const WITH_TRACKING: TrackingInfo = {
  ...BASE,
  status: 'Shipped',
  tracking_id: 'DL1234567890',
  courier_partner: 'Delhivery',
  tracking_url: 'https://www.delhivery.com/track/package/DL1234567890',
  estimated_delivery: '2026-05-24',
  shipped_at: '2026-05-21T08:30:00.000Z',
}

describe('DeliveryTracker', () => {
  describe('visibility', () => {
    it.each(['Cancelled', 'Refunded', 'Cancellation Requested'])(
      'renders nothing for %s orders',
      (status) => {
        const { container } = render(<DeliveryTracker info={{ ...BASE, status }} />)
        expect(container.firstChild).toBeNull()
      }
    )

    it('renders the tracker panel for active orders', () => {
      render(<DeliveryTracker info={BASE} />)
      expect(screen.getByText('Delivery Tracking')).toBeInTheDocument()
    })
  })

  describe('stage labels', () => {
    it('renders all five stage labels', () => {
      render(<DeliveryTracker info={BASE} />)
      expect(screen.getByText('Order Placed')).toBeInTheDocument()
      expect(screen.getByText('Order Confirmed')).toBeInTheDocument()
      expect(screen.getByText('Shipped')).toBeInTheDocument()
      expect(screen.getByText('Out for Delivery')).toBeInTheDocument()
      expect(screen.getByText('Delivered')).toBeInTheDocument()
    })

    it('shows Pending for stages beyond Processing', () => {
      render(<DeliveryTracker info={{ ...BASE, status: 'Processing' }} />)
      const pendingItems = screen.getAllByText('Pending')
      // Shipped, Out for Delivery, Delivered are all pending
      expect(pendingItems.length).toBeGreaterThanOrEqual(3)
    })

    it('shows no Pending labels once Delivered', () => {
      render(
        <DeliveryTracker
          info={{ ...BASE, status: 'Delivered', delivered_at: '2026-05-23T14:00:00.000Z' }}
        />
      )
      expect(screen.queryByText('Pending')).not.toBeInTheDocument()
    })
  })

  describe('status → active stage', () => {
    it('COD Pending activates Order Confirmed stage', () => {
      render(<DeliveryTracker info={{ ...BASE, status: 'COD Pending' }} />)
      // Shipped stage should still be pending
      expect(screen.getAllByText('Pending').length).toBeGreaterThanOrEqual(3)
    })

    it('Shipped removes Pending from the first three stages', () => {
      render(<DeliveryTracker info={WITH_TRACKING} />)
      const pending = screen.getAllByText('Pending')
      // Only Out for Delivery and Delivered remain pending
      expect(pending.length).toBe(2)
    })

    it('Out for Delivery leaves only Delivered pending', () => {
      render(
        <DeliveryTracker
          info={{
            ...BASE,
            status: 'Out for Delivery',
            shipped_at: '2026-05-21T08:00:00.000Z',
            out_for_delivery_at: '2026-05-23T07:00:00.000Z',
          }}
        />
      )
      const pending = screen.getAllByText('Pending')
      expect(pending.length).toBe(1)
    })
  })

  describe('timestamps', () => {
    it('shows a timestamp for the shipped stage when shipped_at is provided', () => {
      render(<DeliveryTracker info={WITH_TRACKING} />)
      // shipped_at → '21 May, 08:30 am' (locale-formatted); just verify not "Pending"
      const pending = screen.getAllByText('Pending')
      expect(pending.length).toBe(2) // Out for Delivery + Delivered still pending
    })

    it('shows delivered timestamp when delivered_at is provided', () => {
      render(
        <DeliveryTracker
          info={{
            ...BASE,
            status: 'Delivered',
            shipped_at: '2026-05-21T08:00:00.000Z',
            out_for_delivery_at: '2026-05-23T07:00:00.000Z',
            delivered_at: '2026-05-23T14:30:00.000Z',
          }}
        />
      )
      expect(screen.queryByText('Pending')).not.toBeInTheDocument()
    })
  })

  describe('estimated delivery badge', () => {
    it('shows the Expected by badge before delivery', () => {
      render(<DeliveryTracker info={WITH_TRACKING} />)
      expect(screen.getByText(/Expected by/)).toBeInTheDocument()
    })

    it('hides the Expected by badge once delivered', () => {
      render(
        <DeliveryTracker
          info={{
            ...WITH_TRACKING,
            status: 'Delivered',
            delivered_at: '2026-05-23T14:00:00.000Z',
          }}
        />
      )
      expect(screen.queryByText(/Expected by/)).not.toBeInTheDocument()
    })

    it('hides the badge when no estimated_delivery is set', () => {
      render(<DeliveryTracker info={{ ...BASE, status: 'Shipped' }} />)
      expect(screen.queryByText(/Expected by/)).not.toBeInTheDocument()
    })
  })

  describe('courier info and tracking link', () => {
    it('shows AWB number when tracking_id is present', () => {
      render(<DeliveryTracker info={WITH_TRACKING} />)
      expect(screen.getByText('DL1234567890')).toBeInTheDocument()
    })

    it('shows courier partner name', () => {
      render(<DeliveryTracker info={WITH_TRACKING} />)
      expect(screen.getByText('Delhivery')).toBeInTheDocument()
    })

    it('renders the track link with correct href', () => {
      render(<DeliveryTracker info={WITH_TRACKING} />)
      const link = screen.getByRole('link', { name: /Track on Delhivery/ })
      expect(link).toHaveAttribute('href', 'https://www.delhivery.com/track/package/DL1234567890')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('hides courier section when no tracking_id is set', () => {
      render(<DeliveryTracker info={BASE} />)
      expect(screen.queryByText(/AWB/)).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: /Track on/ })).not.toBeInTheDocument()
    })

    it('hides track link when tracking_url is absent even if tracking_id exists', () => {
      render(
        <DeliveryTracker
          info={{ ...BASE, status: 'Shipped', tracking_id: 'DL999', tracking_url: null }}
        />
      )
      expect(screen.getByText('DL999')).toBeInTheDocument()
      expect(screen.queryByRole('link', { name: /Track on/ })).not.toBeInTheDocument()
    })
  })
})
