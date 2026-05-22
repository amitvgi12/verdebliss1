import { NextResponse } from 'next/server'
import pkg from '@/package.json'
import { getEnvironmentCapabilities } from '@/lib/runtime-env'

export async function GET() {
  const environment = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development'
  const isProduction = environment === 'production'

  return NextResponse.json({
    name: pkg.name,
    version: pkg.version,
    gitSha: getPublicRevision(isProduction),
    environment,
    builtAt: process.env.NEXT_PUBLIC_BUILD_TIME ?? 'unknown',
    deployedAt:
      process.env.VERCEL_DEPLOYMENT_CREATED_AT ?? process.env.NEXT_PUBLIC_BUILD_TIME ?? 'unknown',
    schemaVersion: '2026-05-audit-remediated-v2',
    capabilities: getEnvironmentCapabilities(),
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
