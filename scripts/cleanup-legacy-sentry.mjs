import { rm } from 'node:fs/promises'

/**
 * Legacy cleanup for deployments that copy this package over an older checkout.
 *
 * Earlier builds used Sentry config files at the repository root. The current
 * production package intentionally does not depend on `@sentry/nextjs`, because
 * that SDK caused Next build-trace instability in this app. Next.js will still
 * auto-compile stale `sentry.*.config.ts` files if they remain in the working
 * tree, which fails the build with "Cannot find module '@sentry/nextjs'".
 *
 * Running this before `next build` makes the build deterministic even when an
 * old deployment directory contains orphan Sentry config files.
 */
const legacyFiles = [
  'sentry.edge.config.ts',
  'sentry.edge.config.js',
  'sentry.server.config.ts',
  'sentry.server.config.js',
  'sentry.client.config.ts',
  'sentry.client.config.js',
]

await Promise.all(
  legacyFiles.map(async (file) => {
    try {
      await rm(file, { force: true })
    } catch {
      // `force: true` already ignores missing files; this catch protects builds
      // on unusual filesystems where deletion can race with another process.
    }
  })
)
