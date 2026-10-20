<template>
  <div class="app-shell">
    <AppTopBar />

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
import AppTopBar from './components/layout/AppTopBar.vue'
import FlowSidebar from './components/sidebar/FlowSidebar.vue'
import FlowCanvas from './components/canvas/FlowCanvas.vue'
import EditorPanel from './components/editor/EditorPanel.vue'
import OutputPanel from './components/output/OutputPanel.vue'
</script>

<style scoped>
/* ── Shell ───────────────────────────────────────────────────────────────── */
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
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
  overflow: hidden;
  background: var(--bg);
  min-width: 0;
}

.editor {
  width: 380px;
  flex-shrink: 0;
  border-left: 1px solid var(--border);
  overflow-y: auto;
  background: var(--surface);
}
</style>
