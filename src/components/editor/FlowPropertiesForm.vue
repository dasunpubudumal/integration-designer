<template>
  <div class="section-header">Flow Properties</div>
  <div class="editor-section">
    <div class="form-group">
      <label>Flow Name</label>
      <input v-model="form.name" spellcheck="false" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Method</label>
        <SelectMenu v-model="form.method" :options="HTTP_METHODS" />
      </div>
      <div class="form-group">
        <label>Version</label>
        <input v-model="form.version" />
      </div>
    </div>
    <div class="form-group">
      <label>Path</label>
      <input v-model="form.path" spellcheck="false" />
    </div>
    <div class="form-group">
      <label>Layer</label>
      <input v-model="form.layer" />
    </div>
    <div class="form-group">
      <label>Start Step</label>
      <SelectMenu
        v-model="form.start"
        :options="[{ value: '', label: 'None' }, ...store.allStepIds]"
        placeholder="Select a step"
      />
    </div>

    <div class="form-group">
      <label>
        <input type="checkbox" v-model="hasExecution" @change="onExecutionToggle" style="width:auto;margin-right:5px" />
        Batch Execution
      </label>
    </div>
    <template v-if="hasExecution && form.execution">
      <div class="form-group">
        <label>Execution Type</label>
        <input v-model="form.execution.type" placeholder="batch" />
      </div>
      <div class="form-group">
        <label>Batch Input Path</label>
        <input v-model="form.execution.batch_input_path" placeholder="body.Records" />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useFlowStore } from '../../stores/flows'
import { useAutosave } from '../../composables/useAutosave'
import { HTTP_METHODS } from '../../utils/httpMethods'
import SelectMenu from '../common/SelectMenu.vue'

const store = useFlowStore()

const form = reactive({
  name: '',
  version: '',
  method: 'GET',
  path: '',
  layer: '',
  start: '',
  execution: null
})
const hasExecution = ref(false)

const withoutAutosave = useAutosave([form, hasExecution], save)

function save() {
  if (!store.selectedFlow) return
  store.updateFlow(store.selectedFlow.id, {
    ...form,
    execution: hasExecution.value ? { ...form.execution } : null
  })
}

function load(flow) {
  if (!flow) return
  form.name = flow.name || ''
  form.version = flow.version || ''
  form.method = flow.method || 'GET'
  form.path = flow.path || ''
  form.layer = flow.layer || ''
  form.start = flow.start || ''
  hasExecution.value = !!flow.execution
  form.execution = flow.execution ? { ...flow.execution } : null
}

// Re-load only when another flow is selected: saving replaces the store
// object, so watching the object itself would re-load on every keystroke.
// (This form is re-mounted on returning from a step, which also picks up a
// start step changed by renaming that step.)
watch(
  () => store.selectedFlow?.id,
  () => withoutAutosave(() => load(store.selectedFlow)),
  { immediate: true }
)

function onExecutionToggle() {
  form.execution = hasExecution.value ? { type: 'batch', batch_input_path: '' } : null
}
</script>
