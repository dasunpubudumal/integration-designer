<template>
  <div class="canvas-inner">
    <!-- Empty state -->
    <div v-if="!store.selectedFlow" class="canvas-empty">
      <div class="canvas-empty-icon">&#11042;</div>
      <div>Select a flow from the sidebar or create a new one.</div>
    </div>

    <template v-else>
      <!-- Flow meta pills -->
      <div class="flow-meta-row">
        <span :class="['badge', 'badge-' + store.selectedFlow.method]">{{ store.selectedFlow.method }}</span>
        <span class="flow-meta-path mono">{{ store.selectedFlow.path }}</span>
        <span class="flow-meta-version">{{ store.selectedFlow.version }}</span>
        <span class="flow-meta-layer">{{ store.selectedFlow.layer }}</span>
        <span v-if="store.selectedFlow.execution" class="flow-meta-exec">
          {{ store.selectedFlow.execution.type }}
        </span>
      </div>

      <!-- Pipeline -->
      <div class="pipeline">
        <!-- START node -->
        <div class="pipeline-node node-start">
          <div class="node-circle">START</div>
        </div>
        <div class="pipeline-connector"></div>

        <!-- Steps -->
        <template v-for="(step, idx) in store.selectedFlow.steps" :key="step.id">
          <div class="pipeline-step-row">
            <StepCard
              :step="step"
              :is-selected="step.id === store.selectedStepId"
              @select="store.selectStep(step.id)"
              @move="dir => store.moveStep(step.id, dir)"
              @delete="handleDeleteStep(step)"
            />
            <!-- Branch labels for output checks -->
            <div v-if="step.output && step.output.checks && Object.keys(step.output.checks).length > 0" class="branch-labels">
              <div v-for="(check, checkName) in step.output.checks" :key="checkName" class="branch-label">
                <span class="branch-tick">&#10003;</span>
                <span class="branch-name">{{ checkName }}</span>
                <span class="branch-arrow">&#8594;</span>
                <span class="branch-dest mono">{{ check.next }}</span>
              </div>
            </div>
          </div>
          <div v-if="idx < store.selectedFlow.steps.length - 1" class="pipeline-connector"></div>
        </template>

        <!-- Connector to END -->
        <div v-if="store.selectedFlow.steps.length > 0" class="pipeline-connector"></div>

        <!-- END node -->
        <div class="pipeline-node node-end">
          <div class="node-circle node-circle--end">END</div>
        </div>

        <!-- Add Step button -->
        <div class="pipeline-add">
          <button class="btn btn-secondary add-step-btn" @click="handleAddStep">+ Add Step</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { useFlowStore } from '../stores/flows'
import StepCard from './StepCard.vue'

const store = useFlowStore()

function handleDeleteStep(step) {
  if (!confirm(`Delete step "${step.stepId || step.id}"?`)) return
  store.deleteStep(step.id)
}

function handleAddStep() {
  const flow = store.selectedFlow
  if (!flow) return
  const num = flow.steps.length + 1
  store.addStep({
    stepId: `step_${num}`,
    type: 'Operate',
    processor: '',
    input: '',
    configKey: '',
    next: 'END'
  })
}
</script>

<style scoped>
.canvas-inner {
  min-height: 100%;
}

/* Empty state */
.canvas-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 100%;
  min-height: 400px;
  color: var(--text-muted);
  font-size: 14px;
}

.canvas-empty-icon {
  font-size: 48px;
  color: var(--border);
}

/* Flow meta */
.flow-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.flow-meta-path {
  font-size: 13px;
  color: var(--text);
  font-weight: 500;
}

.flow-meta-version,
.flow-meta-layer,
.flow-meta-exec {
  font-size: 11px;
  color: var(--text-muted);
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 3px;
  padding: 1px 6px;
}

/* Pipeline */
.pipeline {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

.pipeline-node {
  display: flex;
  align-items: center;
  justify-content: center;
}

.node-circle {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--surface2);
  border: 2px solid var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: 0.05em;
}

.node-circle--end {
  border-color: var(--text-muted);
  color: var(--text-muted);
}

.pipeline-connector {
  width: 2px;
  height: 24px;
  background: var(--accent);
  flex-shrink: 0;
  position: relative;
}
.pipeline-connector::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid var(--accent);
}

.pipeline-step-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  width: 100%;
  max-width: 700px;
  justify-content: center;
}

/* Branch labels */
.branch-labels {
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

/* Add step */
.pipeline-add {
  margin-top: 20px;
}

.add-step-btn {
  font-size: 12px;
}
</style>
