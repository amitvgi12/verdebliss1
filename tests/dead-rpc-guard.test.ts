import { describe, expect, it } from 'vitest'
import { readFileSync, globSync } from 'fs'
import path from 'path'

// D1: reserve_inventory_for_order is intentionally dead. finalize_commerce_order
// handles all stock mutation. A second caller would double-decrement stock.
describe('dead RPC guard', () => {
  it('reserve_inventory_for_order is never called from app or lib code', () => {
    const root = path.resolve(__dirname, '..')
    const srcDirs = ['app', 'lib', 'components']
    const files = srcDirs.flatMap((dir) => globSync(`${dir}/**/*.{ts,tsx}`, { cwd: root }))

    const callers = files.filter((f) => {
      const src = readFileSync(path.join(root, f), 'utf8')
      return src.includes('reserve_inventory_for_order')
    })

    expect(callers).toEqual([])
  })
})
