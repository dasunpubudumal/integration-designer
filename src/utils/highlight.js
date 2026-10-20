// Minimal syntax highlighting for the Output panel. Input is escaped first,
// so the returned HTML is safe to render with v-html.

export function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function highlightYaml(text) {
  const lines = text.split('\n')
  return lines.map(line => {
    const esc = escapeHtml(line)

    // Comment
    if (/^\s*#/.test(line)) {
      return `<span class="hl-comment">${esc}</span>`
    }

    // Key: value
    const keyMatch = esc.match(/^(\s*)([\w\-\/\.]+)(\s*:)(\s*)(.*)$/)
    if (keyMatch) {
      const indent = keyMatch[1]
      const key = keyMatch[2]
      const colon = keyMatch[3]
      const space = keyMatch[4]
      let value = keyMatch[5]

      // Color value
      if (value === 'null') {
        value = `<span class="hl-null">${value}</span>`
      } else if (value === 'true' || value === 'false') {
        value = `<span class="hl-bool">${value}</span>`
      } else if (/^[\d.]+$/.test(value)) {
        value = `<span class="hl-number">${value}</span>`
      } else if (value.startsWith('"') || value.startsWith("'")) {
        value = `<span class="hl-string">${value}</span>`
      } else if (value.length > 0) {
        value = `<span class="hl-value">${value}</span>`
      }

      return `${indent}<span class="hl-key">${key}</span>${colon}${space}${value}`
    }

    // Array item (- ...)
    const arrMatch = esc.match(/^(\s*)(-)(\s*)(.*)$/)
    if (arrMatch) {
      const indent = arrMatch[1]
      const dash = arrMatch[2]
      const space = arrMatch[3]
      const rest = arrMatch[4]
      return `${indent}<span class="hl-dash">${dash}</span>${space}${rest}`
    }

    return esc
  }).join('\n')
}

export function highlightJson(text) {
  const esc = escapeHtml(text)
  return esc
    // Keys
    .replace(/"([^"]+)"(\s*:)/g, '<span class="hl-key">"$1"</span>$2')
    // String values
    .replace(/:\s*"([^"]*)"/g, (m, v) => `: <span class="hl-string">"${v}"</span>`)
    // Numbers
    .replace(/:\s*(\d+)/g, (m, v) => `: <span class="hl-number">${v}</span>`)
    // Booleans / null
    .replace(/:\s*(true|false|null)/g, (m, v) => `: <span class="hl-${v === 'null' ? 'null' : 'bool'}">${v}</span>`)
}
