import { NextResponse } from 'next/server'
import pkg from '@/package.json'
import { getEnvironmentCapabilities } from '@/lib/runtime-env'

export async function GET() {
  return NextResponse.json({
    name: pkg.name,
    version: pkg.version,
    gitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.NEXT_PUBLIC_GIT_SHA ?? 'local',
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
    builtAt: process.env.NEXT_PUBLIC_BUILD_TIME ?? 'unknown',
    schemaVersion: '2026-05-audit-remediated-v2',
    capabilities: getEnvironmentCapabilities(),
  })
}
