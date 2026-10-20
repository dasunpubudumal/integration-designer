import { describe, it, expect } from 'vitest'
import { escapeHtml, highlightYaml, highlightJson } from '../../src/utils/highlight'

// The highlighted output is rendered with v-html, so user text must never
// come through as markup
describe('escaping', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml('<b>&</b>')).toBe('&lt;b&gt;&amp;&lt;/b&gt;')
  })

  it('escapes user values in YAML and JSON output', () => {
    expect(highlightYaml('name: <img src=x onerror=alert(1)>')).not.toContain('<img')
    expect(highlightJson('{"name": "<script>alert(1)</script>"}')).not.toContain('<script>')
  })
})

describe('highlightYaml', () => {
  it('marks keys and values', () => {
    expect(highlightYaml('path: /studies')).toBe('<span class="hl-key">path</span>: <span class="hl-value">/studies</span>')
  })

  it('marks comments, list dashes, numbers, booleans and null', () => {
    expect(highlightYaml('# note')).toBe('<span class="hl-comment"># note</span>')
    expect(highlightYaml('  - item')).toContain('<span class="hl-dash">-</span>')
    expect(highlightYaml('retries: 3')).toContain('<span class="hl-number">3</span>')
    expect(highlightYaml('on: true')).toContain('<span class="hl-bool">true</span>')
    expect(highlightYaml('x: null')).toContain('<span class="hl-null">null</span>')
  })

  it('keeps line structure', () => {
    expect(highlightYaml('a: 1\nb: 2').split('\n')).toHaveLength(2)
  })
})

describe('highlightJson', () => {
  it('marks keys, strings and numbers', () => {
    const html = highlightJson('{"name": "x", "max_retries": 2}')
    expect(html).toContain('<span class="hl-key">"name"</span>')
    expect(html).toContain('<span class="hl-string">"x"</span>')
    expect(html).toContain('<span class="hl-number">2</span>')
  })
})
