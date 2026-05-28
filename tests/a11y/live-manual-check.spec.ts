import { test, expect } from '@playwright/test'

const pdpUrl = '/products/bakuchiol-renewal-serum'
const manualA11yDescribe =
  process.env.RUN_LIVE_A11Y_MANUAL === '1' ? test.describe : test.describe.skip

// Helper: compute relative luminance from rgb string
function luminance(rgb: string): number {
  const m = rgb.match(/\d+/g)
  if (!m) return 0
  return [0, 1, 2].reduce((acc, i) => {
    const c = parseInt(m[i]) / 255
    return (
      acc +
      (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)) * [0.2126, 0.7152, 0.0722][i]
    )
  }, 0)
}
function contrastRatio(fg: string, bg: string): number {
  const l1 = luminance(fg),
    l2 = luminance(bg)
  const [light, dark] = l1 > l2 ? [l1, l2] : [l2, l1]
  return (light + 0.05) / (dark + 0.05)
}

manualA11yDescribe('A11Y1 — manual live pass', () => {
  test('color contrast: muted meta text (VEGAN/EVIDENCE) on PDP', async ({ page }) => {
    await page.goto(pdpUrl)
    await page.waitForLoadState('networkidle')

    const result = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      let node: Text | null
      const found: Element[] = []
      while ((node = walker.nextNode() as Text | null)) {
        if (/VEGAN|EVIDENCE REVIEW|ORGANIC/i.test(node.data)) {
          const el = node.parentElement
          if (el && found.indexOf(el) === -1) found.push(el)
        }
      }
      return found.map((el) => {
        const s = window.getComputedStyle(el)
        let bg = s.backgroundColor
        // walk up for non-transparent bg
        let cur: Element | null = el
        while (cur && (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent')) {
          cur = cur.parentElement
          if (cur) bg = window.getComputedStyle(cur).backgroundColor
        }
        return {
          text: el.textContent?.trim().slice(0, 60),
          color: s.color,
          bg,
          fontSize: s.fontSize,
          fontWeight: s.fontWeight,
        }
      })
    })

    console.log('Meta text contrast data:', JSON.stringify(result, null, 2))
    for (const r of result) {
      const ratio = contrastRatio(r.color, r.bg)
      const fontSize = parseFloat(r.fontSize)
      const isBold = parseInt(r.fontWeight) >= 700
      // WCAG AA: 4.5:1 normal text, 3:1 large text (18pt/14pt bold)
      const isLarge = fontSize >= 18.67 || (isBold && fontSize >= 14)
      const required = isLarge ? 3 : 4.5
      console.log(
        `  "${r.text}" ratio=${ratio.toFixed(2)} required=${required} fontSize=${r.fontSize} weight=${r.fontWeight}`
      )
      expect(
        ratio,
        `Contrast ratio for "${r.text}" must be ≥ ${required}:1`
      ).toBeGreaterThanOrEqual(required)
    }
  })

  test('color contrast: price on PDP', async ({ page }) => {
    await page.goto(pdpUrl)
    await page.waitForLoadState('networkidle')

    const result = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      let node: Text | null
      const found: {
        color: string
        bg: string
        fontSize: string
        fontWeight: string
        text: string
      }[] = []
      const seen = new Set<string>()
      while ((node = walker.nextNode() as Text | null)) {
        // Skip script/style nodes (RSC payload contains ₹ in serialised JSON)
        const tag = node.parentElement?.tagName?.toUpperCase()
        if (tag === 'SCRIPT' || tag === 'STYLE') continue
        if (/₹\d{3,}/.test(node.data)) {
          const el = node.parentElement
          if (!el) continue
          const s = window.getComputedStyle(el)
          // Skip invisible elements
          if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') continue
          let bg = s.backgroundColor
          let cur: Element | null = el
          while (cur && (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent')) {
            cur = cur.parentElement
            if (cur) bg = window.getComputedStyle(cur).backgroundColor
          }
          const key = `${s.color}|${bg}`
          if (!seen.has(key)) {
            seen.add(key)
            found.push({
              text: node.data.trim().slice(0, 30),
              color: s.color,
              bg,
              fontSize: s.fontSize,
              fontWeight: s.fontWeight,
            })
          }
        }
      }
      return found
    })

    console.log('Price contrast data:', JSON.stringify(result, null, 2))
    for (const r of result) {
      const ratio = contrastRatio(r.color, r.bg)
      const fontSize = parseFloat(r.fontSize)
      const isBold = parseInt(r.fontWeight) >= 700
      const isLarge = fontSize >= 18.67 || (isBold && fontSize >= 14)
      const required = isLarge ? 3 : 4.5
      console.log(`  "${r.text}" ratio=${ratio.toFixed(2)} required=${required}`)
      expect(ratio, `Price contrast ratio must be ≥ ${required}:1`).toBeGreaterThanOrEqual(required)
    }
  })

  test('icon-only buttons have accessible names', async ({ page }) => {
    for (const url of ['/', '/products', pdpUrl]) {
      await page.goto(url)
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(1500) // allow client hydration

      const unnamed = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button, [role="button"]'))
        return btns
          .filter((btn) => {
            const svg = btn.querySelector('svg')
            const visibleText = (btn.textContent?.trim().length ?? 0) === 0
            return svg && visibleText
          })
          .filter((btn) => {
            const label =
              btn.getAttribute('aria-label') ||
              btn.getAttribute('title') ||
              btn.getAttribute('aria-labelledby')
            // aria-labelledby pointing to an element with text is also valid
            if (btn.getAttribute('aria-labelledby')) {
              const target = document.getElementById(btn.getAttribute('aria-labelledby')!)
              return !target || !target.textContent?.trim()
            }
            return !label
          })
          .map((btn) => btn.outerHTML.slice(0, 200))
      })
      if (unnamed.length) {
        console.log(`[${url}] Unnamed icon buttons:`, unnamed)
      }
      expect(unnamed, `[${url}] All icon-only buttons must have accessible names`).toHaveLength(0)
    }
  })

  test('accordion toggles expose aria-expanded on PDP', async ({ page }) => {
    await page.goto(pdpUrl)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1500)

    // Dismiss cookie consent overlay if present — it intercepts pointer events
    const acceptBtn = page
      .locator(
        'button:has-text("Accept"), button:has-text("accept all"), button:has-text("Accept All")'
      )
      .first()
    if (await acceptBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await acceptBtn.click()
      await page.waitForTimeout(400)
    }

    // Filter to visible only — hidden mobile nav also carries aria-expanded
    const expandableButtons = page.locator('button[aria-expanded]').filter({ visible: true })
    const detailsElements = page.locator('details')

    const btnCount = await expandableButtons.count()
    const detailsCount = await detailsElements.count()
    console.log(
      `Visible accordion buttons with aria-expanded: ${btnCount}, <details> elements: ${detailsCount}`
    )

    // Log all visible aria-expanded buttons for visibility
    const allLabels = await expandableButtons.evaluateAll((els) =>
      els.map((e) => ({
        label: e.getAttribute('aria-label') ?? e.textContent?.trim().slice(0, 40),
        expanded: e.getAttribute('aria-expanded'),
        controls: e.getAttribute('aria-controls'),
      }))
    )
    allLabels.forEach((b) =>
      console.log(`  button: expanded="${b.expanded}" controls="${b.controls}" text="${b.label}"`)
    )

    if (btnCount > 0) {
      // Pick first button that has aria-controls (actual accordion, not a menu toggle)
      const accordionBtn = page
        .locator('button[aria-expanded][aria-controls]')
        .filter({ visible: true })
        .first()
      const accCount = await accordionBtn.count()
      const targetBtn = accCount > 0 ? accordionBtn : expandableButtons.first()

      const before = await targetBtn.getAttribute('aria-expanded')
      const controls = await targetBtn.getAttribute('aria-controls')
      console.log(`  Toggling button aria-controls="${controls}" aria-expanded="${before}"`)
      await targetBtn.click()
      await page.waitForTimeout(400)
      const after = await targetBtn.getAttribute('aria-expanded')
      console.log(`  aria-expanded after click: ${after}`)
      expect(before, 'aria-expanded must toggle on click').not.toEqual(after)
    } else if (detailsCount > 0) {
      console.log('  Using native <details>/<summary> — natively accessible ✓')
    } else {
      throw new Error('No accordion elements found with aria-expanded or <details>')
    }
  })

  test('checkout form fields have programmatic labels and aria-describedby', async ({ page }) => {
    await page.goto('/checkout')
    await page.waitForLoadState('networkidle')

    const fieldAudit = await page.evaluate(() => {
      const inputs = Array.from(
        document.querySelectorAll('input:not([type=hidden]), select, textarea')
      )
      return inputs
        .map((el) => {
          const id = el.id
          const label = id
            ? document.querySelector(`label[for="${id}"]`)?.textContent?.trim()
            : null
          const ariaLabel = el.getAttribute('aria-label')
          const ariaLabelledby = el.getAttribute('aria-labelledby')
          const ariaDescribedby = el.getAttribute('aria-describedby')
          const ariaRequired = el.getAttribute('aria-required')
          const type = el.getAttribute('type') ?? el.tagName.toLowerCase()
          if (type === 'submit' || type === 'button' || type === 'reset') return null
          return {
            name: el.getAttribute('name') ?? el.id,
            type,
            hasLabel: !!(label || ariaLabel || ariaLabelledby),
            labelText: label ?? ariaLabel,
            ariaDescribedby,
            ariaRequired,
          }
        })
        .filter(Boolean)
    })

    console.log('Checkout fields:', JSON.stringify(fieldAudit, null, 2))

    const unlabeled = fieldAudit.filter((f) => !f!.hasLabel)
    expect(unlabeled, 'All checkout form fields must have programmatic labels').toHaveLength(0)

    const noDescribedBy = fieldAudit.filter((f) => !f!.ariaDescribedby)
    if (noDescribedBy.length) {
      console.log(
        `  ${noDescribedBy.length} fields without aria-describedby — verify inline error association manually:`
      )
      noDescribedBy.forEach((f) =>
        console.log(`    name="${f!.name}" required="${f!.ariaRequired}"`)
      )
    }

    // Trigger validation to check if error messages appear and are associated
    const submitBtn = page.locator('button[type="submit"], button:has-text("Continue")')
    if ((await submitBtn.count()) > 0) {
      await submitBtn.first().click()
      await page.waitForTimeout(600)

      const errorAssociation = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input:not([type=hidden])'))
        return inputs
          .map((el) => {
            const describedby = el.getAttribute('aria-describedby')
            if (!describedby) return null
            const errorEl = document.getElementById(describedby)
            return {
              name: el.getAttribute('name'),
              describedby,
              errorText: errorEl?.textContent?.trim(),
            }
          })
          .filter(Boolean)
      })
      console.log('Error association after submit:', JSON.stringify(errorAssociation, null, 2))
    }
  })

  test('keyboard focus-visible: tab through product cards and nav', async ({ page }) => {
    await page.goto('/products')
    await page.waitForLoadState('networkidle')

    // Tab through the first 20 focusable elements and check for visible focus
    const noFocusElements: string[] = []

    await page.keyboard.press('Tab') // move off body
    for (let i = 0; i < 20; i++) {
      const focusInfo = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement
        if (!el || el === document.body) return null
        const style = window.getComputedStyle(el)
        // Check outline
        const hasOutline = style.outlineStyle !== 'none' && style.outlineWidth !== '0px'
        // Check box-shadow (common focus-visible impl)
        const hasBoxShadow = style.boxShadow !== 'none'
        // Check custom focus ring via CSS custom properties or classes
        const hasFocusClass =
          el.className?.toString().includes('focus') || el.className?.toString().includes('ring')
        return {
          tag: el.tagName.toLowerCase(),
          text: el.textContent?.trim().slice(0, 30) ?? '',
          ariaLabel: el.getAttribute('aria-label'),
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
          boxShadow: style.boxShadow !== 'none' ? style.boxShadow.slice(0, 40) : 'none',
          hasVisibleFocus: hasOutline || hasBoxShadow || hasFocusClass,
        }
      })
      if (focusInfo && !focusInfo.hasVisibleFocus) {
        noFocusElements.push(
          `<${focusInfo.tag}> "${focusInfo.text || focusInfo.ariaLabel}" outline=${focusInfo.outlineStyle}/${focusInfo.outlineWidth} shadow=${focusInfo.boxShadow}`
        )
      }
      await page.keyboard.press('Tab')
    }

    if (noFocusElements.length) {
      console.log('Elements with no visible focus indicator:')
      noFocusElements.forEach((e) => console.log(' ', e))
    }
    expect(
      noFocusElements,
      'All focusable elements should have visible focus indicator'
    ).toHaveLength(0)
  })
})
