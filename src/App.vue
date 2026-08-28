<template>
  <div class="app-shell">
    <!-- Top Bar -->
    <header class="topbar">
      <div class="topbar-left">
        <span class="topbar-logo">&#11042; Integration Designer</span>
        <label class="filename-label">
          Config file:
          <input
            class="filename-input"
            v-model="store.configFileName"
            placeholder="papi_config.json"
            spellcheck="false"
          />
        </label>
      </div>
      <div class="topbar-right">
        <button class="btn btn-secondary" @click="handleLoadExample">Load Example</button>
        <button class="btn btn-secondary" @click="handleClearAll">Clear All</button>
        <button class="btn btn-primary" @click="handleDownloadYaml">Download YAML</button>
        <button class="btn btn-primary" @click="handleDownloadJson">Download JSON</button>
      </div>
    </header>

    <!-- Three-column main layout -->
    <div class="main-layout">
      <FlowSidebar class="sidebar" />
      <FlowCanvas class="canvas" />
      <EditorPanel class="editor" />
    </div>

    <!-- Collapsible output panel -->
    <OutputPanel />
  </div>
</template>

<script setup>
import { useFlowStore } from './stores/flows'
import { generateYaml, generateJson } from './utils/generator'
import FlowSidebar from './components/FlowSidebar.vue'
import FlowCanvas from './components/FlowCanvas.vue'
import EditorPanel from './components/EditorPanel.vue'
import OutputPanel from './components/OutputPanel.vue'

const store = useFlowStore()

function handleLoadExample() {
  if (store.flows.length > 0) {
    if (!confirm('This will replace all current flows. Continue?')) return
  }
  store.loadExample()
}

function handleClearAll() {
  if (!confirm('Clear all flows and configs?')) return
  store.clearAll()
}

function handleDownloadYaml() {
  const yaml = generateYaml(store.flows, store.configFileName)
  downloadFile(yaml, 'study-papi-config.yaml', 'text/yaml')
}

function handleDownloadJson() {
  const json = generateJson(store.configs)
  const name = store.configFileName || 'papi_config.json'
  downloadFile(json, name, 'application/json')
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

<style>
/* ── CSS Variables (dark theme) ───────────────────────────────────────────── */
:root {
  --bg: #0f0f1a;
  --surface: #1a1a2e;
  --surface2: #252540;
  --surface3: #2d2d4e;
  --border: #3d3d5c;
  --text: #e2e8f0;
  --text-muted: #94a3b8;
  --accent: #6366f1;
  --blue: #3b82f6;
  --green: #10b981;
  --amber: #f59e0b;
  --red: #ef4444;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
}

/* ── Reset ───────────────────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body, #app {
  height: 100%;
  overflow: hidden;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  line-height: 1.5;
}

/* ── Scrollbar ───────────────────────────────────────────────────────────── */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--accent); }

/* ── Shell ───────────────────────────────────────────────────────────────── */
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* ── Top Bar ─────────────────────────────────────────────────────────────── */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  z-index: 10;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.topbar-logo {
  font-size: 15px;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: 0.02em;
}

.filename-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 12px;
}

.filename-input {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text);
  padding: 3px 8px;
  font-size: 12px;
  width: 200px;
  outline: none;
}
.filename-input:focus { border-color: var(--accent); }

.topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ── Buttons ─────────────────────────────────────────────────────────────── */
.btn {
  padding: 5px 12px;
  border-radius: 5px;
  border: 1px solid transparent;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: background 0.15s, border-color 0.15s;
  white-space: nowrap;
}

.btn-primary {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}
.btn-primary:hover { background: #4f52d9; }

.btn-secondary {
  background: var(--surface2);
  color: var(--text);
  border-color: var(--border);
}
.btn-secondary:hover { background: var(--surface3); border-color: var(--accent); }

.btn-danger {
  background: transparent;
  color: var(--red);
  border-color: var(--red);
}
.btn-danger:hover { background: var(--red); color: #fff; }

.btn-ghost {
  background: transparent;
  color: var(--text-muted);
  border-color: transparent;
  padding: 3px 8px;
}
.btn-ghost:hover { color: var(--text); background: var(--surface3); }

.btn-sm {
  padding: 2px 8px;
  font-size: 11px;
}

/* ── Main Layout ─────────────────────────────────────────────────────────── */
.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.sidebar {
  width: 250px;
  flex-shrink: 0;
  border-right: 1px solid var(--border);
  overflow-y: auto;
  background: var(--surface);
}

.canvas {
  flex: 1;
  overflow-y: auto;
  background: var(--bg);
  padding: 24px;
  min-width: 0;
}

.editor {
  width: 380px;
  flex-shrink: 0;
  border-left: 1px solid var(--border);
  overflow-y: auto;
  background: var(--surface);
}

/* ── Form Elements (global) ──────────────────────────────────────────────── */
input, textarea, select {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text);
  padding: 5px 8px;
  font-size: 12px;
  font-family: inherit;
  outline: none;
  width: 100%;
}
input:focus, textarea:focus, select:focus {
  border-color: var(--accent);
}
select option { background: var(--surface2); }

textarea { resize: vertical; min-height: 60px; font-family: var(--font-mono); }

label {
  display: block;
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 3px;
  font-weight: 500;
}

.form-group {
  margin-bottom: 12px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

/* ── Section Header ──────────────────────────────────────────────────────── */
.section-header {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 12px 16px 6px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 12px;
}

/* ── Method badges ───────────────────────────────────────────────────────── */
.badge {
  display: inline-block;
  padding: 1px 7px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
}
.badge-GET    { background: rgba(59,130,246,0.2); color: var(--blue); }
.badge-POST   { background: rgba(16,185,129,0.2); color: var(--green); }
.badge-PUT    { background: rgba(245,158,11,0.2); color: var(--amber); }
.badge-DELETE { background: rgba(239,68,68,0.2);  color: var(--red); }
.badge-PATCH  { background: rgba(99,102,241,0.2); color: var(--accent); }

/* ── Utility ─────────────────────────────────────────────────────────────── */
.mono { font-family: var(--font-mono); font-size: 11px; }
.truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
