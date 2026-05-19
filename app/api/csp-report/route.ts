import { NextResponse } from 'next/server'
import { reportError } from '@/lib/observability'

export const dynamic = 'force-dynamic'

const MAX_REPORT_BYTES = 20_000
const MAX_REPORTS = 10

const CSP_REPORT_KEYS = new Set([
  'blocked-uri',
  'body',
  'column-number',
  'disposition',
  'document-uri',
  'effective-directive',
  'line-number',
  'original-policy',
  'referrer',
  'script-sample',
  'source-file',
  'status-code',
  'type',
  'url',
  'violated-directive',
])

export async function POST(request: Request) {
  try {
    const raw = await request.text()
    if (raw.length > MAX_REPORT_BYTES) {
      reportError('csp_report_rejected', { reason: 'payload_too_large', bytes: raw.length })
      return new NextResponse(null, { status: 204 })
    }

    const payload = raw ? (JSON.parse(raw) as unknown) : null
    const reports = normalizeReports(payload)

    reportError('csp_violation', {
      reports,
      userAgent: request.headers.get('user-agent') ?? null,
    })
  } catch (error) {
    reportError('csp_report_parse_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
  }

  // Keep the endpoint fire-and-forget so browsers do not retry noisy reports.
  return new NextResponse(null, { status: 204 })
}

export function normalizeReports(payload: unknown): unknown[] {
  const reports = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && 'csp-report' in payload
      ? [(payload as Record<string, unknown>)['csp-report']]
      : [payload]

  return reports.slice(0, MAX_REPORTS).map(sanitizeReport)
}

function sanitizeReport(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value

  const source = value as Record<string, unknown>
  const sanitized: Record<string, unknown> = {}

  for (const [key, raw] of Object.entries(source)) {
    if (!CSP_REPORT_KEYS.has(key)) continue

    if (key === 'body' && raw && typeof raw === 'object') {
      sanitized.body = sanitizeReport(raw)
      continue
    }

    sanitized[key] = sanitizeValue(raw)
  }

  return sanitized
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value !== 'string') return value
  return value.length > 500 ? `${value.slice(0, 500)}...` : value
}
