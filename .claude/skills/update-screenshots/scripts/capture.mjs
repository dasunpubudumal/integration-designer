import { chromium } from 'playwright'
// Usage: node capture.mjs [outDir] [baseUrl]
// Needs the app served (npm run build && npx vite preview --port 4789) and Playwright installed.
// Set CHROMIUM_PATH to reuse an already-installed Chromium binary.
const OUT = process.argv[2] || 'docs/screenshots'
const BASE_URL = process.argv[3] || 'http://localhost:4789'
const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
const page = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
const errors = []
page.on('pageerror', e => errors.push(e.message))
page.on('dialog', d => d.accept())
await page.goto(BASE_URL)
await page.getByRole('button', { name: 'Load Example' }).click()
const wait = ms => page.waitForTimeout(ms)
const field = label => page.locator('.editor .form-group', { has: page.locator('label', { hasText: new RegExp('^' + label + '$') }) })
const pick = async (label, opt) => {
  await field(label).locator('.select-trigger').click(); await wait(150)
  await page.locator('.select-option', { hasText: opt }).first().click(); await wait(150)
}
const closeMenus = () => page.keyboard.press('Escape')
// Screenshot just the Config section of the editor
const shootConfig = async path => {
  await page.evaluate(() => document.activeElement?.blur())
  await wait(150)
  const top = await page.locator('.editor .section-header', { hasText: 'Config' }).last().boundingBox()
  const del = await page.locator('.editor .config-actions').boundingBox()
  await page.screenshot({ path, clip: { x: top.x, y: top.y, width: top.width, height: del.y + del.height + 20 - top.y } })
}

// List flows to pick the richest one (most steps)
const flowItems = page.locator('.flow-item')
let best = 0, bestCount = 0
for (let i = 0; i < await flowItems.count(); i++) {
  await flowItems.nth(i).click(); await wait(100)
  const n = await page.locator('.step-card').count()
  if (n > bestCount) { best = i; bestCount = n }
}
console.log('flows:', await flowItems.count(), 'richest:', best, 'steps:', bestCount)

// 1. Overview: simple flow, a step selected
await flowItems.nth(0).click(); await wait(100)
await page.locator('.step-card').nth(1).click(); await wait(200)
await page.screenshot({ path: OUT + '/overview.png' })

// 2. Branching flow on the canvas (wider window so branch labels fit)
await page.setViewportSize({ width: 1920, height: 1080 }); await wait(200)
await flowItems.nth(best).click(); await wait(200)
await page.locator('.step-card').nth(1).click(); await wait(200)
await page.locator('.canvas-viewport').evaluate(el => { el.scrollTop = 0; el.scrollLeft = 0 })
await wait(100)
await page.locator('.canvas').screenshot({ path: OUT + '/canvas-branching.png' })

await page.setViewportSize({ width: 1440, height: 900 }); await wait(200)

// 3. Step editor with the type dropdown open
await flowItems.nth(0).click(); await wait(100)
await page.locator('.step-card').nth(1).click(); await wait(200)
await page.locator('.editor').evaluate(el => el.scrollTop = 0)
await field('Type').locator('.select-trigger').click(); await wait(250)
const ed = await page.locator('.editor').boundingBox()
await page.screenshot({ path: OUT + '/step-editor.png', clip: { x: ed.x, y: ed.y, width: ed.width, height: 470 } })
await closeMenus()

// 4. SNS Publish config form (taller window so the whole form shows)
await page.setViewportSize({ width: 1440, height: 1500 }); await wait(200)
await page.getByRole('button', { name: '+ Add Step' }).click(); await wait(200)
await field('Step ID').locator('input').fill('publish_study_event')
await field('Processor').locator('input').fill('ipaas_framework.operate.sns.sns_connector.SNSConnector'); await closeMenus()
await page.getByRole('button', { name: '+ New Config' }).click(); await wait(200)
await page.keyboard.type('post_publish_study_xapi_operate'); await closeMenus()
await field('Name').locator('input').fill('sns_publish_study_post_xapi_topic')
await field('Max Retries').locator('input').fill('2')
await field('Topic ARN').locator('input').fill('env:POST_STUDY_SNS_TOPIC_ARN')
await page.getByRole('button', { name: '+ Attribute' }).click(); await wait(100)
await page.locator('.editor input[placeholder="attribute name"]').fill('messageVersion')
await field('Path').locator('input').fill('messageVersion')
await field('Default').locator('input').fill('v1.0.0')
await page.locator('.editor .section-header', { hasText: 'Config' }).last().evaluate(el => el.scrollIntoView({ block: 'start' })); await wait(200)
await shootConfig(OUT + '/config-sns.png')

// 5. JSON output for that config (taller output panel)
await page.setViewportSize({ width: 1440, height: 900 }); await wait(200)
const handle = await page.locator('.output-resize-handle').boundingBox()
await page.mouse.move(handle.x + 200, handle.y + 2); await page.mouse.down()
await page.mouse.move(handle.x + 200, handle.y - 180, { steps: 5 }); await page.mouse.up(); await wait(150)
await page.locator('.tab-btn', { hasText: 'JSON' }).click(); await wait(150)
await page.locator('.output-pre').evaluate(el => {
  const c = el.closest('.output-content'); const t = el.innerText
  const lines = t.split('\n'); const i = lines.findIndex(l => l.includes('post_publish_study_xapi_operate'))
  c.scrollTop = Math.max(0, i * 19.2 - 8)
})
await wait(150)
await page.locator('.output-panel').screenshot({ path: OUT + '/output-json.png' })

// 6. Schema validation form
await page.setViewportSize({ width: 1440, height: 1500 }); await wait(200)
await page.locator('.step-card').first().click(); await wait(150)
await page.getByRole('button', { name: '+ New Config' }).click(); await wait(200)
await page.keyboard.type('post_studies_xapi_validator'); await closeMenus()
await pick('Config Type', 'Schema Validation')
await field('Name').locator('input').fill('study-schema')
await field('Spec S3 URI').locator('input').fill('http://schema-registry.sanger.ac.uk/v1/')
await field('Spec \\(JSON Schema\\)').locator('textarea').fill(JSON.stringify({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'StudyObject',
  type: 'object',
  properties: { name: { type: 'string', minLength: 1 }, data_release_strategy: { type: 'string', enum: ['open', 'managed', 'not applicable'] } },
  required: ['name', 'data_release_strategy']
}, null, 2))
await page.locator('.editor textarea').last().evaluate(el => { el.scrollTop = 0; el.rows = 14 })
await page.locator('.editor .section-header', { hasText: 'Config' }).last().evaluate(el => el.scrollIntoView({ block: 'start' })); await wait(200)
await shootConfig(OUT + '/config-schema.png')

console.log(errors.length ? 'Page errors: ' + errors.join('; ') : 'No page errors')
if (errors.length) process.exitCode = 1
await b.close()
