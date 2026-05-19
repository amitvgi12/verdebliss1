import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const fallbackModified = '2026-04-01T00:00:00.000Z'

const staticRoutes = [
  '',
  '/products',
  '/quiz',
  '/ingredients',
  '/our-story',
  '/sustainability',
  '/blog',
  '/faq',
  '/contact',
  '/press',
  '/privacy-policy',
  '/terms',
  '/cookie-policy',
  '/returns-refunds',
  '/shipping-policy',
]

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')
const outputPath = join(projectRoot, 'app', 'route-modified.json')

function routePagePath(route) {
  return route === '' ? 'app/page.tsx' : `app${route}/page.tsx`
}

function lastCommittedIso(filePath) {
  try {
    const value = execFileSync('git', ['log', '-1', '--format=%cI', '--', filePath], {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()

    return value || fallbackModified
  } catch {
    return fallbackModified
  }
}

const routeModified = Object.fromEntries(
  staticRoutes.map((route) => [route, lastCommittedIso(routePagePath(route))])
)

mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, `${JSON.stringify(routeModified, null, 2)}\n`)
