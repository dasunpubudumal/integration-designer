<template>
  <div class="subsection-header">
    Rules
    <button class="btn btn-ghost btn-sm" @click="addRule">+ Rule</button>
  </div>
  <div v-for="(rule, ruleName) in form.rules" :key="ruleName" class="check-block">
    <div class="check-header">
      <input
        class="check-name-input"
        :value="ruleName"
        @blur="renameRule(ruleName, $event.target.value)"
        placeholder="rule name"
        spellcheck="false"
      />
      <button class="btn btn-ghost btn-sm btn-remove" @click="removeRule(ruleName)">✕</button>
    </div>
    <div class="form-row" style="margin-top:4px">
      <div class="form-group">
        <label>Field</label>
        <input v-model="rule.field" placeholder="httpMethod" spellcheck="false" />
      </div>
      <div class="form-group">
        <label>Value</label>
        <input v-model="rule.value" placeholder="GET" />
      </div>
    </div>
    <div class="form-group">
      <label>Destination</label>
      <SelectMenu v-model="rule.destination" :options="store.allStepIds" editable placeholder="step ID" />
    </div>
  </div>
</template>

<script setup>
import { useFlowStore } from '../../../stores/flows'
import SelectMenu from '../../common/SelectMenu.vue'

// Edits the shared config form in place; ConfigEditor autosaves it
const props = defineProps({ form: { type: Object, required: true } })
const store = useFlowStore()

function addRule() {
  const rules = props.form.rules
  rules[`rule_${Object.keys(rules).length + 1}`] = { field: '', value: '', destination: '' }
}

function removeRule(name) {
  delete props.form.rules[name]
}

function renameRule(oldName, newName) {
  if (!newName || newName === oldName) return
  const rules = props.form.rules
  const value = rules[oldName]
  delete rules[oldName]
  rules[newName] = value
}
</script>
