<template>
  <div class="form-row">
    <div class="form-group">
      <label>Operation</label>
      <input v-model="form.operation" placeholder="publish" />
    </div>
    <div class="form-group">
      <label>Max Retries</label>
      <input v-model.number="form.max_retries" type="number" min="0" />
    </div>
  </div>
  <div class="form-group">
    <label>Topic ARN</label>
    <input v-model="form.topic_arn" placeholder="env:MY_SNS_TOPIC_ARN" spellcheck="false" />
  </div>
  <div class="form-row">
    <div class="form-group">
      <label>Message Structure</label>
      <input v-model="form.message_structure" placeholder="json" />
    </div>
    <div class="form-group">
      <label>Input Path</label>
      <input v-model="form.input_path" placeholder="@" spellcheck="false" />
    </div>
  </div>

  <div class="subsection-header">
    Message Attributes
    <button class="btn btn-ghost btn-sm" @click="addAttribute">+ Attribute</button>
  </div>
  <div v-for="(attr, idx) in form.message_attributes" :key="idx" class="check-block">
    <div class="check-header">
      <input v-model="attr.name" class="check-name-input" placeholder="attribute name" spellcheck="false" />
      <button class="btn btn-ghost btn-sm btn-remove" @click="form.message_attributes.splice(idx, 1)">✕</button>
    </div>
    <div class="form-row" style="margin-top:4px">
      <div class="form-group">
        <label>Path</label>
        <input v-model="attr.path" placeholder="messageVersion" spellcheck="false" />
      </div>
      <div class="form-group">
        <label>Default</label>
        <input v-model="attr.default" placeholder="v1.0.0" />
      </div>
    </div>
    <div class="form-group">
      <label>Data Type</label>
      <SelectMenu v-model="attr.data_type" :options="['String', 'String.Array', 'Number', 'Binary']" />
    </div>
  </div>
  <div v-if="form.message_attributes.length === 0" class="hint-text">No message attributes.</div>
</template>

<script setup>
import SelectMenu from '../../common/SelectMenu.vue'

// Edits the shared config form in place; ConfigEditor autosaves it
const props = defineProps({ form: { type: Object, required: true } })

function addAttribute() {
  props.form.message_attributes.push({ name: '', path: '', default: '', data_type: 'String' })
}
</script>
