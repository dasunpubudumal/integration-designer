<template>
  <div class="form-group">
    <label>Engine</label>
    <input value="jmespath" readonly class="input-readonly" />
  </div>
  <div class="form-group">
    <label>Spec (JMESPath expression)</label>
    <textarea v-model="form.spec" rows="4" placeholder="{request: body}" spellcheck="false" />
  </div>
</template>

<script setup>
// Edits the shared config form in place; ConfigEditor autosaves it
defineProps({ form: { type: Object, required: true } })
</script>
