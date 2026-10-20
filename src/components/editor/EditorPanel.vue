<template>
  <div class="editor-inner">
    <div v-if="!store.selectedFlow" class="editor-empty">
      <p>Select a flow to edit its properties.</p>
    </div>

    <FlowPropertiesForm v-else-if="!store.selectedStep" />

    <template v-else>
      <StepPropertiesForm />
      <ConfigEditor />
    </template>
  </div>
</template>

<script setup>
import { useFlowStore } from '../../stores/flows'
import FlowPropertiesForm from './FlowPropertiesForm.vue'
import StepPropertiesForm from './StepPropertiesForm.vue'
import ConfigEditor from './ConfigEditor.vue'

const store = useFlowStore()
</script>

<style scoped>
.editor-inner {
  padding-bottom: 24px;
}

.editor-empty {
  padding: 32px 16px;
  color: var(--text-muted);
  font-size: 13px;
  text-align: center;
}
</style>
