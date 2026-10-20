<template>
  <div class="flow-item" :class="{ active }" @click="$emit('select')">
    <div class="flow-item-main">
      <span :class="['badge', 'badge-' + flow.method]">{{ flow.method }}</span>
      <span class="flow-name truncate" :title="flow.name">{{ flow.name }}</span>
    </div>
    <div class="flow-item-meta">
      <span class="flow-path truncate text-muted" :title="flow.path">{{ flow.path }}</span>
      <button class="btn btn-ghost btn-sm flow-delete" @click.stop="$emit('delete')" title="Delete flow">✕</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  flow: { type: Object, required: true },
  active: { type: Boolean, default: false }
})
defineEmits(['select', 'delete'])
</script>

<style scoped>
.flow-item {
  padding: 8px 14px;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: background 0.12s, border-color 0.12s;
}

.flow-item:hover {
  background: var(--surface2);
}

.flow-item.active {
  background: var(--surface2);
  border-left-color: var(--accent);
}

.flow-item-main {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 3px;
}

.flow-name {
  font-size: 12px;
  font-weight: 500;
  max-width: 160px;
}

.flow-item-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 2px;
}

.flow-path {
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  max-width: 140px;
}

.flow-delete {
  opacity: 0;
  transition: opacity 0.12s;
  color: var(--red);
  padding: 1px 5px;
  font-size: 10px;
}

.flow-item:hover .flow-delete {
  opacity: 1;
}

.text-muted {
  color: var(--text-muted);
}
</style>
