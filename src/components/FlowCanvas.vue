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
        <button class="zoom-reset" title="Reset zoom" @click="zoom = 1">{{ Math.round(zoom * 100) }}%</button>
      </div>

      <!-- Scrollable viewport: zoom and pan apply here, so the header above stays put -->
      <div
        ref="viewportEl"
        :class="['canvas-viewport', { 'is-panning': panStart }]"
        @wheel="handleWheel"
        @pointerdown="handlePanStart"
        @pointermove="handlePanMove"
        @pointerup="handlePanEnd"
        @pointercancel="handlePanEnd"
      >
        <!-- Pipeline (scaled; the sizer reserves the scaled footprint so scrolling works) -->
        <div
          ref="sizerEl"
          class="zoom-sizer"
          :style="{ width: viewportWidth * zoom + 'px', height: pipelineHeight * zoom + 'px' }"
        >
          <div
            ref="pipelineEl"
            class="pipeline"
            :style="{ width: viewportWidth + 'px', transform: `scale(${zoom})` }"
          >
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
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { useFlowStore } from '../stores/flows'
import StepCard from './StepCard.vue'

const store = useFlowStore()

const MIN_ZOOM = 0.25
const MAX_ZOOM = 2.5

const viewportEl = ref(null)
const sizerEl = ref(null)
const pipelineEl = ref(null)
const zoom = ref(1)
const viewportWidth = ref(0)
const pipelineHeight = ref(0)

const resizeObserver = new ResizeObserver(entries => {
  for (const entry of entries) {
    if (entry.target === viewportEl.value) viewportWidth.value = entry.contentRect.width
    else pipelineHeight.value = entry.target.offsetHeight
  }
})

onBeforeUnmount(() => resizeObserver.disconnect())

// Both elements only exist while a flow is open
watch([viewportEl, pipelineEl], (els, oldEls = []) => {
  oldEls.forEach(el => el && resizeObserver.unobserve(el))
  els.forEach(el => el && resizeObserver.observe(el))
})

// Zoom around the cursor: keep the content point under the pointer fixed on screen
async function handleWheel(e) {
  if (!sizerEl.value) return
  e.preventDefault()

  const oldZoom = zoom.value
  const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, oldZoom * Math.exp(-e.deltaY * 0.0015)))
  if (newZoom === oldZoom) return

  const before = sizerEl.value.getBoundingClientRect()
  const contentX = (e.clientX - before.left) / oldZoom
  const contentY = (e.clientY - before.top) / oldZoom

  zoom.value = newZoom
  await nextTick()

  const after = sizerEl.value.getBoundingClientRect()
  viewportEl.value.scrollLeft += after.left + contentX * newZoom - e.clientX
  viewportEl.value.scrollTop += after.top + contentY * newZoom - e.clientY
}

// Drag on empty background to pan the canvas
const panStart = ref(null)

function handlePanStart(e) {
  if (e.button !== 0 || !sizerEl.value) return
  if (e.target.closest('.step-card, .branch-labels, .flow-meta-row, button, input, textarea, select, a')) return
  e.preventDefault()
  viewportEl.value.setPointerCapture(e.pointerId)
  panStart.value = {
    x: e.clientX,
    y: e.clientY,
    scrollLeft: viewportEl.value.scrollLeft,
    scrollTop: viewportEl.value.scrollTop
  }
}

function handlePanMove(e) {
  if (!panStart.value) return
  viewportEl.value.scrollLeft = panStart.value.scrollLeft - (e.clientX - panStart.value.x)
  viewportEl.value.scrollTop = panStart.value.scrollTop - (e.clientY - panStart.value.y)
}

function handlePanEnd(e) {
  if (!panStart.value) return
  viewportEl.value.releasePointerCapture(e.pointerId)
  panStart.value = null
}

function handleDeleteStep(step) {
  if (!confirm(`Delete step "${step.stepId || step.id}"?`)) return
  store.deleteStep(step.id)
}

function handleAddStep() {
  const flow = store.selectedFlow
  if (!flow) return
  const stepId = `step_${flow.steps.length + 1}`

  // Every new step gets its own config, keyed after the step (made unique
  // since configs are shared across flows). Saved first so the editor loads it.
  const configKey = store.uniqueConfigKey(stepId)
  store.saveConfig(configKey, {
    version: 'v1.0.0',
    name: configKey,
    type: 'lambda_function',
    invocation_type: 'RequestResponse'
  })

  store.addStep({
    stepId,
    type: 'Operate',
    processor: '',
    input: '',
    configKey,
    next: 'END'
  })
}
</script>

<style scoped>
.canvas-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.canvas-viewport {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 24px;
  cursor: grab;
}

.canvas-viewport.is-panning {
  cursor: grabbing;
  user-select: none;
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

/* Zoom */
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

.zoom-sizer {
  margin: 0 auto;
}

/* Pipeline */
.pipeline {
  transform-origin: 0 0;
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
