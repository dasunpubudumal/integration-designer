---
name: verify-in-browser
description: Check a UI change in the Integration Designer in a real (headless) browser with Playwright, by building, serving and scripting the app, then reading screenshots. Use after changing layout, styling, the canvas, dropdowns or anything jsdom tests can't see, or when the user reports something looks or behaves wrong.
---

# Verify in a browser

jsdom tests can't see layout, sizes, scrolling, focus rings or how things look. For those, drive the built app with Playwright and look at screenshots.

## 1. Build and serve

```bash
npm run build
npx vite preview --port 4789 &      # a spare port, so it doesn't clash with npm run dev on 3000
```

Stop it afterwards with `pkill -f "vite preview --port 4789"`.

## 2. Get Playwright (outside the repo)

Playwright isn't a project dependency. Install it in the session's scratchpad, not the repo:

```bash
cd <scratchpad> && npm i playwright && npx playwright install chromium
```

If a matching browser is already in `~/Library/Caches/ms-playwright` (or `~/.cache/ms-playwright`) but the version differs, pass its path as `executablePath` to `chromium.launch()` instead of downloading.

## 3. Script it

Write the script in the scratchpad. Start from the example data and use the same selectors the app's tests use:

```js
import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
const errors = []
page.on('pageerror', e => errors.push(e.message))
page.on('dialog', d => d.accept())                       // Load Example / delete confirmations
await page.goto('http://localhost:4789')
await page.getByRole('button', { name: 'Load Example' }).click()
await page.locator('.step-card').nth(1).click()
const field = label => page.locator('.editor .form-group', { has: page.locator('label', { hasText: new RegExp(`^${label}$`) }) })
await field('Input Expression').locator('textarea').fill('step.x')
await page.screenshot({ path: '<scratchpad>/after.png' })
console.log('errors:', errors)
await browser.close()
```

Useful selectors: `.canvas-viewport` (zoom/pan area), `.flow-meta-row` (fixed header), `.zoom-reset`, `.select-trigger`, `.select-option` (teleported to `<body>`), `.tab-btn` (YAML/JSON), `.output-pre`.

Things to know:

- An open dropdown covers what's under it. Press Escape first, or use `locator.dispatchEvent('click')` for a click that shouldn't close it.
- Real wheel zoom: `page.mouse.move(x, y)` then `page.mouse.wheel(0, -150)`.
- Drag: `page.mouse.down()`, `move(..., { steps: 5 })`, `up()`.

## 4. Look, then report

Read every screenshot. Check alignment, clipping, overflow and focus states, not just that the script ran. Report what you checked and what you saw, including anything that looks off even if it's outside the change. Delete scratch screenshots; never commit them (README screenshots are separate: see `update-screenshots`).
