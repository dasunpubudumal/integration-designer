<template>
  <div class="form-group">
    <label>Operation</label>
    <input v-model="form.operation" placeholder="send_message" />
  </div>
  <div class="form-group">
    <label>Queue Name</label>
    <input v-model="form.queue_name" placeholder="env:MY_QUEUE_NAME" spellcheck="false" />
  </div>
</template>

<script setup>
// Edits the shared config form in place; ConfigEditor autosaves it
defineProps({ form: { type: Object, required: true } })
</script>
