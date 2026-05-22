'use client'

import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

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

export default function VercelInsights() {
  return (
    <>
      <Analytics beforeSend={stripUrlDetails} />
      <SpeedInsights />
    </>
  )
}
