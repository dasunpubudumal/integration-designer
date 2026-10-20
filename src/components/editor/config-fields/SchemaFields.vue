<template>
  <div class="form-group">
    <label>Spec Engine</label>
    <input value="jsonschema" readonly class="input-readonly" />
  </div>
  <div class="form-group">
    <label>Spec S3 URI</label>
    <input v-model="form.spec_s3_uri" placeholder="http://schema-registry.sanger.ac.uk/v1/" spellcheck="false" />
  </div>
  <div class="form-group">
    <label>Spec (JSON Schema)</label>
    <textarea
      v-model="form.spec"
      rows="12"
      placeholder='{"$schema": "https://json-schema.org/draft/2020-12/schema", "type": "object"}'
      spellcheck="false"
    />
    <div v-if="specError" class="hint-text hint-text--error">
      Invalid JSON, so it is output as typed: {{ specError }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Edits the shared config form in place; ConfigEditor autosaves it
const props = defineProps({ form: { type: Object, required: true } })

const specError = computed(() => {
  if (!props.form.spec.trim()) return ''
  try {
    JSON.parse(props.form.spec)
    return ''
  } catch (e) {
    return e.message
  }
})
</script>
