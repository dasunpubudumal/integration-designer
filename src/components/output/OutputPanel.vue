<template>
  <div class="output-panel" :class="{ collapsed: isCollapsed }" :style="!isCollapsed ? { height: panelHeight + 'px' } : {}">
    <!-- Resize handle -->
    <div v-if="!isCollapsed" class="output-resize-handle" @mousedown.prevent="startResize"></div>
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
          <button class="btn btn-ghost btn-sm" @click="downloadYaml">&#8595; YAML</button>
          <button class="btn btn-ghost btn-sm" @click="downloadJson">&#8595; JSON</button>
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
import { useGeneratedFiles } from '../../composables/useGeneratedFiles'
import { highlightYaml, highlightJson } from '../../utils/highlight'

const { yaml, json, downloadYaml, downloadJson } = useGeneratedFiles()

const isCollapsed = ref(false)
const activeTab = ref('yaml')
const copyStatus = ref('Copy')
const panelHeight = ref(320)

const rawOutput = computed(() => (activeTab.value === 'yaml' ? yaml.value : json.value))
const highlightedOutput = computed(() =>
  activeTab.value === 'yaml' ? highlightYaml(rawOutput.value) : highlightJson(rawOutput.value)
)

// Drag the top edge to resize
function startResize(e) {
  const startY = e.clientY
  const startHeight = panelHeight.value

  function onMove(e) {
    const delta = startY - e.clientY
    panelHeight.value = Math.max(80, Math.min(window.innerHeight - 100, startHeight + delta))
  }

  function onUp() {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(rawOutput.value)
  } catch {
    // Fallback for browsers without clipboard access
    const el = document.createElement('textarea')
    el.value = rawOutput.value
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
  copyStatus.value = 'Copied!'
  setTimeout(() => { copyStatus.value = 'Copy' }, 2000)
}
</script>

<style scoped>
.output-panel {
  flex-shrink: 0;
  border-top: 1px solid var(--border);
  background: var(--surface);
  display: flex;
  flex-direction: column;
}

.output-panel.collapsed {
  height: 36px !important;
}

.output-resize-handle {
  height: 5px;
  cursor: ns-resize;
  flex-shrink: 0;
  background: transparent;
  transition: background 0.15s;
}

.output-resize-handle:hover {
  background: var(--accent);
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
