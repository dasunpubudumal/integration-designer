<template>
  <div class="subsection-header">On-Error-Continue</div>
  <div class="form-group">
    <label>
      <input type="checkbox" v-model="form.oecEnabled" style="width:auto;margin-right:5px" />
      Enable on-error-continue
    </label>
  </div>
  <template v-if="form.oecEnabled">
    <div class="form-group">
      <label>Exceptions (comma-separated)</label>
      <input v-model="form.oecExceptions" placeholder="Exception, RuntimeError" spellcheck="false" />
    </div>
    <div class="form-group">
      <label>Next on error</label>
      <SelectMenu v-model="form.oecNext" :options="nextOptions" editable placeholder="END or step ID" />
    </div>
  </template>
</template>

<script setup>
import SelectMenu from '../common/SelectMenu.vue'

// Edits the step form's oec* fields in place; the parent's autosave picks up the changes
defineProps({
  form: { type: Object, required: true },
  nextOptions: { type: Array, required: true }
})
</script>
