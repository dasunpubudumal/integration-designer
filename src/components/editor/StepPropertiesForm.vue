<template>
  <div class="section-header section-header--with-action">
    <span>Step Properties</span>
    <button class="btn btn-ghost btn-sm" @click="store.selectStep(null)">&#8592; Flow</button>
  </div>
  <div class="editor-section">
    <div class="form-group">
      <label>Step ID</label>
      <input v-model="form.stepId" spellcheck="false" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Type</label>
        <SelectMenu v-model="form.type" :options="STEP_TYPE_OPTIONS" @change="onTypeChange" />
      </div>
      <div class="form-group">
        <label>Next</label>
        <SelectMenu v-model="form.next" :options="nextOptions" editable placeholder="END or step ID" />
      </div>
    </div>

    <div class="form-group">
      <label>Processor</label>
      <SelectMenu
        v-model="form.processor"
        :options="processorsFor(form.type)"
        editable
        placeholder="processor class path"
        :empty-text="`No suggested processors for ${form.type} steps yet. Type a class path.`"
      />
    </div>

    <div class="form-group">
      <label>Input Expression</label>
      <textarea
        v-model="form.input"
        rows="2"
        placeholder="e.g. step.init.input  or  {body: step.x.output}"
        spellcheck="false"
      />
    </div>

    <OutputChecksEditor :form="form" :next-options="nextOptions" />
    <OnErrorContinueEditor :form="form" :next-options="nextOptions" />
  </div>
</template>

<script setup>
import { reactive, computed, watch } from 'vue'
import { useFlowStore } from '../../stores/flows'
import { useAutosave } from '../../composables/useAutosave'
import { STEP_TYPES, stepTypeColor } from '../../utils/stepTypes'
import { processorsFor } from '../../config/processors'
import SelectMenu from '../common/SelectMenu.vue'
import OutputChecksEditor from './OutputChecksEditor.vue'
import OnErrorContinueEditor from './OnErrorContinueEditor.vue'

const STEP_TYPE_OPTIONS = STEP_TYPES.map(t => ({ value: t, label: t, color: stepTypeColor(t) }))

const store = useFlowStore()

const form = reactive({
  stepId: '',
  type: 'Operate',
  processor: '',
  input: '',
  next: 'END',
  outputChecks: {},
  outputValue: '@',
  oecEnabled: false,
  oecExceptions: '',
  oecNext: ''
})

const nextOptions = computed(() => ['END', ...store.allStepIds])

const withoutAutosave = useAutosave(form, save)

function save() {
  const step = store.selectedStep
  if (!step) return
  const hasChecks = Object.keys(form.outputChecks).length > 0
  const exceptions = form.oecExceptions
    ? form.oecExceptions.split(',').map(s => s.trim()).filter(Boolean)
    : []

  store.updateStep(step.id, {
    stepId: form.stepId,
    type: form.type,
    processor: form.processor,
    input: form.input,
    next: form.next,
    output: hasChecks
      ? { value: form.outputValue, checks: JSON.parse(JSON.stringify(form.outputChecks)) }
      : null,
    onErrorContinue: form.oecEnabled
      ? { enabled: true, exceptions, next: form.oecNext }
      : null
  })
}

function load(step) {
  if (!step) return
  form.stepId = step.stepId || ''
  form.type = step.type || 'Operate'
  form.processor = step.processor || ''
  form.input = step.input || ''
  form.next = step.next || 'END'

  const checks = step.output?.checks
  form.outputChecks = checks ? JSON.parse(JSON.stringify(checks)) : {}
  form.outputValue = (checks && step.output.value) || '@'

  const oec = step.onErrorContinue?.enabled ? step.onErrorContinue : null
  form.oecEnabled = !!oec
  form.oecExceptions = oec ? (oec.exceptions || []).join(', ') : ''
  form.oecNext = oec?.next || ''
}

// Re-load only when another step is selected; saving replaces the store
// object, so watching it would re-load mid-typing and undo input
watch(
  () => store.selectedStep?.id,
  () => withoutAutosave(() => load(store.selectedStep)),
  { immediate: true }
)

// Suggest a processor when the type changes and none is set
function onTypeChange() {
  if (!form.processor) form.processor = processorsFor(form.type)[0] || ''
}
</script>
