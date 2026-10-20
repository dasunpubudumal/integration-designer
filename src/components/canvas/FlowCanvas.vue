<template>
  <div class="canvas-inner">
    <!-- Empty state -->
    <div v-if="!store.selectedFlow" class="canvas-empty">
      <div class="canvas-empty-icon">&#11042;</div>
      <div>Select a flow from the sidebar or create a new one.</div>
    </div>

    <template v-else>
      <FlowHeader :flow="store.selectedFlow" :zoom="zoom" @reset-zoom="resetZoom" />

      <!-- Scrollable viewport: zoom and pan apply here, so the header above stays put -->
      <div
        ref="viewportEl"
        :class="['canvas-viewport', { 'is-panning': panStart }]"
        @wheel="onWheel"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <!-- The sizer reserves the scaled footprint so scrolling covers it -->
        <div
          ref="sizerEl"
          class="zoom-sizer"
          :style="{ width: viewportWidth * zoom + 'px', height: contentHeight * zoom + 'px' }"
        >
          <div
            ref="contentEl"
            class="pipeline"
            :style="{ width: viewportWidth + 'px', transform: `scale(${zoom})` }"
          >
            <div class="pipeline-node">
              <div class="node-circle">START</div>
            </div>
            <div class="pipeline-connector"></div>

            <template v-for="(step, idx) in store.selectedFlow.steps" :key="step.id">
              <PipelineStep
                :step="step"
                :is-selected="step.id === store.selectedStepId"
                @select="store.selectStep(step.id)"
                @move="dir => store.moveStep(step.id, dir)"
                @delete="deleteStep(step)"
              />
              <div v-if="idx < store.selectedFlow.steps.length - 1" class="pipeline-connector"></div>
            </template>

            <div v-if="store.selectedFlow.steps.length > 0" class="pipeline-connector"></div>
            <div class="pipeline-node">
              <div class="node-circle node-circle--end">END</div>
            </div>

            <div class="pipeline-add">
              <button class="btn btn-secondary add-step-btn" @click="store.addNewStep()">+ Add Step</button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { useFlowStore } from '../../stores/flows'
import { useCanvasZoomPan } from '../../composables/useCanvasZoomPan'
import FlowHeader from './FlowHeader.vue'
import PipelineStep from './PipelineStep.vue'

const store = useFlowStore()

const {
  viewportEl, sizerEl, contentEl,
  zoom, viewportWidth, contentHeight, panStart, resetZoom,
  onWheel, onPointerDown, onPointerMove, onPointerUp
} = useCanvasZoomPan({ ignorePanFrom: '.step-card, .branch-labels, button, input, textarea, select, a' })

function deleteStep(step) {
  if (!confirm(`Delete step "${step.stepId || step.id}"?`)) return
  store.deleteStep(step.id)
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

/* Centres the pipeline while it's narrower than the viewport */
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

/* Add step */
.pipeline-add {
  margin-top: 20px;
}

.add-step-btn {
  font-size: 12px;
}
</style>
