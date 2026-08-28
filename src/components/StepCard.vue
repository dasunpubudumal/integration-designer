<template>
  <div
    class="step-card"
    :class="['step-card--' + step.type.toLowerCase(), { selected: isSelected }]"
    @click="$emit('select')"
  >
    <!-- Header -->
    <div class="step-card-header">
      <span class="step-type-badge" :style="{ background: typeColor + '22', color: typeColor }">
        {{ step.type }}
      </span>
      <span class="step-id truncate" :title="step.stepId">{{ step.stepId || '(unnamed)' }}</span>
      <div class="step-actions" @click.stop>
        <button class="step-action-btn" title="Move up" @click="$emit('move', 'up')">▲</button>
        <button class="step-action-btn" title="Move down" @click="$emit('move', 'down')">▼</button>
        <button class="step-action-btn danger" title="Delete step" @click="$emit('delete')">✕</button>
      </div>
    </div>

    <!-- Body -->
    <div class="step-card-body">
      <div class="step-field" v-if="step.processor">
        <span class="step-field-label">processor</span>
        <span class="step-field-value mono truncate" :title="step.processor">{{ step.processor }}</span>
      </div>
      <div class="step-field" v-if="step.input">
        <span class="step-field-label">input</span>
        <span class="step-field-value mono truncate" :title="step.input">{{ step.input }}</span>
      </div>
      <div class="step-field" v-if="step.configKey">
        <span class="step-field-label">config</span>
        <span class="step-field-value mono truncate">@{{ step.configKey }}</span>
      </div>
      <div class="step-field">
        <span class="step-field-label">next</span>
        <span class="step-field-value mono truncate" :class="{ 'next-end': step.next === 'END' }">{{ step.next || 'END' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  step: { type: Object, required: true },
  isSelected: { type: Boolean, default: false }
})

defineEmits(['select', 'move', 'delete'])

const typeColor = computed(() => {
  switch (props.step.type) {
    case 'Route': return '#3b82f6'
    case 'Operate': return '#10b981'
    case 'Transform': return '#f59e0b'
    default: return '#94a3b8'
  }
})
</script>

<style scoped>
.step-card {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px;
  border-left: 4px solid var(--border);
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  width: 100%;
  max-width: 520px;
}

.step-card:hover {
  border-color: var(--text-muted);
}

.step-card.selected {
  border-color: var(--accent) !important;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.25);
}

.step-card--route    { border-left-color: #3b82f6; }
.step-card--operate  { border-left-color: #10b981; }
.step-card--transform { border-left-color: #f59e0b; }

.step-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px 6px;
  border-bottom: 1px solid var(--border);
}

.step-type-badge {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.step-id {
  flex: 1;
  font-size: 12px;
  font-weight: 600;
  font-family: var(--font-mono);
  min-width: 0;
}

.step-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.step-action-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 2px 5px;
  border-radius: 3px;
  font-size: 10px;
  transition: color 0.12s, background 0.12s;
}
.step-action-btn:hover {
  color: var(--text);
  background: var(--surface3);
}
.step-action-btn.danger:hover {
  color: var(--red);
}

.step-card-body {
  padding: 6px 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.step-field {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.step-field-label {
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 600;
  flex-shrink: 0;
  width: 52px;
  text-align: right;
}

.step-field-value {
  font-size: 11px;
  color: var(--text);
  min-width: 0;
  flex: 1;
}

.mono { font-family: var(--font-mono); }
.truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.next-end {
  color: var(--text-muted);
  font-style: italic;
}
</style>
