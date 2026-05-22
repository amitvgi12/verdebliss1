'use client'

import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import type { ComponentProps } from 'react'

type SpeedBeforeSendEvent = Parameters<
  NonNullable<ComponentProps<typeof SpeedInsights>['beforeSend']>
>[0]

function stripUrlDetails(event: BeforeSendEvent): BeforeSendEvent {
  try {
    const url = new URL(event.url)
    url.search = ''
    url.hash = ''
    return { ...event, url: url.toString() }
  } catch {
    return event
  }
}

function stripSpeedUrl(event: SpeedBeforeSendEvent): SpeedBeforeSendEvent | null {
  try {
    const url = new URL(event.url)
    url.search = ''
    url.hash = ''
    return { ...event, url: url.toString() }
  } catch {
    return event
  }
}

export default function VercelInsights() {
  return (
    <>
      <Analytics beforeSend={stripUrlDetails} />
      <SpeedInsights beforeSend={stripSpeedUrl} />
    </>
  )
}
