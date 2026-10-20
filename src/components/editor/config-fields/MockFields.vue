<template>
  <div class="form-group">
    <label>Mock File Path</label>
    <input v-model="form.file" placeholder="mocks/response.json" spellcheck="false" />
  </div>
</template>

<script setup>
// Edits the shared config form in place; ConfigEditor autosaves it
defineProps({ form: { type: Object, required: true } })
</script>
