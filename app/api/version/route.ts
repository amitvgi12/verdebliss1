import { NextResponse } from 'next/server'
import pkg from '@/package.json'
import { getEnvironmentCapabilities } from '@/lib/runtime-env'
import { BUSINESS_COMPLIANCE, validateBusinessCompliance } from '@/constants/businessCompliance'

export async function GET() {
  const environment = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development'
  const isProduction = environment === 'production'
  const compliance = validateBusinessCompliance(BUSINESS_COMPLIANCE, { strict: isProduction })

  return NextResponse.json({
    name: pkg.name,
    version: pkg.version,
    gitSha: getPublicRevision(isProduction),
    environment,
    builtAt: process.env.NEXT_PUBLIC_BUILD_TIME ?? 'unknown',
    deployedAt:
      process.env.VERCEL_DEPLOYMENT_CREATED_AT ?? process.env.NEXT_PUBLIC_BUILD_TIME ?? 'unknown',
    schemaVersion: '2026-05-audit-remediated-v3',
    capabilities: getEnvironmentCapabilities(),
    compliance: {
      ok: compliance.ok,
      errorCount: compliance.errors.length,
      failingFields: compliance.errors.map(toPublicComplianceField),
    },
  })
}

function getPublicRevision(isProduction: boolean): string {
  if (isProduction && process.env.EXPOSE_BUILD_METADATA !== 'true') return 'redacted'

  const sha =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.NEXT_PUBLIC_BUILD_SHA ??
    process.env.NEXT_PUBLIC_GIT_SHA
  if (!sha) return 'local'
  return sha.slice(0, 12)
}

function toPublicComplianceField(error: string): string {
  const normalized = error.toLowerCase()

  if (error.startsWith('BUSINESS_COMPLIANCE.')) return error.split(' ')[0]
  if (error.startsWith('NEXT_PUBLIC_VERDEBLISS_')) return error.split(' ')[0]
  if (
    normalized.includes('grievanceofficer.name') ||
    normalized.includes('grievance officer name')
  ) {
    return 'NEXT_PUBLIC_VERDEBLISS_GRIEVANCE_OFFICER_NAME'
  }
  if (error.includes('CIN')) return 'NEXT_PUBLIC_VERDEBLISS_CIN'
  if (error.includes('GSTIN')) return 'NEXT_PUBLIC_VERDEBLISS_GSTIN'
  if (normalized.includes('phone')) return 'NEXT_PUBLIC_VERDEBLISS_SUPPORT_PHONE'
  if (normalized.includes('email')) return 'NEXT_PUBLIC_VERDEBLISS_EMAIL'
  return 'BUSINESS_COMPLIANCE'
}
