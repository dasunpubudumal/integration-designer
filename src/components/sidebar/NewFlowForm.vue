<template>
  <div class="new-flow-form">
    <div class="form-group">
      <label>Flow Name</label>
      <input v-model="form.name" placeholder="get_studies/v1" spellcheck="false" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Method</label>
        <SelectMenu v-model="form.method" :options="HTTP_METHODS" />
      </div>
      <div class="form-group">
        <label>Version</label>
        <input v-model="form.version" placeholder="v0.1" />
      </div>
    </div>
    <div class="form-group">
      <label>Path</label>
      <input v-model="form.path" placeholder="/studies/v1" />
    </div>
    <div class="form-group">
      <label>Layer</label>
      <input v-model="form.layer" placeholder="PAPI" />
    </div>
    <div class="new-flow-actions">
      <button class="btn btn-primary btn-sm" @click="create">Create</button>
      <button class="btn btn-ghost btn-sm" @click="$emit('done')">Cancel</button>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useFlowStore } from '../../stores/flows'
import { HTTP_METHODS } from '../../utils/httpMethods'
import SelectMenu from '../common/SelectMenu.vue'

// Mounted fresh each time it's opened, so it always starts blank
const emit = defineEmits(['done'])
const store = useFlowStore()

const form = reactive({ name: '', method: 'GET', version: 'v0.1', path: '', layer: 'PAPI' })

function create() {
  if (!form.name.trim()) return
  store.createFlow({ ...form })
  emit('done')
}
</script>

<style scoped>
.new-flow-form {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  background: var(--surface2);
}

.new-flow-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}
</style>
