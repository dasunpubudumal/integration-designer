<template>
  <div class="flow-meta-row">
    <span :class="['badge', 'badge-' + flow.method]">{{ flow.method }}</span>
    <span class="flow-meta-path mono">{{ flow.path }}</span>
    <span class="flow-meta-pill">{{ flow.version }}</span>
    <span class="flow-meta-pill">{{ flow.layer }}</span>
    <span v-if="flow.execution" class="flow-meta-pill">{{ flow.execution.type }}</span>
    <button class="zoom-reset" title="Reset zoom" @click="$emit('reset-zoom')">{{ Math.round(zoom * 100) }}%</button>
  </div>
</template>

<script setup>
// The fixed header above the canvas: method, path, version, layer, execution
// type and the zoom level (click to reset)
defineProps({
  flow: { type: Object, required: true },
  zoom: { type: Number, required: true }
})
defineEmits(['reset-zoom'])
</script>

<style scoped>
.flow-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  flex-shrink: 0;
  padding: 14px 24px;
  border-bottom: 1px solid var(--border);
}

.flow-meta-path {
  font-size: 13px;
  color: var(--text);
  font-weight: 500;
}

.flow-meta-pill {
  font-size: 11px;
  color: var(--text-muted);
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 3px;
  padding: 1px 6px;
}

.zoom-reset {
  margin-left: auto;
  font-size: 11px;
  color: var(--text-muted);
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 3px;
  padding: 1px 6px;
  cursor: pointer;
}
.zoom-reset:hover {
  color: var(--text);
}
</style>
