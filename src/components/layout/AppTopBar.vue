<template>
  <header class="topbar">
    <div class="topbar-left">
      <span class="topbar-logo">&#11042; Switchyard</span>
      <label class="filename-label">
        Config file:
        <input
          class="filename-input"
          v-model="store.configFileName"
          :placeholder="DEFAULT_JSON_FILE_NAME"
          spellcheck="false"
        />
      </label>
    </div>
    <div class="topbar-right">
      <button class="btn btn-secondary" @click="loadExample">Load Example</button>
      <button class="btn btn-secondary" @click="clearAll">Clear All</button>
      <button class="btn btn-primary" @click="downloadYaml">Download YAML</button>
      <button class="btn btn-primary" @click="downloadJson">Download JSON</button>
    </div>
  </header>
</template>

<script setup>
import { useFlowStore } from '../../stores/flows'
import { useGeneratedFiles, DEFAULT_JSON_FILE_NAME } from '../../composables/useGeneratedFiles'

const store = useFlowStore()
const { downloadYaml, downloadJson } = useGeneratedFiles()

function loadExample() {
  if (store.flows.length > 0 && !confirm('This will replace all current flows. Continue?')) return
  store.loadExample()
}

function clearAll() {
  if (!confirm('Clear all flows and configs?')) return
  store.clearAll()
}
</script>

<style scoped>
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
</style>
