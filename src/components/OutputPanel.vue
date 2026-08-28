<template>
  <div class="output-panel" :class="{ collapsed: isCollapsed }">
    <!-- Toggle bar -->
    <div class="output-toggle-bar" @click="isCollapsed = !isCollapsed">
      <span class="output-toggle-icon">{{ isCollapsed ? '▲' : '▼' }}</span>
      <span class="output-toggle-label">Output</span>
      <div class="output-panel-controls" v-if="!isCollapsed" @click.stop>
        <div class="output-tabs">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'yaml' }"
            @click="activeTab = 'yaml'"
          >YAML</button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'json' }"
            @click="activeTab = 'json'"
          >JSON</button>
        </div>
        <div class="output-actions">
          <button class="btn btn-ghost btn-sm" @click="handleCopy" :title="copyStatus">
            {{ copyStatus === 'Copied!' ? '✓ Copied!' : 'Copy' }}
          </button>
          <button class="btn btn-ghost btn-sm" @click="handleDownloadYaml">&#8595; YAML</button>
          <button class="btn btn-ghost btn-sm" @click="handleDownloadJson">&#8595; JSON</button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div v-if="!isCollapsed" class="output-content">
      <pre class="output-pre"><code v-html="highlightedOutput"></code></pre>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useFlowStore } from '../stores/flows'
import { generateYaml, generateJson } from '../utils/generator'

const store = useFlowStore()
const isCollapsed = ref(false)
const activeTab = ref('yaml')
const copyStatus = ref('Copy')

const yamlOutput = computed(() => generateYaml(store.flows, store.configFileName))
const jsonOutput = computed(() => generateJson(store.configs))

const rawOutput = computed(() => activeTab.value === 'yaml' ? yamlOutput.value : jsonOutput.value)

const highlightedOutput = computed(() => {
  const text = rawOutput.value
  if (activeTab.value === 'yaml') {
    return highlightYaml(text)
  } else {
    return highlightJson(text)
  }
})

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function highlightYaml(text) {
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

function highlightJson(text) {
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

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(rawOutput.value)
    copyStatus.value = 'Copied!'
    setTimeout(() => { copyStatus.value = 'Copy' }, 2000)
  } catch (e) {
    // Fallback
    const el = document.createElement('textarea')
    el.value = rawOutput.value
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    copyStatus.value = 'Copied!'
    setTimeout(() => { copyStatus.value = 'Copy' }, 2000)
  }
}

function handleDownloadYaml() {
  downloadFile(yamlOutput.value, 'study-papi-config.yaml', 'text/yaml')
}

function handleDownloadJson() {
  const name = store.configFileName || 'papi_config.json'
  downloadFile(jsonOutput.value, name, 'application/json')
}

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.output-panel {
  flex-shrink: 0;
  border-top: 1px solid var(--border);
  background: var(--surface);
  display: flex;
  flex-direction: column;
  max-height: 320px;
  transition: max-height 0.2s ease;
}

.output-panel.collapsed {
  max-height: 36px;
}

.output-toggle-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  height: 36px;
  cursor: pointer;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  user-select: none;
}

.output-toggle-bar:hover {
  background: var(--surface2);
}

.output-toggle-icon {
  font-size: 10px;
  color: var(--text-muted);
}

.output-toggle-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-muted);
}

.output-panel-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.output-tabs {
  display: flex;
  gap: 2px;
}

.tab-btn {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-muted);
  cursor: pointer;
  padding: 2px 10px;
  font-size: 11px;
  font-weight: 600;
  transition: background 0.12s, color 0.12s;
}

.tab-btn.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.tab-btn:hover:not(.active) {
  background: var(--surface2);
  color: var(--text);
}

.output-actions {
  display: flex;
  gap: 4px;
}

.output-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
}

.output-pre {
  margin: 0;
  padding: 12px 16px;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.6;
  color: var(--text);
  white-space: pre;
  tab-size: 2;
}

/* Syntax highlighting */
:deep(.hl-key)     { color: #93c5fd; }
:deep(.hl-string)  { color: #86efac; }
:deep(.hl-value)   { color: #fde68a; }
:deep(.hl-number)  { color: #fb923c; }
:deep(.hl-bool)    { color: #f9a8d4; }
:deep(.hl-null)    { color: #94a3b8; font-style: italic; }
:deep(.hl-comment) { color: #64748b; font-style: italic; }
:deep(.hl-dash)    { color: #a78bfa; }
</style>
