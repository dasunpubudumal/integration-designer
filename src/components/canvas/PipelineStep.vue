<template>
  <div class="pipeline-step-row">
    <StepCard
      :step="step"
      :is-selected="isSelected"
      @select="$emit('select')"
      @move="dir => $emit('move', dir)"
      @delete="$emit('delete')"
    />
    <!-- Output checks, hung off the card's right edge so the card stays on
         the pipeline's centre line, aligned with the connectors -->
    <div v-if="checks.length > 0" class="branch-labels">
      <div v-for="[name, check] in checks" :key="name" class="branch-label">
        <span class="branch-tick">&#10003;</span>
        <span class="branch-name">{{ name }}</span>
        <span class="branch-arrow">&#8594;</span>
        <span class="branch-dest mono">{{ check.next }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import StepCard from './StepCard.vue'

const props = defineProps({
  step: { type: Object, required: true },
  isSelected: { type: Boolean, default: false }
})
defineEmits(['select', 'move', 'delete'])

const checks = computed(() => Object.entries(props.step.output?.checks || {}))
</script>

<style scoped>
.pipeline-step-row {
  position: relative;
  display: flex;
  justify-content: center;
  width: 100%;
  max-width: 520px;
}

.branch-labels {
  position: absolute;
  top: 0;
  left: calc(100% + 16px);
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 8px;
}

.branch-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
}

.branch-tick { color: var(--green); }
.branch-name { color: var(--green); font-weight: 600; }
.branch-arrow { color: var(--border); }
.branch-dest { color: var(--blue); }
</style>
