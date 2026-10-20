<template>
  <div class="subsection-header">
    Output Checks
    <button class="btn btn-ghost btn-sm" @click="addCheck">+ Check</button>
  </div>
  <div v-if="Object.keys(form.outputChecks).length > 0">
    <div class="form-group">
      <label>Output Value Expression</label>
      <input v-model="form.outputValue" placeholder="@" />
    </div>
    <div v-for="(check, name) in form.outputChecks" :key="name" class="check-block">
      <div class="check-header">
        <input
          class="check-name-input"
          :value="name"
          @blur="renameCheck(name, $event.target.value)"
          placeholder="check name"
          spellcheck="false"
        />
        <button class="btn btn-ghost btn-sm btn-remove" @click="removeCheck(name)">✕</button>
      </div>
      <div class="form-group" style="margin-top:4px">
        <label>Predicate</label>
        <textarea v-model="check.predicate" rows="2" placeholder="JMESPath expression" spellcheck="false" />
      </div>
      <div class="form-group">
        <label>Next (if true)</label>
        <SelectMenu v-model="check.next" :options="nextOptions" editable placeholder="END or step ID" />
      </div>
    </div>
  </div>
  <div v-else class="hint-text">No output checks.</div>
</template>

<script setup>
import SelectMenu from '../common/SelectMenu.vue'

// Edits the step form's outputChecks/outputValue in place; the parent's
// autosave picks up the changes
const props = defineProps({
  form: { type: Object, required: true },
  nextOptions: { type: Array, required: true }
})

function addCheck() {
  const checks = props.form.outputChecks
  checks[`check_${Object.keys(checks).length + 1}`] = { predicate: '', next: 'END' }
}

function removeCheck(name) {
  delete props.form.outputChecks[name]
}

function renameCheck(oldName, newName) {
  if (!newName || newName === oldName) return
  const checks = props.form.outputChecks
  const value = checks[oldName]
  delete checks[oldName]
  checks[newName] = value
}
</script>
